import { Injectable, Logger } from '@nestjs/common';
import { SmsBodyDto, SMSMessageTypes } from '../../dto/sms.body';
import { Validate, Validator } from '@cassbana/projectx-nest-shared';
import axios from 'axios';
import { ISMSProvider } from './sms.service';
import {
  Counter,
  Histogram,
  ObservableGauge,
  ObservableResult,
} from '@opentelemetry/api-metrics';
import { MetricService } from 'nestjs-otel';
import { InjectModel } from '@nestjs/mongoose';
import { Message } from '../../shared/schema/message';
import { Model } from 'mongoose';
import { ArpuPlusMessageDto } from 'src/dto/arpuplus';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProviderError } from './../../shared/providerError';
import {
  SenderId,
  serviceSenderNameMap,
  ARPUPLUS_PROVIDER_CONFIG,
} from './arpuplus.config';
import { MESSAGE_STATUS } from '../../shared/enums/message-status';
import {
  MessageCallbackDto,
  Status,
} from '../../arpuplus-callback-controller/MessageCallbackDto';

@Injectable()
export class ArpuPlusService implements ISMSProvider {
  readonly providerName = 'arpuplus';
  logger = new Logger(ArpuPlusService.name);
  readonly successCounter: Counter;
  readonly failedCounter: Counter;
  private readonly histogram: Histogram;
  balanceObserver: ObservableGauge;
  private latestBalance: number;
  private static numberOfFails = 0;

  constructor(
    private metricService: MetricService,
    @InjectModel(Message.name) private messageModel: Model<Message>,
  ) {
    this.successCounter = this.metricService.getCounter(
      'arpuplus_success_messages_counter',
      {
        description: 'arpuplus success messages api sent messages',
      },
    );
    this.failedCounter = this.metricService.getCounter(
      'arpuplus_failed_messages_counter',
      {
        description: 'arpuplus failed messages api sent messages',
      },
    );
    this.histogram = metricService.getHistogram('sms_time_to_deliver', {
      description: 'Time to devliver sms messages histogram',
    });
    this.balanceObserver = this.metricService.getObservableGauge(
      'arpuplus_balance_gauge',
      { description: 'sms provider account credit balance gauge', unit: 'EGP' },
      (observableResult: ObservableResult) => {
        observableResult.observe(this.latestBalance, {
          provider: this.providerName,
        });
      },
    );
  }
  @Validate()
  sendMessage(@Validator() message: SmsBodyDto) {
    this.logger.log(`${message.phoneNumber}: ${message.message}`);
    let senderName = '';
    if (message.senderId) {
      senderName = message.senderId;
    } else {
      senderName = serviceSenderNameMap[message.service] ?? SenderId.CashKateb;
    }

    let params = {
      account_id: Number(ARPUPLUS_PROVIDER_CONFIG.acountId),
      text: message.message,
      msisdn: message.phoneNumber.substring(1),
      sender: senderName,
      dlr_type: 1,
      dlr_url: process.env.HOST + '/arpuplus/callback',
      priority: 2, //for medium priority
    };

    if (message.type == SMSMessageTypes.otp) {
      params.priority = 3; //for high priority
    }
    return this.sendSMS(params);
  }

  private async sendSMS(params: ArpuPlusMessageDto) {
    try {
      const response = await axios({
        method: 'POST',
        data: params,
        url: `${ARPUPLUS_PROVIDER_CONFIG.baseHost}/sms/single`,
        headers: this.getHeaders(),
      });

      //if the service provicer return the message id and status is true then success
      if (response.data.messageId != 0 && response.data.status) {
        this.successCounter.add(1);
        return response.data;
      }

      this.failedCounter.add(1);
      throw new ProviderError(JSON.stringify(response.data));
    } catch (error) {
      this.logger.error(error.message);
      this.failedCounter.add(1);
      this.incrementNumberOfFailures();
      this.logger.log(
        `Current number of failures is ${ArpuPlusService.numberOfFails}`,
      );
      throw error;
    }
  }

  async updateMessageStatus(@Validator() dto: MessageCallbackDto) {
    this.logger.log(Number(dto.messageId));
    const message = await this.messageModel.findOne({
      'providerResponse.message_id': Number(dto.messageId),
    });

    if (dto.status == Status.DELIVERED) {
      message.status = MESSAGE_STATUS.DELIVERED;
    } else {
      message.status = MESSAGE_STATUS.UNDELIVERED;
    }
    message.providerResponse.callbackResponse = dto;
    message.markModified('providerResponse');
    message.updatedAt = new Date();
    message.save();
    return 'Success';
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async getBalance() {
    try {
      const response = await axios({
        method: 'POST',
        data: {
          account_id: ARPUPLUS_PROVIDER_CONFIG.acountId,
        },
        url: `${ARPUPLUS_PROVIDER_CONFIG.baseHost}/account/balance`,
        headers: this.getHeaders(),
      });

      this.latestBalance = response.data.credit;
      this.balanceObserver.observation(response.data.credit, {
        provider: this.providerName,
      });
      return true;
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  }

  private getHeaders() {
    return {
      Authorization: `Basic ${this.getBasicAuth()}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  private getBasicAuth() {
    return Buffer.from(
      `${ARPUPLUS_PROVIDER_CONFIG.username}:${ARPUPLUS_PROVIDER_CONFIG.password}:${ARPUPLUS_PROVIDER_CONFIG.acountId}`,
    ).toString('base64');
  }

  getName() {
    return this.providerName;
  }

  getNumberOfFailures(): number {
    return ArpuPlusService.numberOfFails;
  }

  setNumberOfFailures(value: number): void {
    ArpuPlusService.numberOfFails = value;
  }

  incrementNumberOfFailures(): number {
    return ++ArpuPlusService.numberOfFails;
  }
}
