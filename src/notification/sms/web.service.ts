import { Injectable } from '@nestjs/common';
import { ISMSProvider } from './sms.service';
import { SmsBodyDto } from '../../dto/sms.body';
import { Validate, Validator } from '@cassbana/projectx-nest-shared';

@Injectable()
export class WebChannelService implements ISMSProvider {
  numberOfFailures = 0;
  getName() {
    return 'web';
  }
  @Validate()
  async sendMessage(@Validator() message: SmsBodyDto) {
    return 'Sent successfully';
  }

  getNumberOfFailures(): number {
    return this.numberOfFailures;
  }

  incrementNumberOfFailures(): number {
    return ++this.numberOfFailures;
  }

  setNumberOfFailures(value: number): void {
    this.numberOfFailures = value;
  }
}
