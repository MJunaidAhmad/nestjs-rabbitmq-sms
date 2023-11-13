import { Injectable, Logger } from '@nestjs/common';
import { SmsBodyDto } from '../dto/sms.body';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import {
  RABBITMQ_QUEUE_ARPUPLUS_P1,
  RABBITMQ_QUEUE_ARPUPLUS_P2,
} from './rabbit-mq.config';
import { SMSUtil } from '../shared/sms-util';
import { InjectModel } from '@nestjs/mongoose';
import { Message } from '../shared/schema/message';
import { Model } from 'mongoose';
import { OtelMethodCounter } from 'nestjs-otel';
import { ArpuPlusService } from 'src/notification/sms/arpuplus.service';

@Injectable()
export class ArpuPlusConsumerService {
  private readonly logger = new Logger(ArpuPlusConsumerService.name);

  constructor(
    private smsProvider: ArpuPlusService,
    private readonly smsUtil: SMSUtil,
    @InjectModel(Message.name) private messageModel: Model<Message>,
  ) {}

  @RabbitSubscribe({
    queue: RABBITMQ_QUEUE_ARPUPLUS_P1,
    allowNonJsonMessages: true,
    createQueueIfNotExists: false,
  })
  @OtelMethodCounter()
  async arpuPlusP1(message: SmsBodyDto) {
    await this.smsUtil.sendSMS(this.smsProvider, this.messageModel, message);
  }

  @RabbitSubscribe({
    queue: RABBITMQ_QUEUE_ARPUPLUS_P2,
    allowNonJsonMessages: true,
    createQueueIfNotExists: false,
  })
  @OtelMethodCounter()
  async arpuPlusP2(message: SmsBodyDto) {
    await this.smsUtil.sendSMS(this.smsProvider, this.messageModel, message);
  }
}
