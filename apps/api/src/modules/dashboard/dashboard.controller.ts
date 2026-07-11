import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/guards/session-auth.guard';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import type { DashboardResponse } from '@placement/contracts';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}
  @Get() @UseGuards(SessionAuthGuard)
  getDashboard(@Req() request: AuthenticatedRequest): Promise<DashboardResponse> { return this.dashboardService.getDashboard(request.auth!.userId); }
}
