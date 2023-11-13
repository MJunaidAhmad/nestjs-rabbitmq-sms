import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { VoiceService } from './voice.service';
import { ApiExcludeEndpoint, ApiResponse } from '@nestjs/swagger';
import { ValidationErrorResponse } from '../../../shared/responses/validation-error';
import { ErrorResponse } from '../../../shared/responses/error';
import { SendVoiceMessageDto } from '../dto/send-voice-message.dto';
import { GetMessageStatusQueryDto } from '../dto/get-message-status-query.dto';
import { SendVoiceMessageSuccessResponse } from './dto/success-send-response';

@Controller('voice')
export class VoiceController {
  logger = new Logger(VoiceController.name);
  constructor(private service: VoiceService) {}

  @Post('send-call')
  @ApiResponse({
    status: 201,
    description: 'Voice call is successfully sent',
    type: SendVoiceMessageSuccessResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    type: ValidationErrorResponse,
  })
  @ApiResponse({
    status: 422,
    description: 'Error',
    type: ErrorResponse,
  })
  async sendCall(
    @Body(new ValidationPipe({ skipMissingProperties: true }))
    voiceMessageDto: SendVoiceMessageDto,
  ) {
    this.logger.log(voiceMessageDto);
    return this.service.sendMessage(voiceMessageDto);
  }

  @Get('message-status')
  async getMessageStatus(@Query() query: GetMessageStatusQueryDto) {
    return this.service.getMessage(query);
  }

  @ApiExcludeEndpoint()
  @Post('send-bulk-calls')
  async sendBulkCalls(@Body() messages: any) {
    this.logger.log(messages);
    for (const message of messages) {
      message.service = 'experiment';
      await this.service.sendMessage(message);
      console.log('message sent');
    }
  }
}
