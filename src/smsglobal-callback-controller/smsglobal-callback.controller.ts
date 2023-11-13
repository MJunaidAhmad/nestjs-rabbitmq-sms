import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { SMSGlobalService } from 'src/notification/sms/smsglobal.service';
import { MessageCallbackDto } from './MessageCallbackDto';
@Controller()
export class SMSGlobalCallbackController {
  logger = new Logger(SMSGlobalCallbackController.name);
  constructor(private smsglobalService: SMSGlobalService) {}
  @ApiExcludeEndpoint()
  @Get('smsglobal/callback')
  async home(@Query() dto: MessageCallbackDto) {
    this.logger.log(dto);
    try {
      await this.smsglobalService.updateMessageStatus(dto);
    } catch (err) {
      this.logger.error(err);
    }
    return 'Success';
  }
}