export const PROVIDER_CONFIG = {
  authType: process.env.SMS_PROVIDER_AUTH_TYPE,
  encrypted: false,
  baseHost: process.env.SMS_PROVIDER_BASE_HOST,
  apiKey: process.env.SMS_PROVIDER_API_KEY,
  senderId: process.env.SMS_PROVIDER_SENDER_ID,
};

export const INFOBIP_CASHKATEB_OTP_BASE_URL =
  process.env.INFOBIP_CASHKATEB_OTP_BASE_URL;
export const INFOBIP_CASSBANA_OTP_BASE_URL =
  process.env.INFOBIP_CASSBANA_OTP_BASE_URL;

export const INFOBIP_CASHKATEB_OTP_API_KEY =
  process.env.INFOBIP_CASHKATEB_OTP_API_KEY;
export const INFOBIP_CASSBANA_OTP_API_KEY =
  process.env.INFOBIP_CASSBANA_OTP_API_KEY;

export const BASE_HOSTS = {
  CashKateb: INFOBIP_CASHKATEB_OTP_BASE_URL,
  Cassbana: INFOBIP_CASSBANA_OTP_BASE_URL,
};

export const API_KEYS = {
  CashKateb: INFOBIP_CASHKATEB_OTP_API_KEY,
  Cassbana: INFOBIP_CASSBANA_OTP_API_KEY,
};
