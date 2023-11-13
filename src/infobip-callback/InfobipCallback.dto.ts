export class InfobipCallbackDto {
  results: Result[];
}
export class Price {
  pricePerMessage: number;
  currency: string;
}

export class Status {
  groupId: number;
  groupName: string;
  id: number;
  name: string;
  description: string;
}

export class Error {
  groupId: number;
  groupName: string;
  id: number;
  name: string;
  description: string;
  permanent: boolean;
}

export class Result {
  bulkId: string;
  messageId: string;
  to: string;
  sentAt: Date;
  doneAt: Date;
  smsCount: number;
  price: Price;
  status: Status;
  error: Error;
}
