import { SmsBodyDto } from '../../dto/sms.body';

export interface ISMSProvider {
  sendMessage(message: SmsBodyDto);
  getName();
  getNumberOfFailures(): number;
  setNumberOfFailures(value: number): void;
  incrementNumberOfFailures(): number;
}
