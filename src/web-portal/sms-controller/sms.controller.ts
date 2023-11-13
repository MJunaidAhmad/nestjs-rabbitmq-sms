import { Controller, Get, Logger, Query, Render } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Message } from '../../shared/schema/message';
import { Model } from 'mongoose';
import { SmsQueryDto } from './sms-query.dto';

@Controller('portal/sms')
export class SMSController {
  logger = new Logger(SMSController.name);
  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
  ) {}
  @Get()
  @Render('pages/sms-messages.hbs')
  async root(@Query() query: SmsQueryDto) {
    const limit = 20;
    const page = query.page ? query.page : 1;
    const messageRecords = await this.messageModel
      .find({})
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .sort({ createdAt: -1 })
      .exec();
    const total = await this.messageModel.count();
    return {
      messages: {
        data: messageRecords,
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }
}
