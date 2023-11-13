import { ISMSProvider } from '../notification/sms/sms.service';
import { SmsBodyDto, SMSMessageTypes } from '../dto/sms.body';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  PROVIDER_EXCHANGES,
  RABBITMQ_SMS_EXCHANGE,
  RABBITMQ_SMS_FAILURE_EXCHANGE,
} from '../consumer/rabbit-mq.config';
import { Model } from 'mongoose';
import { Message, MessageDocument } from './schema/message';
import { COMMUNICATION_TYPE } from './enums/communication-type';
import { MESSAGE_STATUS } from './enums/message-status';
import { MetricService } from 'nestjs-otel';
import { Counter, Histogram } from '@opentelemetry/api-metrics';
import { ValidatorError } from '@cassbana/projectx-nest-shared';
import { ValidationError } from 'class-validator';
import { SendMessageErrorDto } from './dto/send-message-error.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  SMSChannelConfig,
  SMSChannelConfigDocument,
} from './schema/sms-provider-config';
import { SMSProviderSwitcher } from './sms-provider-switcher';

@Injectable()
export class SMSUtil {
  private readonly histogram: Histogram;
  readonly consumedSmsMessageCounter: Counter;
  readonly automaticRoutingSwitchCounter: Counter;
  smsChannelConfig: SMSChannelConfigDocument;
  private static mainProviderFailureCount = 0;
  logger = new Logger(SMSUtil.name);
  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly metricService: MetricService,
    @InjectModel(SMSChannelConfig.name)
    private smsChannelConfigModel: Model<SMSChannelConfig>,
    private smsProviderSwitcher: SMSProviderSwitcher,
  ) {
    this.histogram = metricService.getHistogram('sms_time_to_consume', {
      description: 'Time to consume sms messages histogram',
    });
    this.consumedSmsMessageCounter = this.metricService.getCounter(
      'consumed_sms_messages_counter',
      {
        description: 'consumed sms messages',
      },
    );

    this.automaticRoutingSwitchCounter = this.metricService.getCounter(
      'automatic_routing_switch_counter',
      {
        description:
          'No of times we switched our sms service providor automatically',
      },
    );
  }

  async sendSMS(
    provider: ISMSProvider,
    messageModel: Model<Message>,
    message: SmsBodyDto,
  ) {
    const startTime = process.hrtime.bigint();
    this.logger.log('Util recieved message successfully');
    try {
      const response = await provider.sendMessage(message);
      await this.saveMessage(
        messageModel,
        MESSAGE_STATUS.SENT,
        message,
        provider,
        response,
      );
      this.updateCounter(message, provider.getName(), MESSAGE_STATUS.SENT);
    } catch (error) {
      this.logger.error(error);
      this.logger.error(`Unable to send message, reason: ${error.message}`);
      this.logger.error(`Payload: ${JSON.stringify(message)}`);
      const messageError = this.determineError(error);
      this.logger.log(messageError);
      if (message != undefined) {
        const messageRecord = await this.saveMessage(
          messageModel,
          messageError.status,
          message,
          provider,
          messageError.providerResponse,
          messageError.errorMessage,
        );
        this.updateCounter(message, provider.getName(), messageError.status);
        if (error.response) {
          this.handleHttpError(error, messageRecord, provider, message);
        }
      }

      await this.amqpConnection.publish(
        RABBITMQ_SMS_FAILURE_EXCHANGE,
        'error',
        {
          original: message,
          error: error.message,
        },
      );
    }
    const endTime = process.hrtime.bigint();
    const executionTimeInNS = endTime - startTime;
    const executionTimeInMS = executionTimeInNS / BigInt(1e6);
    this.logger.log(`Message consumtion time = ${String(executionTimeInMS)}`);
    this.histogram.record(Number(executionTimeInMS));
  }

  private async saveMessage(
    messageModel: Model<Message>,
    status: MESSAGE_STATUS,
    message: SmsBodyDto,
    provider: ISMSProvider,
    response,
    errorMessage: string = null,
  ) {
    if (message.retryFor) {
      const messageRecord = await messageModel
        .findById(message.retryFor)
        .exec();
      messageRecord.providerResponse = response;
      messageRecord.numberOfRetries++;
      messageRecord.status = status;
      messageRecord.updatedAt = new Date();
      messageRecord.errorMessage = errorMessage;
      messageRecord.provider = provider.getName();
      messageRecord.markModified('providerResponse');
      return messageRecord.save();
    }
    return messageModel.create({
      correlationId: message.correlationId,
      communicationType: COMMUNICATION_TYPE.SMS,
      message: {
        phoneNumber: message.phoneNumber,
        text: message.message,
        type: message.type,
      },
      status: status,
      provider: provider.getName(),
      providerResponse: response,
      service: message.service,
      senderName: message.senderId,
      createdAt: new Date(),
      updatedAt: new Date(),
      errorMessage: errorMessage,
    });
  }

  private updateCounter(
    message: SmsBodyDto,
    providerName: string,
    status: string,
  ) {
    this.consumedSmsMessageCounter.add(1, {
      service: message?.service,
      provider: providerName,
      status: status,
    });
  }

  async handleHttpError(
    error: any,
    messageRecord: MessageDocument,
    provider: ISMSProvider,
    message: SmsBodyDto,
  ) {
    this.logger.log('Retrying SMS message');
    this.logger.log(error);
    if (
      ![
        HttpStatus.SERVICE_UNAVAILABLE,
        HttpStatus.GATEWAY_TIMEOUT,
        HttpStatus.UNAUTHORIZED,
      ].includes(error.response.status)
    ) {
      return;
    }
    message.retryFor = messageRecord._id;

    this.logger.log(
      `retrying message with ${provider.getName()} on exchange ${
        PROVIDER_EXCHANGES[provider.getName()]
      }`,
    );
    let providerName = provider.getName();
    //Please take that the order of this operation before pushing the message is critical
    this.logger.log(
      `failure count for ${providerName} is ${provider.getNumberOfFailures()}`,
    );

    this.logger.log(`condition check ${provider.getNumberOfFailures() > 5}`);
    if (provider.getNumberOfFailures() > 5) {
      this.logger.log(`SWITCHING provider after 5 tries`);
      this.logger.log(`provider before switching ${providerName}`);
      const newProvider =
        await this.smsProviderSwitcher.switchToSecondaryProvider(provider);
      this.logger.log(`provider after switching ${providerName}`);
      // if the provider has not been changed and we already attempted 5
      // times then ignore and don't go infinite state of switching
      if (newProvider === providerName) {
        return;
      }
      this.automaticRoutingSwitchCounter.add(1, {
        newProvider: newProvider,
      });
      providerName = newProvider;
    }

    this.logger.log(`publishing on ${PROVIDER_EXCHANGES[providerName]}`);

    this.amqpConnection.publish(PROVIDER_EXCHANGES[providerName], '', message, {
      headers: {
        priority: message.type === SMSMessageTypes.otp ? 'p1' : 'p2',
      },
    });
  }

  private calculateDelayTimeForMessage(
    retries: number,
    isHighPriority: boolean,
  ): number {
    if ((isHighPriority && retries == 4) || (!isHighPriority && retries == 5))
      return -1;
    const base = isHighPriority ? 2 : 5;
    return Math.pow(base, retries + 1);
  }

  private determineError(error): SendMessageErrorDto {
    if (error.constructor.name == ValidatorError.name) {
      const errorMessages = [];
      (error as ValidatorError).validationErrors.forEach(
        (validationError: ValidationError) => {
          for (const key in validationError.constraints) {
            errorMessages.push(validationError.constraints[key]);
          }
          this.logger.log(validationError.constraints);
        },
      );
      return {
        status: MESSAGE_STATUS.VALIDATION_ERROR,
        errorMessage: errorMessages.join(','),
        providerResponse: 'Validation Error',
      };
    } else if (error.response) {
      //Axios HTTP error
      const jsonErr = error.toJSON();
      this.logger.error(jsonErr);
      return {
        status: MESSAGE_STATUS.PROVIDER_ERROR,
        errorMessage: error.message + ' ' + jsonErr.config.url,
        providerResponse: error.message,
      };
    } else {
      return {
        status: MESSAGE_STATUS.ERROR,
        errorMessage: JSON.stringify(error.message),
        providerResponse: error.message,
      };
    }
  }

  getSMSChannelConfig() {
    return this.smsChannelConfigModel.findOne();
  }

  async getSecondaryProviders() {
    const channelConfig = await this.getSMSChannelConfig();
    return channelConfig.secondaryProviders;
  }
}
