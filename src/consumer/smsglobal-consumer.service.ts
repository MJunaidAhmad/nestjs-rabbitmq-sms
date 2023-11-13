import { Injectable, Logger } from '@nestjs/common';
import { SmsBodyDto } from '../dto/sms.body';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import {
    RABBITMQ_QUEUE_SMSGLOBAL_P1,
    RABBITMQ_QUEUE_SMSGLOBAL_P2,
} from './rabbit-mq.config';
import { SMSUtil } from '../shared/sms-util';
import { InjectModel } from '@nestjs/mongoose';
import { Message } from '../shared/schema/message';
import { Model } from 'mongoose';
import { OtelMethodCounter } from 'nestjs-otel';
import { SMSGlobalService } from 'src/notification/sms/smsglobal.service';

@Injectable()
export class SMSGlobalConsumerService {
  private readonly logger = new Logger(SMSGlobalConsumerService.name);

  constructor(
    private smsProvider: SMSGlobalService,
    private readonly smsUtil: SMSUtil,
    @InjectModel(Message.name) private messageModel: Model<Message>,
  ) {}

  @RabbitSubscribe({
    queue: RABBITMQ_QUEUE_SMSGLOBAL_P1,
    allowNonJsonMessages: true,
    createQueueIfNotExists: false,
  })
  @OtelMethodCounter()
  async smsglobalP1(message: SmsBodyDto) {
    await this.smsUtil.sendSMS(this.smsProvider, this.messageModel, message);
  }

  @RabbitSubscribe({
    queue: RABBITMQ_QUEUE_SMSGLOBAL_P2,
    allowNonJsonMessages: true,
    createQueueIfNotExists: false,
  })
  @OtelMethodCounter()
  async smsglobalP2(message: SmsBodyDto) {
    await this.smsUtil.sendSMS(this.smsProvider, this.messageModel, message);
  }
}
