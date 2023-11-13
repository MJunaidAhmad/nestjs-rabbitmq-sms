import { Mapper } from '../../../shared/types/mapper';
import { VoiceMessageDocumet } from '../../../shared/schema/voice-message';
import { VoiceMessageDto } from './dto/voice-message.dto';

export class VoiceMessageMapper implements Mapper<VoiceMessageDocumet> {
  toDto(voiceMessage: VoiceMessageDocumet): VoiceMessageDto {
    return {
      id: voiceMessage._id,
      correlationId: voiceMessage.correlationId,
      message: voiceMessage.message,
      statusUpdates: voiceMessage.statusUpdates,
      createdAt: voiceMessage.createdAt,
      provider: voiceMessage.provider,
    };
  }
}
