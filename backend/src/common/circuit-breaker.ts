import { Logger } from '@nestjs/common';

export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export class CircuitBreaker {
  private readonly logger = new Logger(CircuitBreaker.name);
  private state = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private lastStateChange: number = Date.now();

  constructor(
    private readonly name: string,
    private readonly failureThreshold = 5,
    private readonly recoveryTimeoutMs = 30000, // 30 seconds recovery test
  ) {}

  /**
   * Runs the operation inside the circuit breaker wrapper.
   * If the circuit is open, triggers the fallback immediately.
   */
  async execute<T>(action: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
    this.updateState();

    if (this.state === CircuitBreakerState.OPEN) {
      this.logger.warn(`Circuit Breaker "${this.name}" is OPEN. Redirecting to fallback.`);
      return fallback();
    }

    try {
      const result = await action();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      return fallback();
    }
  }

  private updateState(): void {
    const now = Date.now();
    if (
      this.state === CircuitBreakerState.OPEN &&
      now - this.lastStateChange > this.recoveryTimeoutMs
    ) {
      this.state = CircuitBreakerState.HALF_OPEN;
      this.lastStateChange = now;
      this.logger.warn(`Circuit Breaker "${this.name}" transitioned to HALF_OPEN. Testing endpoint health.`);
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.state = CircuitBreakerState.CLOSED;
      this.lastStateChange = Date.now();
      this.logger.log(`Circuit Breaker "${this.name}" recovered and returned to CLOSED.`);
    }
  }

  private onFailure(error: Error): void {
    this.failureCount++;
    this.logger.error(`Circuit Breaker "${this.name}" operation failed (Count: ${this.failureCount}). Error: ${error.message}`);
    
    if (
      this.state === CircuitBreakerState.HALF_OPEN ||
      this.failureCount >= this.failureThreshold
    ) {
      this.state = CircuitBreakerState.OPEN;
      this.lastStateChange = Date.now();
      this.logger.error(`Circuit Breaker "${this.name}" transitioned to OPEN. Fast-failing active traffic.`);
    }
  }
}
