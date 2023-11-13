import { Test, TestingModule } from '@nestjs/testing';
import { ArpuPlusService } from '../notification/sms/arpuplus.service';
import { MESSAGE_STATUS } from '../shared/enums/message-status';
import { ArpuplusCallbackController } from './arpuplus-callback.controller';
import { MessageCallbackDto } from './MessageCallbackDto';

const ArpuPlusServiceMock = {
  updateMessageStatus: jest.fn(() => {}),
};

const dto: MessageCallbackDto = {
  messageId: '1234',
  status: MESSAGE_STATUS.DELIVERED,
};

describe('ArpuplusCallbackControllerController', () => {
  let arpuplusCallbackController: ArpuplusCallbackController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArpuplusCallbackController],
      providers: [ArpuPlusService],
    })
      .overrideProvider(ArpuPlusService)
      .useValue(ArpuPlusServiceMock)
      .compile();

    arpuplusCallbackController =
      module.get<ArpuplusCallbackController>(
        ArpuplusCallbackController,
      );
  });

  it('Test Arpuplus Callback', async () => {
    expect(await arpuplusCallbackController.home(dto)).toEqual('Success');
  });
});