import { DynamicModule, Module } from '@nestjs/common';
import { SMSController } from './sms-controller/sms.controller';
import { HomeController } from './home-controller/home.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from '../shared/schema/message';
import {
  CequensCredentials,
  CequensCrendentialsSchema,
} from '../shared/schema/cequens';
import { Environment } from '../env';

@Module({})
export class WebPortalModule {
  //used to register the module if the web portal is allowed on the environment
  static register(): DynamicModule {
    if (Environment.ALLOW_WEB_PORTAL != 'true') {
      return { module: WebPortalModule };
    } else {
      return {
        module: WebPortalModule,
        controllers: [SMSController, HomeController],
        imports: [
          MongooseModule.forFeature([
            { name: Message.name, schema: MessageSchema },
            {
              name: CequensCredentials.name,
              schema: CequensCrendentialsSchema,
            },
          ]),
        ],
      };
    }
  }
}
