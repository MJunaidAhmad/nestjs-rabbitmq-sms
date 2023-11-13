import { ISMSProvider } from './sms.service';
import { SmsBodyDto } from '../../dto/sms.body';

export class SMSProviderMock implements ISMSProvider {
  numberOfFailures = 0;
  getName() {
    return 'mockSMSProvider';
  }

  getNumberOfFailures(): number {
    return this.numberOfFailures;
  }

  incrementNumberOfFailures(): number {
    return ++this.numberOfFailures;
  }

  sendMessage(message: SmsBodyDto) {
    return true;
  }

  setNumberOfFailures(value: number): void {
    this.numberOfFailures = value;
  }
}
