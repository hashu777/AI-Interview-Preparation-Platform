import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { AnalyticsResponse } from '@placement/contracts';
import type { AuthenticatedRequest } from '../auth/guards/session-auth.guard';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(SessionAuthGuard)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get()
  getAnalytics(@Req() request: AuthenticatedRequest): Promise<AnalyticsResponse> {
    return this.analytics.getAnalytics(request.auth!.userId);
  }
}
