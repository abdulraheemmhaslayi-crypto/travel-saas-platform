import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SagaState, SagaStatus } from '../database/entities/saga-state.entity';

export interface SagaStep {
  name: string;
  forward: () => Promise<any>;
  compensate: () => Promise<any>;
}

@Injectable()
export class SagaService {
  private readonly logger = new Logger(SagaService.name);

  constructor(
    @InjectRepository(SagaState)
    private readonly sagaRepository: Repository<SagaState>,
  ) {}

  /**
   * Executes a list of transactional steps.
   * If any step fails, runs the compensations of all previously successful steps in reverse order.
   */
  async executeSaga(sagaType: string, payload: any, steps: SagaStep[]): Promise<void> {
    const saga = this.sagaRepository.create({
      sagaType,
      payload: JSON.stringify(payload),
      status: SagaStatus.STARTED,
      steps: JSON.stringify([]),
    });
    await this.sagaRepository.save(saga);

    const executedSteps: { name: string; timestamp: string }[] = [];

    for (const step of steps) {
      this.logger.log(`Saga ${saga.id} [${sagaType}]: Executing forward step "${step.name}"`);
      try {
        await step.forward();
        executedSteps.push({ name: step.name, timestamp: new Date().toISOString() });
        saga.steps = JSON.stringify(executedSteps);
        await this.sagaRepository.save(saga);
      } catch (error) {
        this.logger.error(`Saga ${saga.id} [${sagaType}]: Step "${step.name}" failed. Error: ${error.message}`);
        
        saga.status = SagaStatus.COMPENSATING;
        await this.sagaRepository.save(saga);

        // Compensation in reverse order
        for (let i = executedSteps.length - 1; i >= 0; i--) {
          const activeStep = steps.find((s) => s.name === executedSteps[i].name);
          if (activeStep) {
            this.logger.warn(`Saga ${saga.id} [${sagaType}]: Triggering compensation for step "${activeStep.name}"`);
            try {
              await activeStep.compensate();
            } catch (compError) {
              this.logger.error(`Saga ${saga.id} [${sagaType}]: Compensation for step "${activeStep.name}" failed!`, compError);
            }
          }
        }

        saga.status = SagaStatus.FAILED;
        await this.sagaRepository.save(saga);
        throw error;
      }
    }

    saga.status = SagaStatus.COMPLETED;
    await this.sagaRepository.save(saga);
    this.logger.log(`Saga ${saga.id} [${sagaType}]: Successfully completed workflow`);
  }
}
