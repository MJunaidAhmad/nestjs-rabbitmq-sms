import { Audit } from '@cassbana/projectx-nest-shared';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ProviderMessageInfo } from '../../notification/voice/dto/provider-message-info';
import { SendVoiceMessageDto } from '../../notification/voice/dto/send-voice-message.dto';
import { Document } from 'mongoose';

@Schema({ collection: 'voice_messages' })
export class VoiceMessage extends Audit {
  @Prop({ required: false })
  correlationId?: string;

  @Prop({ required: true })
  provider: string; // twilio/vonage etc

  @Prop({ required: false })
  providerMessageInfo: ProviderMessageInfo;

  @Prop({ required: true })
  message: SendVoiceMessageDto;

  @Prop({ required: false })
  status: string;

  @Prop({ required: false })
  statusUpdates: Array<StatusUpdate>;
}

export class StatusUpdate {
  status: string;
  date: Date;
  callDuration: number;
}
export type VoiceMessageDocumet = VoiceMessage & Document;

export const VoiceMessageSchema = SchemaFactory.createForClass(VoiceMessage);
