import { Body, Controller, Logger, Post } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { TwilioStatusCallbackDTO } from '../../dto/twilio-status-callback';
import { VoiceService } from '../../voice-service/voice.service';

@Controller('twilio')
export class TwilioController {
  logger = new Logger(TwilioController.name);

  constructor(private service: VoiceService) {}

  @ApiExcludeEndpoint()
  @Post('status-callback')
  async statusCallback(@Body() twilioCallback: TwilioStatusCallbackDTO) {
    this.logger.log(twilioCallback);
    this.service.handleStatusCallback(twilioCallback);
    return { message: 'Success' };
  }
}
