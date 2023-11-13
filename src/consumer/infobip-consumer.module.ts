import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Logger, Module } from '@nestjs/common';
import { RABBITMQ_URL } from './rabbit-mq.config';
import { InfobipConsumerService } from './infobip-consumer.service';
import { LoggerModule } from 'nestjs-pino';
import { InfoBipService } from '../notification/sms/infobip.service';
import { SMSUtil } from '../shared/sms-util';
import { Message, MessageSchema } from '../shared/schema/message';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SMSChannelConfig,
  SMSChannelConfigSchema,
} from '../shared/schema/sms-provider-config';
import { SMSUtilModule } from '../shared/sms-util.module';

@Module({
  imports: [LoggerModule.forRoot(), SMSUtilModule],
  exports: [],
  providers: [InfobipConsumerService, InfoBipService, Logger],
  controllers: [],
})
export class InfobipConsumerModule {}
