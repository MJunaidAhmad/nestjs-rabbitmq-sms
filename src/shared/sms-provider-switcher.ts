import { ISMSProvider } from '../notification/sms/sms.service';
import {
  PROVIDER_EXCHANGES,
  RABBITMQ_SMS_EXCHANGE,
} from '../consumer/rabbit-mq.config';
import { Logger } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { MetricService } from 'nestjs-otel';
import { InjectModel } from '@nestjs/mongoose';
import {
  SMSChannelConfig,
  SMSChannelConfigDocument,
} from './schema/sms-provider-config';
import { Model } from 'mongoose';
import { Counter } from '@opentelemetry/api-metrics';

export class SMSProviderSwitcher {
  logger = new Logger(SMSProviderSwitcher.name);
  readonly automaticRoutingSwitchCounter: Counter;
  smsChannelConfig: SMSChannelConfigDocument;
  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly metricService: MetricService,
    @InjectModel(SMSChannelConfig.name)
    private smsChannelConfigModel: Model<SMSChannelConfig>,
  ) {
    this.automaticRoutingSwitchCounter = this.metricService.getCounter(
      'automatic_routing_switch_counter',
      {
        description:
          'No of times we switched our sms service providor automatically',
      },
    );
  }
  getSMSChannelConfig() {
    return this.smsChannelConfigModel.findOne();
  }
  async switchToSecondaryProvider(currentProvider: ISMSProvider) {
    this.logger.log(`switching main provider`);
    const channelConfig = await this.getSMSChannelConfig();
    const shifted = channelConfig.secondaryProviders.shift();

    const secondaryProviderInDatabase = channelConfig.secondaryProviders[0];

    this.logger.log(`secondary provider name shifted ${shifted}`);
    this.logger.log(
      `secondary provider after shifted lest ${channelConfig.secondaryProviders}`,
    );
    this.logger.log(
      `unbinding the routing from ${RABBITMQ_SMS_EXCHANGE} to 
        ${PROVIDER_EXCHANGES[currentProvider.getName()]}`,
    );

    await this.amqpConnection.channel.unbindExchange(
      PROVIDER_EXCHANGES[currentProvider.getName()],
      RABBITMQ_SMS_EXCHANGE,
      '',
    );
    this.logger.log(
      `binding the routing from ${RABBITMQ_SMS_EXCHANGE} to ${PROVIDER_EXCHANGES[secondaryProviderInDatabase]}`,
    );
    await this.amqpConnection.channel.bindExchange(
      PROVIDER_EXCHANGES[secondaryProviderInDatabase],
      RABBITMQ_SMS_EXCHANGE,
      '',
    );
    currentProvider.setNumberOfFailures(0);
    if (shifted === currentProvider.getName()) {
      channelConfig.secondaryProviders.push(currentProvider.getName());
      this.logger.log(`after pushing  ${channelConfig.secondaryProviders}`);

      channelConfig.markModified('secondaryProviders');
      channelConfig.updatedAt = new Date();
      await channelConfig.save();
    }
    return secondaryProviderInDatabase;
  }
}
