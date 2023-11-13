import { Module, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { InfobipConsumerModule } from './src/consumer/infobip-consumer.module';
import { Logger } from 'nestjs-pino';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from './src/shared/schema/message';
import {
  CequensCredentials,
  CequensCrendentialsSchema,
} from 'src/shared/schema/cequens';
import { CequensService } from 'src/notification/sms/cequens.service';
import { CequensConsumerModule } from 'src/consumer/cequens-consumer.module';
import { CequensCredentialsSeeder } from 'src/shared/seeders/CequensCredentialsSeeder';
import otelSDK from 'src/telemetry/otelSDK';
import { OpenTelemetryModule } from 'nestjs-otel';
import { CequensCallbackControllerController } from 'src/cequens-callback-controller/cequens-callback-controller.controller';
import { ArpuplusCallbackController } from 'src/arpuplus-callback-controller/arpuplus-callback.controller';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Environment } from 'src/env';
import { ScheduleModule } from '@nestjs/schedule';
import { TwilioController } from 'src/notification/voice/channels/twilio/twilio.controller';
import {
  VoiceMessage,
  VoiceMessageSchema,
} from 'src/shared/schema/voice-message';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { VoiceService } from './src/notification/voice/voice-service/voice.service';
import { VoiceChannel } from './src/notification/voice/channels/voice-channel';
import { VoiceController } from './src/notification/voice/voice-service/voice.controller';
import { join } from 'path';
import { HomeController } from './src/web-portal/home-controller/home.controller';
import { WebPortalModule } from './src/web-portal/web-portal.module';
import * as Handlebars from 'handlebars';
import { initHandlebarsHelpers } from './src/web-portal/helpers';
import { WebConsumerModule } from './src/consumer/web-consumer.module';
import { InfobipCallbackController } from './src/infobip-callback/infobip-callback.controller';
import { InfoBipService } from './src/notification/sms/infobip.service';
import {
  SMSChannelConfig,
  SMSChannelConfigSchema,
} from './src/shared/schema/sms-provider-config';
import { ArpuPlusService } from 'src/notification/sms/arpuplus.service';
import { MessageStatsService } from 'src/notification/sms/message-stats.service';
import { ArpuPlusConsumerModule } from 'src/consumer/arpuplus-consumer.module';
import { SMSUtilModule } from './src/shared/sms-util.module';
import { SMSGlobalConsumerModule } from 'src/consumer/smsglobal-consumer.module';
import { SMSGlobalService } from 'src/notification/sms/smsglobal.service';
import { SMSGlobalCallbackController } from 'src/smsglobal-callback-controller/smsglobal-callback.controller';

const OpenTelemetryModuleConfig = OpenTelemetryModule.forRoot({
  metrics: {
    hostMetrics: true, // Includes Host Metrics
    defaultMetrics: true, // Includes Default Metrics
    apiMetrics: {
      enable: true, // Includes api metrics
      timeBuckets: [], // You can change the default time buckets
      ignoreRoutes: ['/favicon.ico'], // You can ignore specific routes (See https://docs.nestjs.com/middleware#excluding-routes for options)
      ignoreUndefinedRoutes: false, //Records metrics for all URLs, even undefined ones
    },
  },
});
@Module({
  imports: [
    SMSGlobalConsumerModule,
    ArpuPlusConsumerModule,
    InfobipConsumerModule,
    CequensConsumerModule,
    WebConsumerModule.register(),
    WebPortalModule.register(),
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: CequensCredentials.name, schema: CequensCrendentialsSchema },
      { name: VoiceMessage.name, schema: VoiceMessageSchema },
      { name: SMSChannelConfig.name, schema: SMSChannelConfigSchema },
    ]),
    OpenTelemetryModuleConfig,
    ScheduleModule.forRoot(),
    SMSUtilModule,
  ],
  providers: [
    CequensCredentialsSeeder,
    CequensService,
    InfoBipService,
    VoiceService,
    VoiceChannel,
    SMSGlobalService,
    ArpuPlusService,
    MessageStatsService,
  ],
  exports: [],
  controllers: [
    ArpuplusCallbackController,
    SMSGlobalCallbackController,
    CequensCallbackControllerController,
    InfobipCallbackController,
    TwilioController,
    VoiceController,
  ],
})
export class MainModule {}

// iife to initialize modules and providers
(async () => {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Communication Service')
    .setDescription('CommunicationService API description')
    .setVersion('1.0')
    .build();

  await otelSDK.start();
  const app = await NestFactory.create<NestFastifyApplication>(
    MainModule,
    new FastifyAdapter(),
  );
  console.log(join(__dirname, '..', 'public'));
  app.useStaticAssets({
    root: join(__dirname, '..', 'public'),
  });
  app.setViewEngine({
    engine: {
      handlebars: require('handlebars'),
    },
    templates: join(__dirname, '..', 'views'),
    options: {
      partials: {
        style: 'partials/style.hbs',
        sidebar: 'partials/sidebar.hbs',
        scripts: 'partials/scripts.hbs',
        mainLayout: 'layout/main.hbs',
      },
    },
  });
  initHandlebarsHelpers();
  app.useLogger(app.get(Logger));
  const seeder = app.get(CequensCredentialsSeeder);
  seeder.seed();
  app.enableVersioning({
    type: VersioningType.URI,
  });
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);
  await app.listen(Environment.PORT, '0.0.0.0');
})();
