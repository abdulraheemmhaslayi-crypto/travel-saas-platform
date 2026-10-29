import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';

@Processor('notification-queue')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly notificationsService: NotificationsService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing background notification job: ${job.name} (ID: ${job.id})`);
    
    if (job.name === 'send-notification') {
      const { userId, type, title, message, data } = job.data;
      
      // Send notification via database/push
      await this.notificationsService.createNotification({
        userId,
        type,
        channel: 'PUSH',
        title,
        message,
        data,
      }, true);
      
      return { success: true };
    }

    throw new Error(`Unsupported job name in notification processor: ${job.name}`);
  }
}

@Processor('report-queue')
export class ReportProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportProcessor.name);

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing background report job: ${job.name} (ID: ${job.id})`);
    
    if (job.name === 'generate-report') {
      const { reportId, parameters } = job.data;
      // Simulated heavy report compilation
      this.logger.log(`Starting report compilation for ${reportId} with params ${JSON.stringify(parameters)}`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      this.logger.log(`Finished compiling report ${reportId}`);
      return { success: true, url: `/exports/${reportId}.csv` };
    }

    throw new Error(`Unsupported job name in report processor: ${job.name}`);
  }
}
