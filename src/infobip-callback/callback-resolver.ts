import { Result } from './InfobipCallback.dto';
import { MESSAGE_STATUS } from '../shared/enums/message-status';

export class MessageCallbackResolver {
  private readonly statusesNeedsRerouting = [
    'REJECTED_NOT_ENOUGH_CREDITS',
  ];
  constructor(private callbackResult: Result) {}
  //please view this to understand the statuses
  //https://www.infobip.com/docs/essentials/response-status-and-error-codes#api-status-codes
  getStatus() {
    switch (this.callbackResult.status.groupId) {
      case 3:
        return MESSAGE_STATUS.DELIVERED;
      case 4:
      case 2:
        return MESSAGE_STATUS.UNDELIVERED;
      case 5:
        return MESSAGE_STATUS.REJECTED_FROM_PROVIDER;
    }
  }

  doesStatusRequireRouting() {
    return this.statusesNeedsRerouting.includes(
      this.callbackResult.status.name,
    );
  }
}
