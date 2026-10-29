import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Outbox } from '../database/entities/outbox.entity';
import { OutboxService } from './outbox.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Outbox])],
  providers: [OutboxService],
  exports: [OutboxService],
})
export class OutboxModule {}
