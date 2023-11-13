import { IsDefined, IsNumber, IsString } from 'class-validator';

export class ArpuPlusMessageDto {
  @IsDefined({ message: 'value is not defined' })
  @IsNumber()
  'account_id': number;

  @IsDefined({ message: 'value is not defined' })
  @IsString()
  'text': string;

  @IsDefined({ message: 'value is not defined' })
  @IsString()
  'msisdn': string;

  @IsDefined({ message: 'value is not defined' })
  @IsNumber()
  'priority'?: number;

  @IsDefined({ message: 'value is not defined' })
  @IsNumber()
  'dlr_type'?: number;

  @IsDefined({ message: 'value is not defined' })
  @IsString()
  'dlr_url'?: string;

  @IsDefined({ message: 'value is not defined' })
  @IsString()
  'sender': string;
}
