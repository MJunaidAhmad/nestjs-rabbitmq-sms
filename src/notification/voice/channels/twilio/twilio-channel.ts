import { SendVoiceMessageDto } from '../../dto/send-voice-message.dto';
import { Logger } from '@nestjs/common';
import { Twilio, twiml } from 'twilio';
import VoiceResponse from 'twilio/lib/twiml/VoiceResponse';
import { LanguageVoices, TWILIO_PROVIDER_CONFIG } from './twilio.config';
import { ProviderMessageInfo } from '../../dto/provider-message-info';
import { Environment } from '../../../../env';
import { TwilioStatusCallbackDTO } from '../../dto/twilio-status-callback';
import { StatusUpdate } from '../../../../shared/schema/voice-message';
import { VoiceMessageStatusUpdateDTO } from '../../dto/voice-message-status-update';
import { IVoiceProvider } from '../voice-provider';
import { StatusCallbackEvents } from './enums/twilio-status-callback-events.enum';
export class TwilioChannel implements IVoiceProvider {
  twilioClient: Twilio = new Twilio(
    TWILIO_PROVIDER_CONFIG.accountSid,
    TWILIO_PROVIDER_CONFIG.authToken,
    {
      lazyLoading: true,
    },
  );
  logger = new Logger(TwilioChannel.name);
  public getChannelName(): string {
    return 'Twilio';
  }

  public async send(message: SendVoiceMessageDto) {
    const callInstance = await this.twilioClient.calls.create({
      twiml: this.createTwiml(message.language, message.message).toString(),
      to: message.phoneNumber,
      from: TWILIO_PROVIDER_CONFIG.callerID,
      statusCallback: `${Environment.HOST}/twilio/status-callback`,
      statusCallbackEvent: [
        StatusCallbackEvents.INITIATED,
        StatusCallbackEvents.RINGING,
        StatusCallbackEvents.ANSWERED,
        StatusCallbackEvents.COMPLETED,
      ],
    });
    const info = new ProviderMessageInfo();
    info.id = callInstance.sid;
    info.callerID = TWILIO_PROVIDER_CONFIG.callerID;
    info.status = 'sent';
    return info;
  }

  private createTwiml(language: string, message: string): VoiceResponse {
    const voiceResponse = new twiml.VoiceResponse();
    voiceResponse.say({ voice: LanguageVoices[language] }, message);
    return voiceResponse;
  }

  public handleStatusCallback(
    statusCallback: TwilioStatusCallbackDTO,
  ): VoiceMessageStatusUpdateDTO {
    const statusUpdate = new StatusUpdate();
    statusUpdate.date = new Date(statusCallback.Timestamp);
    statusUpdate.status = statusCallback.CallStatus;
    statusUpdate.callDuration = statusCallback.CallDuration
      ? Number(statusCallback.CallDuration)
      : null;
    return {
      statusUpdate,
      providerID: statusCallback.CallSid,
    };
  }
}
