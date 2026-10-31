import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';

@Controller()
export class HealthController {
  @Public()
  @Get()
  root() {
    return {
      status: 'ok',
      service: 'travel-saas-api',
      documentation: '/api/docs',
      health: '/api/v1/health',
    };
  }

  @Public()
  @Get('health')
  healthRoot() {
    return {
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      service: 'travel-saas-api',
    };
  }
}

@Controller('health')
export class ApiHealthController {
  @Public()
  @Get()
  check() {
    return {
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      service: 'travel-saas-api',
    };
  }
}
