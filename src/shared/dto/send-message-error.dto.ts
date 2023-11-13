import { MESSAGE_STATUS } from '../enums/message-status';

export class SendMessageErrorDto {
  providerResponse: any;
  errorMessage: string;
  status: MESSAGE_STATUS;
}
