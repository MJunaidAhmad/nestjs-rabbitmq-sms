import { StatusUpdate } from 'src/shared/schema/voice-message';

export class VoiceMessageStatusUpdateDTO {
  providerID: string;
  statusUpdate: StatusUpdate;
}
