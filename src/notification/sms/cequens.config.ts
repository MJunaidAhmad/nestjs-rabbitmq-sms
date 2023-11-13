export const CEQUENS_PROVIDER_CONFIG = {
  authType: process.env.SMS_PROVIDER_AUTH_TYPE,
  encrypted: false,
  baseHost: process.env.SMS_CEQUENS_BASE_HOST,
  apiKey: process.env.SMS_PROVIDER_API_KEY,
  senderId: process.env.SMS_PROVIDER_SENDER_ID,
};

export enum SenderId {
  Cassbana = 'Cassbana',
  CashKateb = 'CashKateb',
}

export const serviceSenderNameMap = {
  projectx: 'CashKateb',
  b2b: 'Cassbana',
};

export const projectx = 'projectx';
