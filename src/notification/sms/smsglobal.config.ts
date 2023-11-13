export const SMSGLOBAL_PROVIDER_CONFIG = {
    baseHost: process.env.SMS_PROVIDER_SMSGLOBAL_HOST,
    apiKey: process.env.SMS_PROVIDER_SMSGLOBAL_API_KEY,
    secret: process.env.SMS_PROVIDER_SMSGLOBAL_SECRET,
  };
  
  export enum SenderId {
    Cassbana = 'Cassbana',
    CashKateb = 'CashKateb',
  }
  
  export const serviceSenderNameMap = {
    projectx: 'CashKateb',
    b2b: 'Cassbana',
    supplier: 'Cassbana'
  };
  