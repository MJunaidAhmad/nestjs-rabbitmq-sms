export const ARPUPLUS_PROVIDER_CONFIG = {
  baseHost: process.env.SMS_PROVIDER_ARPUPLUS_HOST,
  username: process.env.SMS_PROVIDER_ARPUPLUS_USERNAME,
  password: process.env.SMS_PROVIDER_ARPUPLUS_PASSWORD,
  acountId: process.env.SMS_PROVIDER_ARPUPLUS_ACCOUNT_ID,
  sender: process.env.SMS_PROVIDER_ARPUPLUS_SENDER,
};

export enum SenderId {
  Cassbana = 'Cassbana',
  CashKateb = 'CashKateb',
}

export const serviceSenderNameMap = {
  projectx: 'CashKateb',
  b2b: 'Cassbana',
};
