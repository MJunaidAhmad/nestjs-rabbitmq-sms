import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Audit } from '@cassbana/projectx-nest-shared';

export type SMSChannelConfigDocument = SMSChannelConfig & Document;

@Schema({ collection: 'sms_channel_config' })
export class SMSChannelConfig extends Audit {
  @Prop()
  secondaryProviders: string[];
}

export const SMSChannelConfigSchema =
  SchemaFactory.createForClass(SMSChannelConfig);
