import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { VoiceChannel } from '../channels/voice-channel';
import { SendVoiceMessageDto } from '../dto/send-voice-message.dto';
import { TwilioChannel } from '../channels/twilio/twilio-channel';
import { GetMessageStatusQueryDto } from '../dto/get-message-status-query.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  VoiceMessage,
  VoiceMessageDocumet,
} from '../../../shared/schema/voice-message';
import { Model } from 'mongoose';
import { VoiceMessageMapper } from './message-response.mapper';
import { SendVoiceMessageSuccessResponse } from './dto/success-send-response';

@Injectable()
export class VoiceService {
  constructor(
    private voiceChannel: VoiceChannel,
    @InjectModel(VoiceMessage.name) private messageModel: Model<VoiceMessage>,
  ) {}

  async sendMessage(
    voiceMessageDto: SendVoiceMessageDto,
  ): Promise<SendVoiceMessageSuccessResponse> {
    try {
      const voiceMessageDocument = await this.voiceChannel
        .useProvider(new TwilioChannel())
        .sendVoiceMessage(voiceMessageDto);
      return {
        message: 'Voice call is successfully sent',
        messageId: voiceMessageDocument._id,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }

  handleStatusCallback(callback: any) {
    this.voiceChannel
      .useProvider(new TwilioChannel())
      .handleStatusCallbackUpdate(callback);
  }

  async getMessage(query: GetMessageStatusQueryDto) {
    const message: VoiceMessageDocumet = await this.messageModel
      .findOne({ _id: query.message_id })
      .exec();
    if (!message)
      throw new HttpException('Message is not found', HttpStatus.NOT_FOUND);
    return new VoiceMessageMapper().toDto(message);
  }
}
