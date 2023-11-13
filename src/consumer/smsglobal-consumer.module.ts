import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Logger, Module } from '@nestjs/common';
import { RABBITMQ_URL } from './rabbit-mq.config';
import { LoggerModule } from 'nestjs-pino';
import { SMSUtil } from '../shared/sms-util';
import { Message, MessageSchema } from '../shared/schema/message';
import { MongooseModule } from '@nestjs/mongoose';
import { SMSChannelConfig, SMSChannelConfigSchema } from 'src/shared/schema/sms-provider-config';
import { SMSGlobalService } from 'src/notification/sms/smsglobal.service';
import { SMSGlobalConsumerService } from './smsglobal-consumer.service';
import { SMSProviderSwitcher } from 'src/shared/sms-provider-switcher';

@Module({
  imports: [
    LoggerModule.forRoot(),
    MongooseModule.forRoot(`${process.env.MONGO_HOST}`),    
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema },
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
  exports: [RabbitMQModule],
  providers: [SMSGlobalConsumerService, SMSGlobalService, SMSUtil, Logger, SMSProviderSwitcher],
  controllers: [],
})
export class SMSGlobalConsumerModule {}