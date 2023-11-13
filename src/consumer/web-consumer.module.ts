import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { DynamicModule, Logger, Module } from '@nestjs/common';
import { RABBITMQ_URL } from './rabbit-mq.config';
import { LoggerModule } from 'nestjs-pino';
import { SMSUtil } from '../shared/sms-util';
import { Message, MessageSchema } from '../shared/schema/message';
import { MongooseModule } from '@nestjs/mongoose';
import { WebChannelService } from '../notification/sms/web.service';
import { WebConsumerService } from './web-consumer.service';
import { Environment } from '../env';
import {
  SMSChannelConfig,
  SMSChannelConfigSchema,
} from '../shared/schema/sms-provider-config';
import { SMSUtilModule } from '../shared/sms-util.module';
@Module({})
export class WebConsumerModule {
  static register(): DynamicModule {
    if (Environment.ALLOW_SMS_WEB_CHANNEL != 'true') {
      return { module: WebConsumerModule };
    } else {
      return {
        module: WebConsumerModule,
        imports: [LoggerModule.forRoot(), SMSUtilModule],
        exports: [],
        providers: [WebConsumerService, WebChannelService, Logger],
        controllers: [],
      };
    }
  }
}
