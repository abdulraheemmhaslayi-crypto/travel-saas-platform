import { Injectable, Logger, Inject, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Producer, Kafka } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private producer: Producer;

  constructor(@Inject('KAFKA_CLIENT') private readonly kafka: Kafka) {}

  async onModuleInit(): Promise<void> {
    if (process.env.KAFKA_ENABLED === 'false') {
      this.logger.warn('Kafka is disabled (KAFKA_ENABLED=false). Running in fallback mode.');
      return;
    }
    try {
      this.producer = this.kafka.producer({
        allowAutoTopicCreation: true,
        transactionTimeout: 30000,
      });

      await this.producer.connect();
      this.logger.log('Kafka producer connected');
    } catch (error: any) {
      this.logger.warn(`Kafka producer connection failed: ${error?.message || error}. Continuing in fallback mode.`);
      this.producer = null as any;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.producer) {
      try {
        await this.producer.disconnect();
        this.logger.log('Kafka producer disconnected');
      } catch (err) {}
    }
  }

  async publish(topic: string, message: any, key?: string): Promise<void> {
    if (!this.producer) {
      this.logger.debug(`Kafka not connected. Skipped publishing to ${topic}`);
      return;
    }
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: key || `${topic}-${Date.now()}`,
            value: JSON.stringify({
              ...message,
              _metadata: {
                timestamp: new Date().toISOString(),
                service: 'travel-saas-api',
                version: '1.0.0',
              },
            }),
            headers: {
              'content-type': 'application/json',
              'x-correlation-id': this.generateCorrelationId(),
            },
          },
        ],
      });

      this.logger.debug(`Published to ${topic}: ${JSON.stringify(message)}`);
    } catch (error) {
      this.logger.error(`Failed to publish to ${topic}`, error);
      throw error;
    }
  }

  async publishBatch(topic: string, messages: any[]): Promise<void> {
    if (!this.producer) {
      this.logger.debug(`Kafka not connected. Skipped publishing batch to ${topic}`);
      return;
    }
    try {
      await this.producer.send({
        topic,
        messages: messages.map((msg, index) => ({
          key: `${topic}-${Date.now()}-${index}`,
          value: JSON.stringify({
            ...msg,
            _metadata: {
              timestamp: new Date().toISOString(),
              service: 'travel-saas-api',
              version: '1.0.0',
            },
          }),
        })),
      });

      this.logger.debug(`Published batch of ${messages.length} messages to ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to publish batch to ${topic}`, error);
      throw error;
    }
  }

  async sendTransaction(topics: { topic: string; message: any; key?: string }[]): Promise<void> {
    if (!this.producer) {
      this.logger.debug(`Kafka not connected. Skipped transaction`);
      return;
    }
    const transaction = await this.producer.transaction();

    try {
      for (const { topic, message, key } of topics) {
        await transaction.send({
          topic,
          messages: [
            {
              key: key || `${topic}-${Date.now()}`,
              value: JSON.stringify(message),
            },
          ],
        });
      }

      await transaction.commit();
      this.logger.debug(`Transaction committed with ${topics.length} messages`);
    } catch (error) {
      await transaction.abort();
      this.logger.error('Transaction aborted', error);
      throw error;
    }
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
