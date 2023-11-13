import { VoiceChannel } from './channels/voice-channel';
import { SendVoiceMessageDto } from './dto/send-voice-message.dto';

export class VoiceMessageHandler {
  public send(voiceMessage: SendVoiceMessageDto, channel: VoiceChannel) {
    channel.sendVoiceMessage(voiceMessage);
  }
}
