import { Controller, Get } from '@nestjs/common';
import type { DashboardResponse } from '@placement/contracts';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}
  @Get()
  getDashboard(): DashboardResponse { return this.dashboardService.getDashboard(); }
}
