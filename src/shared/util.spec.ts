import { Test, TestingModule } from '@nestjs/testing';
import { CequensService } from '../notification/sms/cequens.service';
import { SMSUtil } from './sms-util';
import { rootMongooseTestModule } from '../../test/util';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from './schema/message';
import {
  SMSChannelConfig,
  SMSChannelConfigSchema,
} from './schema/sms-provider-config';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { MetricService } from 'nestjs-otel';
import { SMSProviderMock } from '../notification/sms/mock-provider.service';
import { Model } from 'mongoose';

describe('SMSUtil', () => {
  let smsUtil: SMSUtil;
  let messageModel;
  let messageConfigModel;

  jest.mock('nestjs-otel');
  jest.mock('@golevelup/nestjs-rabbitmq');
  const mockedAmqp = AmqpConnection as jest.Mocked<typeof AmqpConnection>;
  mockedAmqp.prototype.publish = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SMSUtil,
        MetricService,
        { provide: AmqpConnection, useClass: mockedAmqp },
      ],
      imports: [
        rootMongooseTestModule(),
        MongooseModule.forFeature([
          { name: Message.name, schema: MessageSchema },
          { name: SMSChannelConfig.name, schema: SMSChannelConfigSchema },
        ]),
      ],
    }).compile();

    messageModel = module.get<Model<Message>>(getModelToken(Message.name));
    messageConfigModel = module.get<Model<SMSChannelConfig>>(
      getModelToken(SMSChannelConfig.name),
    );
    const smsChannelConfig = await messageConfigModel.create({
      secondaryProviders: ['cequens', 'infobip'],
    });
    console.log(await messageConfigModel.findOne());
    smsUtil = module.get<SMSUtil>(SMSUtil);
    smsUtil.smsChannelConfig = smsChannelConfig;
  });

  it('should be defined', () => {
    expect(smsUtil).toBeDefined();
  });

  it('should return save sms message in the db', async () => {
    expect.assertions(1);
    await smsUtil.sendSMS(new SMSProviderMock(), messageModel, {
      message: 'Success message',
      phoneNumber: '+201032828908',
      service: 'projectx',
      correlationId: '1',
      senderId: 'CashKateb',
      retryFor: null,
    });
    const message = await messageModel.findOne({
      'message.text': 'Success message',
    });
    expect(message).toBeDefined();
  });
});
