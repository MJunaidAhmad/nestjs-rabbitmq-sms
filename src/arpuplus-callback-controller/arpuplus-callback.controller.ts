import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { ArpuPlusService } from '../notification/sms/arpuplus.service';
import { MessageCallbackDto } from './MessageCallbackDto';
@Controller('')
export class ArpuplusCallbackController {
  logger = new Logger(ArpuplusCallbackController.name);
  constructor(private arpuplusService: ArpuPlusService) {}
  @ApiExcludeEndpoint()
  @Get('arpuplus/callback')
  async home(@Query() dto: MessageCallbackDto) {
    this.logger.log(dto);
    try {
      await this.arpuplusService.updateMessageStatus(dto);
    } catch (err) {
      this.logger.error(err);
    }
    return 'Success';
  }
}