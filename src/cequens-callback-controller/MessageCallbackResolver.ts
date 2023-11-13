import { MessageCallbackDto } from './MessageCallbackDto';

export class MessageCallbackResolver {
  constructor(private dto: MessageCallbackDto) {}

  /** Extracts the done date from cequens statusmsg which is sent in message
   * delivery callback
   */
  getDoneDate(): Date {
    const doneDateIndex = this.dto.statusmsg.indexOf('done date:');
    const encodedDoneDate = this.dto.statusmsg.slice(
      doneDateIndex + 10,
      this.dto.statusmsg.indexOf(' ', doneDateIndex + 10),
    );
    return this.resolveCequensDateFormat(encodedDoneDate);
  }

  getSubmitDate(): Date {
    const submitDateIndex = this.dto.statusmsg.indexOf('submit date:');
    const encodedSubmitDate = this.dto.statusmsg.slice(
      submitDateIndex + 12,
      this.dto.statusmsg.indexOf(' ', submitDateIndex + 12),
    );
    return this.resolveCequensDateFormat(encodedSubmitDate);
  }

  private resolveCequensDateFormat(encodedDate: string) {
    const dateArr = this.chunk(encodedDate, 2);
    return new Date(
      Date.UTC(
        Number(`20${dateArr[0]}`),
        dateArr[1] - 1,
        dateArr[2],
        dateArr[3],
        dateArr[4],
        dateArr[5] ?? 0,
      ),
    );
  }

  getStatus(): string {
    const statusIndex = this.dto.statusmsg.indexOf('stat:');
    return this.dto.statusmsg.slice(
      statusIndex + 5,
      this.dto.statusmsg.indexOf(' ', statusIndex + 5),
    );
  }

  chunk(str, size) {
    return str.match(new RegExp('.{1,' + size + '}', 'g'));
  }
}
