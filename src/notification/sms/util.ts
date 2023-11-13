import { SmsBodyDto } from '../../dto/sms.body';
import { SenderId, serviceSenderNameMap } from './cequens.config';

export function determineSenderName(message: SmsBodyDto) {
  if (message.senderId) {
    return message.senderId;
  } else {
    return serviceSenderNameMap[message.service] ?? SenderId.CashKateb;
  }
}
