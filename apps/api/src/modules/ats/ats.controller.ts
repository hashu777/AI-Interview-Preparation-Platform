import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/guards/session-auth.guard';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { AtsService } from './ats.service';

@Controller('ats')
@UseGuards(SessionAuthGuard)
export class AtsController {
  constructor(private readonly ats: AtsService) {}

  @Get('resume-versions/:versionId')
  getAnalysis(@Req() request: AuthenticatedRequest, @Param('versionId') versionId: string) {
    return this.ats.getAnalysis(request.auth!.userId, versionId);
  }
}
