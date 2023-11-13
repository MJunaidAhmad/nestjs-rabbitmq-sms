import { SendVoiceMessageDto } from '../../dto/send-voice-message.dto';
import { StatusUpdate } from '../../../../shared/schema/voice-message';

export class VoiceMessageDto {
  id: string;
  correlationId: string;
  message: SendVoiceMessageDto;
  statusUpdates: Array<StatusUpdate>;
  createdAt: Date;
  provider: string;
}
