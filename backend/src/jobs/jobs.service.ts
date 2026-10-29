import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    @InjectQueue('notification-queue') private readonly notificationQueue: Queue,
    @InjectQueue('report-queue') private readonly reportQueue: Queue,
  ) {}

  /**
   * Dispatches user notification jobs (emails, SMS, push alerts) to BullMQ.
   */
  async dispatchNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    data?: any,
  ): Promise<void> {
    this.logger.debug(`Dispatching notification job for User: ${userId} to BullMQ`);
    await this.notificationQueue.add(
      'send-notification',
      { userId, type, title, message, data },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000, // Start with 5s backoff
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }

  /**
   * Dispatches heavy data reporting and PDF exports to BullMQ.
   */
  async dispatchReport(reportId: string, parameters: any): Promise<void> {
    this.logger.debug(`Dispatching report generation job for Report: ${reportId}`);
    await this.reportQueue.add(
      'generate-report',
      { reportId, parameters },
      {
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 10000,
        },
        removeOnComplete: false,
        removeOnFail: false,
      },
    );
  }
}
