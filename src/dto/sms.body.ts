import { IsValidPhoneNumber } from '@cassbana/projectx-nest-shared';
import {
  IsString,
  Validate,
  IsDefined,
  IsOptional,
  IsNotEmpty,
  IsEnum,
} from 'class-validator';
import { SenderId } from '../notification/sms/cequens.config';

export class SmsBodyDto {
  @IsDefined({ message: 'value is not defined' })
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsDefined({ message: 'value is not defined' })
  @IsString()
  // @Validate(IsValidPhoneNumber)
  phoneNumber: string;

  @IsString()
  @IsNotEmpty({ message: "payload's service parameter cannot be null" })
  service?: string;

  @IsOptional()
  @IsString()
  correlationId?: string;

  @IsOptional()
  @IsString()
  @IsEnum(SenderId)
  senderId?: string;

  //id message in the db to count retries
  @IsOptional()
  retryFor: string;
}

export enum SMSMessageTypes {
  otp = 'otp',
}
