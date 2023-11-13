import { Injectable, Logger } from '@nestjs/common';
import { SmsBodyDto, SMSMessageTypes } from '../../dto/sms.body';
import { Validate, Validator } from '@cassbana/projectx-nest-shared';
import axios from 'axios';
import { ISMSProvider } from './sms.service';
import { CequensAccountCredentials, CequensMessage } from '../../dto/cequens';
import { InjectModel } from '@nestjs/mongoose';
import {
  CedquensCredenialsDocument,
  CequensCredentials,
} from '../../shared/schema/cequens';
import { Model } from 'mongoose';
import { CEQUENS_PROVIDER_CONFIG } from './cequens.config';
import {
  Counter,
  Histogram,
  ObservableGauge,
  ObservableResult,
} from '@opentelemetry/api-metrics';
import { MetricService } from 'nestjs-otel';
import { MessageCallbackResolver } from '../../cequens-callback-controller/MessageCallbackResolver';
import { MESSAGE_STATUS } from '../../shared/enums/message-status';
import { Environment } from '../../env';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  MessageCallbackDto,
  Status,
} from '../../cequens-callback-controller/MessageCallbackDto';
import { Message } from '../../shared/schema/message';
import { determineSenderName } from './util';

@Injectable()
export class CequensService implements ISMSProvider {
  readonly providerName = 'cequens';
  readonly successCounter: Counter;
  readonly failedCounter: Counter;
  private readonly histogram: Histogram;
  balanceObserver: ObservableGauge;
  latestBalance: any;
  private static numberOfFails = 0;
  constructor(
    @InjectModel(CequensCredentials.name)
    private cequensCredentialsModel: Model<CequensCredentials>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    private metricService: MetricService,
  ) {
    this.successCounter = this.metricService.getCounter(
      'cequens_success_messages_counter',
      {
        description: 'cequens success messages api sent messages',
      },
    );
    this.failedCounter = this.metricService.getCounter(
      'cequens_failed_messages_counter',
      {
        description: 'cequens failed messages api sent messages',
      },
    );
    this.balanceObserver = this.metricService.getObservableGauge(
      'cequens_balance_gauge',
      { description: 'sms provider account credit balance gauge', unit: 'EGP' },
      (observableResult: ObservableResult) => {
        observableResult.observe(this.latestBalance, {
          provider: this.providerName,
        });
      },
    );
    this.histogram = metricService.getHistogram('sms_time_to_deliver', {
      description: 'Time to deliver sms messages histogram',
    });
  }
  logger = new Logger(CequensService.name);

  @Validate()
  async sendMessage(@Validator() message: SmsBodyDto) {
    this.logger.log(`${message.phoneNumber}: ${message.message}`);
    let credentials = null;
    if (message.type === SMSMessageTypes.otp) {
      credentials = await this.getCredentials(true);
    } else {
      credentials = await this.getCredentials();
    }
    const senderName = determineSenderName(message);

    const cequensMessage = new CequensMessage();
    cequensMessage.messageText = message.message;
    cequensMessage.senderName = senderName;
    cequensMessage.recipients = message.phoneNumber;
    cequensMessage.messageType = 'text';
    return this.sendSMS(cequensMessage, credentials);
  }

  private async getCredentials(highPrioity = false) {
    const query = {
      userName: highPrioity
        ? Environment.SMS_CEQUENS_OTP_USER_NAME
        : Environment.SMS_CEQUENS_CASSBANA_USER_NAME,
    };

    return this.cequensCredentialsModel.findOne(query).exec();
  }
  private async sendSMS(
    params: CequensMessage,
    credentials: CedquensCredenialsDocument,
  ) {
    try {
      params.dlrUrl = `${Environment.HOST}/cequens/callback`;
      console.log(params);
      const response = await axios({
        method: 'POST',
        data: params,
        url: `https://${CEQUENS_PROVIDER_CONFIG.baseHost}/sms/v1/messages`,
        headers: {
          Authorization: `Bearer ${credentials.bearerToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      this.successCounter.add(1);
      this.setNumberOfFailures(0); //resetting the number of failures for the message
      return response.data;
    } catch (error) {
      this.failedCounter.add(1);
      this.logger.error(error.message);
      this.logger.log(error.response?.data ?? 'response has no data');
      this.incrementNumberOfFailures();
      this.logger.log(
        `Current number of failures is ${CequensService.numberOfFails}`,
      );
      throw error;
    }
  }

  public async login(credentials: CequensAccountCredentials) {
    try {
      const response = await axios({
        method: 'POST',
        data: credentials,
        url: `https://${process.env.SMS_CEQUENS_BASE_HOST}/auth/v1/tokens/`,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      const accessToken = response.data.data.access_token;
      return this.updateToken(credentials, accessToken);
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  private async updateToken(
    credentials: CequensAccountCredentials,
    accessToken: string,
  ) {
    const credentialsRecord = await this.cequensCredentialsModel.findOne({
      apiKey: credentials.apiKey,
    });
    credentialsRecord.bearerToken = accessToken;
    credentialsRecord.save();
    return credentialsRecord;
  }
  //Validates access token if it has expired
  private async validateToken(
    credentials: CedquensCredenialsDocument,
  ): Promise<boolean> {
    try {
      await axios({
        method: 'GET',
        url: `https://${CEQUENS_PROVIDER_CONFIG.baseHost}/sms/v1/account/balance`,
        headers: {
          Authorization: `Bearer ${credentials.bearerToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  getName() {
    return this.providerName;
  }

  async updateMessageStatus(@Validator() dto: MessageCallbackDto) {
    this.logger.log(dto);
    const resolver = new MessageCallbackResolver(dto);
    const message = await this.messageModel.findOne({
      'providerResponse.data.SentSMSIDs.SMSId': dto.msgid,
    });
    const timeToDeliverInMs =
      resolver.getDoneDate().valueOf() - resolver.getSubmitDate().valueOf();

    if (resolver.getStatus() == Status.DELIVERED) {
      message.timeToDeliver =
        timeToDeliverInMs < 0 ? 0 : timeToDeliverInMs / 1000;
      message.deliveredAt = resolver.getDoneDate();
      message.status = MESSAGE_STATUS.DELIVERED;
      this.histogram.record(message.timeToDeliver, {
        provider: this.providerName,
      });
    } else {
      message.status = MESSAGE_STATUS.UNDELIVERED;
    }
    message.providerResponse.callbackResponse = dto;
    message.markModified('providerResponse');
    message.updatedAt = new Date();
    message.save();
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async getBalance() {
    const creds = await this.getCredentials();
    try {
      const response = await axios({
        method: 'GET',
        url: `https://${CEQUENS_PROVIDER_CONFIG.baseHost}/sms/v1/account/balance`,
        headers: {
          Authorization: `Bearer ${creds.bearerToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      this.latestBalance = response.data.data.Account.Credit;
      this.balanceObserver.observation(response.data.data.Account.Credit, {
        provider: this.providerName,
      });
      return true;
    } catch (error) {
      return this.logger.error(error);
    }
  }

  cequensBalanceGaugeCallback(observableResult: ObservableResult) {
    console.log(this.latestBalance);
    observableResult.observe(this.latestBalance, {
      account: 'Default',
      provider: this.providerName,
    });
  }

  getNumberOfFailures(): number {
    return CequensService.numberOfFails;
  }

  setNumberOfFailures(value: number): void {
    CequensService.numberOfFails = value;
  }

  incrementNumberOfFailures(): number {
    return ++CequensService.numberOfFails;
  }
}
