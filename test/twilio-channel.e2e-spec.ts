import { MongooseModule } from '@nestjs/mongoose';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { TwilioController } from '../src/notification/voice/channels/twilio/twilio.controller';
import { TwilioChannel } from '../src/notification/voice/channels/twilio/twilio-channel';
import {
  VoiceMessage,
  VoiceMessageSchema,
} from '../src/shared/schema/voice-message';
import { rootMongooseTestModule } from './util';

let app: NestFastifyApplication;

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [
      rootMongooseTestModule(),
      MongooseModule.forFeature([
        {
          name: VoiceMessage.name,
          schema: VoiceMessageSchema,
        },
      ]),
    ],
    providers: [TwilioChannel],
    controllers: [TwilioController],
  }).compile();

  app = moduleRef.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
  );

  await app.init();
  await app.getHttpAdapter().getInstance().ready();
});

it(`/POST`, () => {
  return app
    .inject({
      method: 'POST',
      url: 'twilio/send-call',
      payload: {
        phoneNumber: '+201032828908',
        language: 'en',
        message: 'Good evening.',
        service: 'b2b',
        correlationId: '1',
      },
    })
    .then((result) => {
      expect(result.statusCode).toEqual(201);
    });
});

afterAll(async () => {
  await app.close();
});
