import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/guards/session-auth.guard';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { CreateInterviewDto, SaveAnswerDto } from './interviews.dto';
import { InterviewsService } from './interviews.service';

@Controller('interviews')
@UseGuards(SessionAuthGuard)
export class InterviewsController {
  constructor(private readonly interviews: InterviewsService) {}
  @Post() create(@Req() request: AuthenticatedRequest, @Body() input: CreateInterviewDto) { return this.interviews.create(request.auth!.userId, input); }
  @Get('company-performance') companyPerformance(@Req() request: AuthenticatedRequest) { return this.interviews.companyPerformance(request.auth!.userId); }
  @Get(':sessionId') get(@Req() request: AuthenticatedRequest, @Param('sessionId') sessionId: string) { return this.interviews.get(request.auth!.userId, sessionId); }
  @Patch(':sessionId/questions/:questionId/answer') saveAnswer(@Req() request: AuthenticatedRequest, @Param('sessionId') sessionId: string, @Param('questionId') questionId: string, @Body() input: SaveAnswerDto) { return this.interviews.saveAnswer(request.auth!.userId, sessionId, questionId, input.content); }
  @Post(':sessionId/advance') advance(@Req() request: AuthenticatedRequest, @Param('sessionId') sessionId: string) { return this.interviews.advance(request.auth!.userId, sessionId); }
  @Post(':sessionId/complete') complete(@Req() request: AuthenticatedRequest, @Param('sessionId') sessionId: string) { return this.interviews.complete(request.auth!.userId, sessionId); }
}
