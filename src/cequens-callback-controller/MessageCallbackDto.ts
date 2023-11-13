import { IsDefined } from 'class-validator';

export class MessageCallbackDto {
  @IsDefined()
  public msgid: string;
  public statusid: string;
  @IsDefined()
  public statusmsg: string;
  public accountid: string;
  public SubmitDate: string;
}

export enum Status {
  DELIVERED = 'DELIVRD',
  UNDELIVERED = 'UNDELIV',
}
