import { Injectable, Logger } from '@nestjs/common';
import { SmsBodyDto } from '../dto/sms.body';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import {
  RABBITMQ_QUEUE_INFOBIP_P1,
  RABBITMQ_QUEUE_INFOBIP_P2,
  RABBITMQ_QUEUE_WEB_P1,
  RABBITMQ_URL,
} from './rabbit-mq.config';
import { InfoBipService } from '../notification/sms/infobip.service';
import { SMSUtil } from '../shared/sms-util';
import { InjectModel } from '@nestjs/mongoose';
import { Message } from '../shared/schema/message';
import { Model } from 'mongoose';
import { OtelMethodCounter } from 'nestjs-otel';
import { WebChannelService } from '../notification/sms/web.service';

@Injectable()
export class WebConsumerService {
  private readonly logger = new Logger(WebConsumerService.name);

  constructor(
    private smsProvider: WebChannelService,
    private readonly smsUtil: SMSUtil,
    @InjectModel(Message.name) private messageModel: Model<Message>,
  ) {}

  @RabbitSubscribe({
    queue: RABBITMQ_QUEUE_WEB_P1,
    allowNonJsonMessages: true,
    createQueueIfNotExists: false,
  })
  @OtelMethodCounter()
  async smsWebP1(message: SmsBodyDto) {
    await this.smsUtil.sendSMS(this.smsProvider, this.messageModel, message);
  }
}
