import { Test, TestingModule } from '@nestjs/testing';
import { MetricService } from 'nestjs-otel';
import { InfoBipService } from '../notification/sms/infobip.service';
import { InfobipCallbackController } from './infobip-callback.controller';
import { Message } from '../shared/schema/message';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';

const messageModelMock = {
  findOne: jest.fn((data) => {
    if (data['providerResponse.message_id'] === '1234')
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

describe('InfobipCallbackController', () => {
  let controller: InfobipCallbackController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InfobipCallbackController],
      providers: [
        InfoBipService,
        MetricService,
        { provide: getModelToken(Message.name), useValue: messageModelMock },
      ],
    }).compile();

    controller = module.get<InfobipCallbackController>(
      InfobipCallbackController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
