import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Logger, Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { SMSUtil } from './sms-util';
import { Message, MessageSchema } from './schema/message';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SMSChannelConfig,
  SMSChannelConfigSchema,
} from './schema/sms-provider-config';
import { RABBITMQ_URL } from '../consumer/rabbit-mq.config';
import { SMSProviderSwitcher } from './sms-provider-switcher';

@Module({
  imports: [
    LoggerModule.forRoot(),
    MongooseModule.forRoot(`${process.env.MONGO_HOST}`),
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: SMSChannelConfig.name, schema: SMSChannelConfigSchema },
    ]),
    RabbitMQModule.forRootAsync(RabbitMQModule, {
      useFactory: () => {
        return {
          uri: RABBITMQ_URL,
          connectionInitOptions: { wait: false },
        };
      },
    }),
  ],
  exports: [RabbitMQModule, SMSUtil, MongooseModule, SMSProviderSwitcher],
  providers: [SMSUtil, Logger, SMSProviderSwitcher],
  controllers: [],
})
export class SMSUtilModule {}
