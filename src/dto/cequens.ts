export interface CequensAccountCredentials {
  apiKey: string;
  userName: string; //sender name
}

export class CequensMessage {
  messageText: string;
  senderName: string;
  messageType = 'text';
  recipients: string;
  dlrUrl: string = null;
}
