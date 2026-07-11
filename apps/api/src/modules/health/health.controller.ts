import { Controller, Get } from '@nestjs/common';
import type { HealthResponse } from '@placement/contracts';

@Controller('health')
export class HealthController {
  @Get()
  getHealth(): HealthResponse {
    return { status: 'ok', timestamp: new Date().toISOString(), service: 'api' };
  }
}
