import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MetricService } from 'nestjs-otel';
import { MessageCallbackDto } from '../../arpuplus-callback-controller/MessageCallbackDto';
import { SmsBodyDto } from 'src/dto/sms.body';
import { MESSAGE_STATUS } from '../../shared/enums/message-status';
import { Message } from '../../shared/schema/message';
import { ArpuPlusService } from './arpuplus.service';
import { ProviderError } from '../../shared/providerError';

let messageModelMock = {
  findOne: jest.fn((data) => {
    if (data['providerResponse.message_id'] === 1234)
      return {
        status: false,
        markModified() {},
        save() {},
        updatedAt: 'none',
        providerResponse: { callbackResponse: false },
      };
    return NotFoundException;
  }),
};

const sendSMSresponse = {
  status: true,
  status_description: 'Message Received',
  message_parts: 1,
};

const responseObjKeys = [
  'message_id',
  'status',
  'status_description',
  'time_stamp',
  'message_parts',
];

const dto: MessageCallbackDto = {
  messageId: '1234',
  status: MESSAGE_STATUS.DELIVERED,
} as MessageCallbackDto;

const message_correct_data: SmsBodyDto = {
  phoneNumber: '+201032828908',
  message: 'Hello from RabbitMq',
  service: 'b2b',
  correlationId: '1',
  retryFor: '1',
};

const message_wrong_data: SmsBodyDto = {
  message: 'Hello from RabbitMq',
  phoneNumber: '+923325484205',
  service: 'b2b',
  correlationId: '1',
  retryFor: '1',
};

describe('ArpuPlusService', () => {
  let arpuPlusService: ArpuPlusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArpuPlusService,
        MetricService,
        { provide: getModelToken(Message.name), useValue: messageModelMock },
      ],
    }).compile();

    arpuPlusService = module.get<ArpuPlusService>(ArpuPlusService);
  });

  it('Send Message Mock Check Keys', async () => {
    expect(
      Object.keys(
        await arpuPlusService.sendMessage(message_correct_data),
      ).sort(),
    ).toEqual(responseObjKeys.sort());
  });

  it('Send Message Mock Correct Number', async () => {
    expect(
      await arpuPlusService.sendMessage(message_correct_data),
    ).toMatchObject(sendSMSresponse);
  });

  it('Send Message Mock Wrong Number', async () => {
    try {
      expect(await arpuPlusService.sendMessage(message_wrong_data)).toEqual(
        expect.objectContaining(sendSMSresponse),
      );
    } catch (error) {
      expect(error).toBeInstanceOf(ProviderError);
    }
  });

  it('Update Message Status Mock', async () => {
    expect(await arpuPlusService.updateMessageStatus(dto)).toEqual('Success');
  });

  it('Get Balance Mock', async () => {
    expect(await arpuPlusService.getBalance()).toEqual(true);
  });
});
