import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Audit } from '@cassbana/projectx-nest-shared';

export type CedquensCredenialsDocument = CequensCredentials & Document;

@Schema({ collection: 'cequens_credentials' })
export class CequensCredentials extends Audit {
  @Prop()
  userName: string;
  @Prop()
  apiKey: string;
  @Prop({ required: false })
  bearerToken: string;
  @Prop({ required: false })
  service: string;
}

export const CequensCrendentialsSchema =
  SchemaFactory.createForClass(CequensCredentials);
