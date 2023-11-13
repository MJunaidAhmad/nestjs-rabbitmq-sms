import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { CequensService } from '../notification/sms/cequens.service';
import { MessageCallbackDto } from './MessageCallbackDto';
@Controller('')
export class CequensCallbackControllerController {
  logger = new Logger(CequensCallbackControllerController.name);
  constructor(private cequensService: CequensService) {}
  @ApiExcludeEndpoint()
  @Get('cequens/callback')
  async home(@Query() dto: MessageCallbackDto) {
    this.logger.log(dto);
    try {
      await this.cequensService.updateMessageStatus(dto);
    } catch (err) {
      this.logger.error(err);
    }
    return 'Success';
  }
}
