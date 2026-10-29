import { Injectable } from '@nestjs/common';
import * as promClient from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly registry: promClient.Registry;

  public readonly apiLatency: promClient.Histogram;
  public readonly dbLatency: promClient.Histogram;
  public readonly redisLatency: promClient.Histogram;
  public readonly kafkaLag: promClient.Gauge;
  public readonly queueProcessingTime: promClient.Histogram;

  constructor() {
    this.registry = new promClient.Registry();
    promClient.collectDefaultMetrics({ register: this.registry });

    this.apiLatency = new promClient.Histogram({
      name: 'api_request_duration_seconds',
      help: 'API latency in seconds',
      labelNames: ['method', 'path', 'status'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    this.dbLatency = new promClient.Histogram({
      name: 'db_query_duration_seconds',
      help: 'Database query latency in seconds',
      labelNames: ['query_type', 'entity'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      registers: [this.registry],
    });

    this.redisLatency = new promClient.Histogram({
      name: 'redis_command_duration_seconds',
      help: 'Redis command duration in seconds',
      labelNames: ['command'],
      buckets: [0.0005, 0.001, 0.002, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25],
      registers: [this.registry],
    });

    this.kafkaLag = new promClient.Gauge({
      name: 'kafka_consumer_lag_records',
      help: 'Kafka consumer lag count',
      labelNames: ['topic', 'consumer_group'],
      registers: [this.registry],
    });

    this.queueProcessingTime = new promClient.Histogram({
      name: 'queue_job_processing_seconds',
      help: 'BullMQ job processing latency in seconds',
      labelNames: ['queue_name', 'job_name'],
      buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30],
      registers: [this.registry],
    });
  }

  async getMetrics(): Promise<string> {
    return await this.registry.metrics();
  }
}
