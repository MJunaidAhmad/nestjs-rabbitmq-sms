import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  VoiceMessage,
  VoiceMessageDocumet,
} from '../../../shared/schema/voice-message';
import { ProviderMessageInfo } from '../dto/provider-message-info';
import { SendVoiceMessageDto } from '../dto/send-voice-message.dto';
import { VoiceMessageStatusUpdateDTO } from '../dto/voice-message-status-update';
import { IVoiceProvider } from './voice-provider';

export class VoiceChannel {
  logger = new Logger(VoiceChannel.name);
  private provider: IVoiceProvider;
  constructor(
    @InjectModel(VoiceMessage.name) private messageModel: Model<VoiceMessage>,
  ) {}

  useProvider(provider: IVoiceProvider) {
    this.provider = provider;
    return this;
  }

  public async sendVoiceMessage(
    voiceMessage: SendVoiceMessageDto,
  ): Promise<VoiceMessageDocumet> {
    let providerResponse: ProviderMessageInfo;
    let messageDocument: VoiceMessageDocumet;
    try {
      providerResponse = await this.provider.send(voiceMessage);
      this.logger.log(providerResponse);
      messageDocument = await this.saveToDB(voiceMessage, providerResponse);
    } catch (error) {
      providerResponse = new ProviderMessageInfo();
      providerResponse.error = error.message;
      providerResponse.status = 'error';
      this.logger.log({ errorMessage: error.message });
      await this.saveToDB(voiceMessage, providerResponse);
      throw error;
    }
    return messageDocument;
  }

  private async saveToDB(
    voiceMessage: SendVoiceMessageDto,
    messageInfo: ProviderMessageInfo,
  ): Promise<VoiceMessageDocumet> {
    return this.messageModel.create({
      correlationId: voiceMessage.correlationId,
      provider: this.provider.getChannelName(),
      providerMessageInfo: messageInfo,
      message: voiceMessage,
    });
  }

  handleStatusCallbackUpdate(callBackUpdateDto: any) {
    const voiceStatusUpdateDto =
      this.provider.handleStatusCallback(callBackUpdateDto);
    this.saveCallbackUpdate(voiceStatusUpdateDto);
  }

  protected async saveCallbackUpdate(
    voiceStatusUpdateDto: VoiceMessageStatusUpdateDTO,
  ): Promise<VoiceMessageDocumet> {
    this.logger.log(voiceStatusUpdateDto);
    const voiceMessage = await this.messageModel
      .findOne({ 'providerMessageInfo.id': voiceStatusUpdateDto.providerID })
      .exec();
    voiceMessage.statusUpdates.push(voiceStatusUpdateDto.statusUpdate);
    await voiceMessage.save();
    this.logger.log(voiceMessage);
    return voiceMessage;
  }
}
