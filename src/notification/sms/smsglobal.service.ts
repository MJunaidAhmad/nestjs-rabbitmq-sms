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
import { SMSGlobalMessageDto } from 'src/dto/smsglobal';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MESSAGE_STATUS } from '../../shared/enums/message-status';
import {
  MessageCallbackDto,
  SMSStatus,
} from '../../smsglobal-callback-controller/MessageCallbackDto';
import {
  SenderId,
  serviceSenderNameMap,
  SMSGLOBAL_PROVIDER_CONFIG
} from './smsglobal.config';
import * as crypto from 'crypto';


@Injectable()
export class SMSGlobalService implements ISMSProvider {
  readonly providerName = 'smsglobal';
  logger = new Logger(SMSGlobalService.name);
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
      'smsglobal_success_messages_counter',
      {
        description: 'smsglobal success messages api sent messages',
      },
    );
    this.failedCounter = this.metricService.getCounter(
      'smsglobal_failed_messages_counter',
      {
        description: 'smsglobal failed messages api sent messages',
      },
    );
    this.histogram = metricService.getHistogram('sms_time_to_deliver', {
      description: 'Time to devliver sms messages histogram',
    });
    this.balanceObserver = this.metricService.getObservableGauge(
      'smsglobal_balance_gauge',
      { description: 'sms provider account credit balance gauge', unit: 'EGP' },
      (observableResult: ObservableResult) => {
        observableResult.observe(this.latestBalance, {
          provider: this.providerName,
        });
      },
    );
  }
  @Validate()
  async sendMessage(@Validator() message: SmsBodyDto) {
    this.logger.log(`${message.phoneNumber}: ${message.message}`);
    const senderName = SenderId.Cassbana;
    const params = {
      origin: senderName,
      destination: message.phoneNumber,
      message: message.message,
      notifyUrl: process.env.HOST + '/smsglobal/callback',
      messages: []
    };
    return this.sendSMS(params);
  }

  private async sendSMS(params: SMSGlobalMessageDto) {
    const method = 'POST'
    const smsURL = '/v2/sms'
    try {
      const response = await axios({
        method: method,
        data: params,
        url: `${SMSGLOBAL_PROVIDER_CONFIG.baseHost}${smsURL}`,
        headers: this.getHeaders(method, smsURL),
      });
      if (response.data.messages[0].status === SMSStatus.SENT) {
        this.successCounter.add(1);
        return response.data;
      }
      this.failedCounter.add(1);
      throw { message: response.data.messages[0] };
    } catch (error) {
      this.logger.error(error.message);
      this.failedCounter.add(1);
      this.incrementNumberOfFailures();
      this.logger.log(
        `Current number of failures is ${SMSGlobalService.numberOfFails}`,
      );
      throw error;
    }
  }

  async updateMessageStatus(@Validator() dto: MessageCallbackDto) {
    dto = JSON.parse(JSON.stringify(dto))
    this.logger.log(Number(dto.outgoing_id));
    const message = await this.messageModel.findOne({
      'providerResponse.messages.outgoing_id': Number(dto.outgoing_id),
    });
    if (dto.status === SMSStatus.DELIVERED) {
      message.status = MESSAGE_STATUS.DELIVERED;
      message.providerResponse.callbackResponse = dto;
      message.markModified('providerResponse');
      message.updatedAt = new Date();
      message.save();
  }
    return 'Success';
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async getBalance() {
    const method = 'GET'
    const balanceURL = '/v2/user/credit-balance'
    try {
      const response = await axios({
        method: method,
        url: `${SMSGLOBAL_PROVIDER_CONFIG.baseHost}${balanceURL}`,
        headers: this.getHeaders(method, balanceURL),
      });
      this.latestBalance = response.data.balance;
      this.balanceObserver.observation(this.latestBalance, {
        provider: this.providerName,
      });
      return true;
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  }

  getHeaders(requestType: string, url: string) {
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = Math.floor(Math.random() * 10000000);
    const port = 443;
    const auth = `${timestamp}\n${nonce}\n${requestType.toUpperCase()}\n${url.toLowerCase()}\n${this.removeHttp(SMSGLOBAL_PROVIDER_CONFIG.baseHost)}\n${port}\n\n`;
    const hash = crypto
      .createHmac('sha256', SMSGLOBAL_PROVIDER_CONFIG.secret)
      .update(auth)
      .digest('base64');
    const token = `MAC id="${SMSGLOBAL_PROVIDER_CONFIG.apiKey}", ts="${timestamp}", nonce="${nonce}", mac="${hash}"`;
    return {
      Authorization: token,
      'Content-Type': 'application/json',
      'User-Agent': `SMSGlobal-SDK/v2 Version/1.0.0 Node/${process.version} (${process.platform} ${process.arch}; OpenSSL/${process.versions.openssl})`,
    };
  }

  getName() {
    return this.providerName;
  }

  getNumberOfFailures(): number {
    return SMSGlobalService.numberOfFails;
  }

  setNumberOfFailures(value: number): void {
    SMSGlobalService.numberOfFails = value;
  }

  incrementNumberOfFailures(): number {
    return ++SMSGlobalService.numberOfFails;
  }

  removeHttp(url: string) {
    return url.replace(/^https?:\/\//, '');
  }
}
