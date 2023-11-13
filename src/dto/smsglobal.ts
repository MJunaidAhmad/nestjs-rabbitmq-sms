import { IsDefined, IsNumber, IsString } from 'class-validator';

export class SMSGlobalMessageDto {

    @IsDefined({ message: 'origin is not defined' })
    @IsString()
    'origin': string;

    @IsDefined({ message: 'destination is not defined' })
    @IsString()
    'destination': string;

    @IsDefined({ message: 'message is not defined' })
    @IsString()
    'message': string;

    @IsDefined({ message: 'notifyUrl is not defined' })
    @IsString()
    'notifyUrl': string;

    @IsDefined({ message: 'messages array is not defined' })
    @IsString()
    'messages': string[];
}
