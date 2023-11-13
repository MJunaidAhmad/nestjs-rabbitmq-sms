import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Logger, Module } from '@nestjs/common';
import { RABBITMQ_URL } from './rabbit-mq.config';
import { LoggerModule } from 'nestjs-pino';
import { SMSUtil } from '../shared/sms-util';
import { Message, MessageSchema } from '../shared/schema/message';
import { MongooseModule } from '@nestjs/mongoose';
import { CequensConsumerService } from './cequens-consumer.service';
import { CequensService } from 'src/notification/sms/cequens.service';
import {
  CequensCredentials,
  CequensCrendentialsSchema,
} from 'src/shared/schema/cequens';
import { Counter } from '@opentelemetry/api-metrics';
import {
  SMSChannelConfig,
  SMSChannelConfigSchema,
} from '../shared/schema/sms-provider-config';
import { SMSUtilModule } from '../shared/sms-util.module';

@Module({
  imports: [
    LoggerModule.forRoot(),
    MongooseModule.forFeature([
      { name: CequensCredentials.name, schema: CequensCrendentialsSchema },
    ]),
    SMSUtilModule,
  ],
  exports: [],
  providers: [CequensConsumerService, CequensService, Logger],
  controllers: [],
})
export class CequensConsumerModule {}
