import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CoalescingService {
  private readonly logger = new Logger(CoalescingService.name);
  private readonly activeRequests = new Map<string, Promise<any>>();

  /**
   * Deduplicates concurrent execution of a function.
   * If a fetch for the key is already active, subsequent calls wait for the same promise.
   */
  async execute<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    let promise = this.activeRequests.get(key);

    if (promise) {
      this.logger.debug(`Cache stampede protected. Request coalesced for key: ${key}`);
      return promise;
    }

    promise = fetchFn().finally(() => {
      this.activeRequests.delete(key);
    });

    this.activeRequests.set(key, promise);
    return promise;
  }
}
