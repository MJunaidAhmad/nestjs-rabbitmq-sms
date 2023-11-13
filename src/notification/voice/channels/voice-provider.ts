import { SendVoiceMessageDto } from '../dto/send-voice-message.dto';
import { VoiceMessageStatusUpdateDTO } from '../dto/voice-message-status-update';

export interface IVoiceProvider {
  getChannelName(): string;

  send(message: SendVoiceMessageDto);

  handleStatusCallback(statusCallback: any): VoiceMessageStatusUpdateDTO;
}
