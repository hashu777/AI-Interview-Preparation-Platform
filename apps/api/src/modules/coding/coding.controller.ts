import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/guards/session-auth.guard';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { ExecuteCodingDto } from './coding.dto';
import { CodingService } from './coding.service';

@Controller('coding')
@UseGuards(SessionAuthGuard)
export class CodingController {
  constructor(private readonly coding: CodingService) {}
  @Get('problems') list() { return this.coding.list(); }
  @Get('problems/:problemId') get(@Param('problemId') problemId: string) { return this.coding.get(problemId); }
  @Post('problems/:problemId/run') run(@Req() request: AuthenticatedRequest, @Param('problemId') problemId: string, @Body() input: ExecuteCodingDto) { return this.coding.execute(request.auth!.userId, problemId, input.language, input.sourceCode, 'RUN'); }
  @Post('problems/:problemId/submit') submit(@Req() request: AuthenticatedRequest, @Param('problemId') problemId: string, @Body() input: ExecuteCodingDto) { return this.coding.execute(request.auth!.userId, problemId, input.language, input.sourceCode, 'SUBMIT'); }
}
