import { Module, Global } from '@nestjs/common';
import { CoalescingService } from './coalesce.service';

@Global()
@Module({
  providers: [CoalescingService],
  exports: [CoalescingService],
})
export class CoalesceModule {}
