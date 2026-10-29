import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SagaState } from '../database/entities/saga-state.entity';
import { SagaService } from './saga.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([SagaState])],
  providers: [SagaService],
  exports: [SagaService],
})
export class SagaModule {}
