import { Controller, Post, Body } from '@nestjs/common';
import { RecoveryService } from './recovery.service';

@Controller('admin/recovery')
export class RecoveryController {
  constructor(private readonly recoveryService: RecoveryService) {}

  @Post('outbox/replay')
  async replayOutbox() {
    const replayed = await this.recoveryService.replayFailedOutbox();
    return {
      success: true,
      message: `Replayed ${replayed} outbox events successfully.`,
      count: replayed,
    };
  }

  @Post('cache/rebuild')
  async rebuildCache(@Body('pattern') pattern: string) {
    const cleared = await this.recoveryService.rebuildCache(pattern || '*');
    return {
      success: true,
      message: `Cleared ${cleared.length} cached keys matching pattern.`,
      clearedCount: cleared.length,
      keys: cleared,
    };
  }
}
