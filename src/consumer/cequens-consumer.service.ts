import { Injectable, Logger } from '@nestjs/common';
import { SmsBodyDto } from '../dto/sms.body';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import {
  RABBITMQ_QUEUE_CEQUENS_P1,
  RABBITMQ_QUEUE_CEQUENS_P2,
} from './rabbit-mq.config';
import { InfoBipService } from '../notification/sms/infobip.service';
import { SMSUtil } from '../shared/sms-util';
import { InjectModel } from '@nestjs/mongoose';
import { Message } from '../shared/schema/message';
import { Model } from 'mongoose';
import { CequensService } from 'src/notification/sms/cequens.service';
import { OtelMethodCounter } from 'nestjs-otel';

@Injectable()
export class CequensConsumerService {
  private readonly logger = new Logger(CequensConsumerService.name);

  constructor(
    private smsProvider: CequensService,
    private readonly smsUtil: SMSUtil,
    @InjectModel(Message.name) private messageModel: Model<Message>,
  ) {}

  @RabbitSubscribe({
    queue: RABBITMQ_QUEUE_CEQUENS_P1,
    allowNonJsonMessages: true,
    createQueueIfNotExists: false,
  })
  @OtelMethodCounter()
  async cequensP1(message: SmsBodyDto) {
    this.logger.log(`Recieved Message on ${RABBITMQ_QUEUE_CEQUENS_P1}`);
    await this.smsUtil.sendSMS(this.smsProvider, this.messageModel, message);
  }

  @RabbitSubscribe({
    queue: RABBITMQ_QUEUE_CEQUENS_P2,
    allowNonJsonMessages: true,
    createQueueIfNotExists: false,
  })
  @OtelMethodCounter()
  async cequensP2(message: SmsBodyDto) {
    this.logger.log(`Recieved Message on ${RABBITMQ_QUEUE_CEQUENS_P2}`);
    await this.smsUtil.sendSMS(this.smsProvider, this.messageModel, message);
  }
}
