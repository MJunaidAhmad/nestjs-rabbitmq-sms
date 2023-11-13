import { IsDefined } from 'class-validator';

export class MessageCallbackDto {
  @IsDefined()
  public messageId: string;

  @IsDefined()
  public status: string;
}

export enum Status {
  Queued = 'stat:QUEUED',
  SENT = 'stat:SENT',
  DELIVERED = 'stat:DELIVRD',
  FAILED = 'stat:FAILED',
}
