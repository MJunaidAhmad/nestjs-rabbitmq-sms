import { SmsBodyDto, SMSMessageTypes } from '../../dto/sms.body';
import { Injectable, Logger } from '@nestjs/common';
import { Validate, Validator } from '@cassbana/projectx-nest-shared';
import { PROVIDER_CONFIG, API_KEYS, BASE_HOSTS } from './infobip.config';
import { InfoBipDto } from '../../dto/infobip';
import axios from 'axios';
import { ISMSProvider } from './sms.service';
import {
  Counter,
  Histogram,
  ObservableGauge,
  ObservableResult,
} from '@opentelemetry/api-metrics';
import { MetricService } from 'nestjs-otel';
import {
  InfobipCallbackDto,
  Result,
} from '../../infobip-callback/InfobipCallback.dto';
import { Environment } from '../../env';
import { InjectModel } from '@nestjs/mongoose';
import { Message } from '../../shared/schema/message';
import { Model } from 'mongoose';
import { MessageCallbackResolver } from '../../infobip-callback/callback-resolver';
import { determineSenderName } from './util';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SenderId, projectx } from './cequens.config';
import { SMSProviderSwitcher } from '../../shared/sms-provider-switcher';

@Injectable()
export class InfoBipService implements ISMSProvider {
  readonly providerName = 'infobip';
  logger = new Logger(InfoBipService.name);
  readonly successCounter: Counter;
  readonly failedCounter: Counter;
  private readonly histogram: Histogram;
  balanceObserver: ObservableGauge;
  private latestBalance: number;
  private static numberOfFails = 0;
  constructor(
    private metricService: MetricService,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    private smsProviderSwitcher: SMSProviderSwitcher,
  ) {
    this.successCounter = this.metricService.getCounter(
      'infopip_success_messages_counter',
      {
        description: 'infopip success messages api sent messages',
      },
    );
    this.failedCounter = this.metricService.getCounter(
      'infopip_failed_messages_counter',
      {
        description: 'infopip failed messages api sent messages',
      },
    );
    this.histogram = metricService.getHistogram('sms_time_to_deliver', {
      description: 'Time to devliver sms messages histogram',
    });
    this.balanceObserver = this.metricService.getObservableGauge(
      'infobip_balance_gauge',
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
    this.logger.log(
      `To: ${message.phoneNumber} Message: ${message.message} From: ${message.senderId} NotifyURL: ${Environment.HOST}/infobip/callback `,
    );

    let apiKey = PROVIDER_CONFIG.apiKey;
    let baseHost = PROVIDER_CONFIG.baseHost;

    //for opt messages use respective acounts for service
    // right now we have two: 1. cashkateb 2. cassbana

    const isOtp = message.type === SMSMessageTypes.otp;

    // check if sender has a dedicated account
    const checkIfServiceAccountExist =
      message.senderId in API_KEYS && message.senderId in BASE_HOSTS;

    if (isOtp && checkIfServiceAccountExist) {
      apiKey = API_KEYS[message.senderId];
      baseHost = BASE_HOSTS[message.senderId];
    }

    if (isOtp && message.service === projectx) {
      this.logger.log(`Projectx service check true. `);

      apiKey = API_KEYS[SenderId.CashKateb];
      baseHost = BASE_HOSTS[SenderId.CashKateb];
    }

    return this.sendSMS(
      {
        messages: [
          {
            from: determineSenderName(message), // Sender ID
            destinations: [{ to: message.phoneNumber }],
            text: message.message,
            notifyUrl: `${Environment.HOST}/infobip/callback`,
          },
        ],
      },
      apiKey,
      baseHost,
    );
  }

  private async sendSMS(params: InfoBipDto, apiKey: string, baseHost: string) {
    try {
      const response = await axios({
        method: 'POST',
        data: params,
        url: `https://${baseHost}/sms/2/text/advanced`,
        headers: {
          Authorization: `App ${apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      this.logger.log(response.status);
      this.successCounter.add(1);
      // this.setNumberOfFailures(0); //resetting the number of failures for the message
      return response.data;
    } catch (error) {
      this.logger.error(error.message);
      this.failedCounter.add(1);
      this.incrementNumberOfFailures();
      throw error;
    }
  }

  getName() {
    return this.providerName;
  }

  handleStatusCallback(callback: InfobipCallbackDto) {
    this.logger.log(
      `=================Webhhok Notification received for infobip.===========================`,
    );
    callback.results.forEach(async (result: Result) => {
      this.logger.log(result);
      const message = await this.messageModel.findOne({
        'providerResponse.messages.messageId': result.messageId,
      });
      console.log(result.doneAt.valueOf(), result.doneAt);
      const callbackResolver = new MessageCallbackResolver(result);
      message.status = callbackResolver.getStatus();
      if (callbackResolver.doesStatusRequireRouting())
        this.incrementNumberOfFailures();
      else this.setNumberOfFailures(0);
      if (this.getNumberOfFailures() > 5) {
        return this.smsProviderSwitcher.switchToSecondaryProvider(this);
      }
      message.providerResponse.callbackResponse = result;
      message.deliveredAt = result.doneAt;
      message.markModified('providerResponse');
      message.updatedAt = new Date();
      message.timeToDeliver =
        (message.deliveredAt.valueOf() - message.createdAt.valueOf()) / 1000;

      message.save();
      this.histogram.record(message.timeToDeliver, {
        provider: this.providerName,
      });
    });
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async getBalance() {
    try {
      const response = await axios({
        method: 'GET',
        url: `https://${PROVIDER_CONFIG.baseHost}/account/1/balance`,
        headers: {
          Authorization: `App ${PROVIDER_CONFIG.apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      this.latestBalance = response.data.balance;
      this.balanceObserver.observation(response.data.balance, {
        provider: this.providerName,
      });
      return true;
    } catch (error) {
      return this.logger.error(error);
    }
  }

  getNumberOfFailures(): number {
    return InfoBipService.numberOfFails;
  }

  setNumberOfFailures(value: number): void {
    InfoBipService.numberOfFails = value;
  }

  incrementNumberOfFailures(): number {
    this.logger.log('Number of failure incremented');
    return ++InfoBipService.numberOfFails;
  }
}
