import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class KeepAliveService implements OnApplicationBootstrap {
  private readonly logger = new Logger(KeepAliveService.name);

  onApplicationBootstrap() {
    // Initial ping 1 minute after startup to verify connectivity
    setTimeout(() => {
      this.pingSelf().catch(() => {});
    }, 60000);
  }

  // Runs every 20 minutes (0, 20, 40 past each hour) to prevent Blitz 30m idle sleep
  @Cron('0 */20 * * * *')
  async handleKeepAlive() {
    await this.pingSelf();
  }

  private async pingSelf(): Promise<void> {
    if (process.env.NODE_ENV === 'development' && !process.env.APP_URL && !process.env.PING_URL) {
      return;
    }
    const rawUrl =
      process.env.APP_URL ||
      process.env.PING_URL ||
      'https://travel-saas-platform.quick.blitz.cloud';

    const baseUrl = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
    const targetUrl = baseUrl.includes('/api/v1') ? `${baseUrl}/health` : `${baseUrl}/api/v1/health`;

    try {
      this.logger.log(`[KeepAlive] Sending keep-alive request to: ${targetUrl}`);
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'TravelSaaS-KeepAlive/1.0',
          'Accept': 'application/json',
        },
      });

      this.logger.log(`[KeepAlive] Received status: ${response.status} (${response.statusText})`);
    } catch (error: any) {
      this.logger.warn(
        `[KeepAlive] Ping request failed (will retry in 20m): ${error?.message || error}`,
      );
    }
  }
}

