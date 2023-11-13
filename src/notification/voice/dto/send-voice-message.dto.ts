import {
  IsString,
  Validate,
  IsDefined,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { IsValidPhoneNumber } from '@cassbana/projectx-nest-shared';
import { ApiProperty } from '@nestjs/swagger';

export class SendVoiceMessageDto {
  @ApiProperty({ required: true })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Validate(IsValidPhoneNumber, {
    always: false,
  })
  phoneNumber: string;

  @ApiProperty()
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  language: string;

  @ApiProperty()
  @IsDefined()
  @IsString()
  message: string;

  @ApiProperty({
    required: true,
    description: 'b2b|projectx',
    default: 'b2b|projectx',
  })
  @IsDefined()
  @IsString()
  @IsNotEmpty({ message: "payload's service parameter cannot be null" })
  service?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  correlationId?: string;
}
