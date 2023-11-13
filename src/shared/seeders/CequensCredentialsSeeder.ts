import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CequensCredentials } from '../schema/cequens';
@Injectable()
export class CequensCredentialsSeeder {
  constructor(
    @InjectModel(CequensCredentials.name)
    private cequensCredentialsModel: Model<CequensCredentials>,
  ) {}

  public async seed() {
    if ((await this.cequensCredentialsModel.count()) == 0) {
      this.cequensCredentialsModel.insertMany(this.credentials);
    }
  }

  readonly credentials = [
    {
      userName: process.env.SMS_CEQUENS_USER_NAME,
      apiKey: process.env.SMS_CEQUENS_API_KEY,
      bearerToken: process.env.SMS_CEQUENS_ACCESS_TOKEN,
    },
    {
      userName: process.env.SMS_CEQUENS_OTP_USER_NAME,
      apiKey: process.env.SMS_CEQUENS_OTP_API_KEY,
      bearerToken: process.env.SMS_CEQUENS_OTP_ACCESS_TOKEN,
    },
  ];
}
