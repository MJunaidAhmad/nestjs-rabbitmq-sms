export const TWILIO_PROVIDER_CONFIG = {
  callerID: process.env.TWILIO_CALLER_ID,
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
};

export enum LanguageVoices {
  ar = 'Polly.Zeina',
  en = 'Polly.Joanna-Neural',
}
