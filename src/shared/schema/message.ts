import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Audit } from '@cassbana/projectx-nest-shared';
import { SmsBodyDto } from '../../dto/sms.body';
import * as mongoose from 'mongoose';
import { MESSAGE_STATUS } from '../enums/message-status';
import { COMMUNICATION_TYPE } from '../enums/communication-type';

export type MessageDocument = Message & mongoose.Document;

@Schema()
export class Message extends Audit {
  @Prop({ required: false })
  correlationId?: string;

  @Prop({ required: true, enum: Object.values(COMMUNICATION_TYPE) })
  communicationType: string; // sms/email

  @Prop({ required: true })
  message: SmsBodyDto; // In the future, we will have union types

  @Prop({ required: false })
  provider: string; // infobip/cequens/smtp/gmail etc

  @Prop({ required: false, enum: Object.values(MESSAGE_STATUS) })
  status: string; // inqueue/sent/delivered

  @Prop({ required: false, type: mongoose.Schema.Types.Mixed })
  providerResponse?: any; // response from the third-party

  @Prop({ required: false })
  service: string; // user service

  @Prop({ required: false })
  senderName: string;

  @Prop({
    required: false,
    default(): number {
      return 0;
    },
  })
  numberOfRetries: number;

  @Prop({ required: false })
  timeToDeliver: number;

  @Prop({ required: false })
  deliveredAt: Date;

  @Prop({ required: false })
  errorMessage: string;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
