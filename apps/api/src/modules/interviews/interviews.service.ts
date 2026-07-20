import { Injectable, NotFoundException } from '@nestjs/common';
import { InterviewDifficulty, InterviewDomain } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { InterviewQuestionService } from './interview-question.service';
import { InterviewEvaluationService } from './interview-evaluation.service';

const includeSession = { evaluation: true, questions: { orderBy: { position: 'asc' as const }, include: { answer: { select: { content: true } } } } };

@Injectable()
export class InterviewsService {
  constructor(private readonly prisma: PrismaService, private readonly questions: InterviewQuestionService, private readonly evaluator: InterviewEvaluationService) {}

  create(userId: string, input: { domain: InterviewDomain; difficulty: InterviewDifficulty; durationMinutes: number; isVoice?: boolean }) {
    const count = Math.max(3, Math.min(8, Math.round(input.durationMinutes / 5)));
    return this.prisma.interviewSession.create({ data: { ...input, isVoice: input.isVoice ?? false, userId, questions: { create: this.questions.generate(input.domain, input.difficulty, count) } }, include: includeSession });
  }

  async get(userId: string, sessionId: string) {
    const session = await this.prisma.interviewSession.findFirst({ where: { id: sessionId, userId }, include: includeSession });
    if (!session) throw new NotFoundException('Interview session not found.');
    return session;
  }

  async saveAnswer(userId: string, sessionId: string, questionId: string, content: string) {
    await this.get(userId, sessionId);
    const question = await this.prisma.interviewQuestion.findFirst({ where: { id: questionId, sessionId } });
    if (!question) throw new NotFoundException('Interview question not found.');
    await this.prisma.interviewAnswer.upsert({ where: { questionId }, create: { questionId, content }, update: { content } });
    return this.prisma.interviewSession.update({ where: { id: sessionId }, data: { updatedAt: new Date() }, include: includeSession });
  }

  async advance(userId: string, sessionId: string) {
    const session = await this.get(userId, sessionId);
    if (session.status !== 'IN_PROGRESS') return session;
    return this.prisma.interviewSession.update({ where: { id: sessionId }, data: { currentQuestionIndex: Math.min(session.currentQuestionIndex + 1, session.questions.length - 1) }, include: includeSession });
  }

  async complete(userId: string, sessionId: string) {
    const session = await this.get(userId, sessionId);
    if (session.status === 'COMPLETED') return session;
    await this.prisma.interviewSession.update({ where: { id: sessionId }, data: { status: 'COMPLETED', completedAt: new Date() } });
    await this.evaluator.evaluate(userId, sessionId);
    return this.get(userId, sessionId);
  }
}
