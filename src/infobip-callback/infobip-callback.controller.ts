import { Body, Controller, Post } from '@nestjs/common';
import { InfobipCallbackDto } from './InfobipCallback.dto';
import { InfoBipService } from '../notification/sms/infobip.service';

@Controller('infobip')
export class InfobipCallbackController {
  constructor(private infobipService: InfoBipService) {}
  @Post('callback')
  callback(@Body() callback: InfobipCallbackDto) {
    this.infobipService.handleStatusCallback(callback);
  }
}
