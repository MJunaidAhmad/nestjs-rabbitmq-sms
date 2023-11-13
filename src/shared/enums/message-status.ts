export enum MESSAGE_STATUS {
  SENT = 'sent',
  DELIVERED = 'delivered',
  ERROR = 'error',
  VALIDATION_ERROR = 'validation_error',
  PROVIDER_ERROR = 'provider_error',
  UNDELIVERED = 'undelivered',
  REJECTED_FROM_PROVIDER = 'rejected_from_provider',
}
