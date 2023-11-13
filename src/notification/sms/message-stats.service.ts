import { Injectable, Logger } from '@nestjs/common';
import { ObservableGauge, ObservableResult } from '@opentelemetry/api-metrics';
import { MetricService } from 'nestjs-otel';
import { InjectModel } from '@nestjs/mongoose';
import { Message } from '../../shared/schema/message';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class MessageStatsService {
  notDeliveredMessagesObserver: ObservableGauge;
  private notDeliveredMessages: number;
  logger = new Logger(MessageStatsService.name);

  constructor(
    private metricService: MetricService,
    @InjectModel(Message.name) private messageModel: Model<Message>,
  ) {
    this.notDeliveredMessagesObserver = this.metricService.getObservableGauge(
      'not_delivered_messages_gauge',
      { description: 'number of messages not delivered in last sixty minutes' },
      (observableResult: ObservableResult) => {
        observableResult.observe(this.notDeliveredMessages, {});
      },
    );
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async getMessageCounter() {
    try {
      const timeDifferece = 60;
      const timeOffset = 10;
      let prevTime = new Date();
      prevTime.setMinutes(prevTime.getMinutes() - timeDifferece - timeOffset);

      const count = await this.messageModel
        .find({
          status: { $eq: 'sent' },
          createdAt: {
            $gte: prevTime,
            $lt: new Date(Date.now() - timeOffset*1000*60),
          },
        })
        .count();

      this.logger.log(
        `Number of not delivered messages in last sixty minutes, ${count}`,
      );

      this.notDeliveredMessages = count;

      this.notDeliveredMessagesObserver.observation(count, {});

      return true;
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  }
}
