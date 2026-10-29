import { Module, Global } from '@nestjs/common';
import { RecoveryService } from './recovery.service';
import { RecoveryController } from './recovery.controller';
import { OutboxModule } from '../outbox/outbox.module';

@Global()
@Module({
  imports: [OutboxModule],
  providers: [RecoveryService],
  controllers: [RecoveryController],
  exports: [RecoveryService],
})
export class RecoveryModule {}
