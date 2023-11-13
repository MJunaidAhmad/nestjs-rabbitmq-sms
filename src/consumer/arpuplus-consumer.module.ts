import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Logger, Module } from '@nestjs/common';
import { RABBITMQ_URL } from './rabbit-mq.config';
import { ArpuPlusConsumerService } from './arpuplus-consumer.service';
import { LoggerModule } from 'nestjs-pino';
import { ArpuPlusService } from 'src/notification/sms/arpuplus.service';
import { SMSUtil } from '../shared/sms-util';
import { Message, MessageSchema } from '../shared/schema/message';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SMSChannelConfig,
  SMSChannelConfigSchema,
} from 'src/shared/schema/sms-provider-config';
import { SMSProviderSwitcher } from '../shared/sms-provider-switcher';
import { SMSUtilModule } from '../shared/sms-util.module';

@Module({
  imports: [LoggerModule.forRoot(), SMSUtilModule],
  exports: [],
  providers: [ArpuPlusConsumerService, ArpuPlusService, Logger],
  controllers: [],
})
export class ArpuPlusConsumerModule {}
