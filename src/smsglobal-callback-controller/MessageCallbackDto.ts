import { IsDefined } from 'class-validator';

export class MessageCallbackDto {
  @IsDefined()
  public outgoing_id: string;

  @IsDefined()
  public status: string;
}

export enum SMSStatus {
  SENT = 'sent',
  DELIVERED = 'Delivered',
  Failed = 'failed',
}

export enum Status {
  DELIVERED = 'DELIVRD',
  EXPIRED = 'EXPIRED',
  UNDELIVERED = 'UNDELIV',
}
