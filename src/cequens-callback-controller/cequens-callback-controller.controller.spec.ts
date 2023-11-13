import { Test, TestingModule } from '@nestjs/testing';
import { CequensService } from '../notification/sms/cequens.service';
import { CequensCallbackControllerController } from './cequens-callback-controller.controller';

describe('CequensCallbackControllerController', () => {
  let controller: CequensCallbackControllerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CequensCallbackControllerController],
      providers: [],
    })
      .useMocker((token) => {
        if (token == CequensService) {
          return {};
        }
      })
      .compile();

    controller = module.get<CequensCallbackControllerController>(
      CequensCallbackControllerController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
