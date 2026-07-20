import { Injectable, NotFoundException } from '@nestjs/common';
import { InterviewDomain } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';

const technicalTerms = ['api', 'database', 'sql', 'algorithm', 'testing', 'test', 'security', 'performance', 'architecture', 'design', 'debug', 'trade-off'];
const problemSolvingTerms = ['approach', 'analyze', 'analyse', 'root cause', 'trade-off', 'solution', 'test', 'result', 'measure'];
const confidenceTerms = ['i built', 'i led', 'i implemented', 'i designed', 'i improved', 'i delivered', 'i learned'];
const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

@Injectable()
export class InterviewEvaluationService {
  constructor(private readonly prisma: PrismaService) {}

  async evaluate(userId: string, sessionId: string) {
    const session = await this.prisma.interviewSession.findFirst({
      where: { id: sessionId, userId },
      include: { questions: { include: { answer: true } } },
    });
    if (!session) throw new NotFoundException('Interview session not found.');

    const answers = session.questions.map((question) => question.answer?.content.trim() ?? '');
    const combined = answers.join(' ').toLowerCase();
    const answered = answers.filter((answer) => answer.length >= 40);
    const coverage = session.questions.length ? answered.length / session.questions.length : 0;
    const averageWords = answered.length ? answered.reduce((sum, answer) => sum + answer.split(/\s+/).filter(Boolean).length, 0) / answered.length : 0;
    const sentences = combined.split(/[.!?]+/).filter((sentence) => sentence.trim().length > 4).length;
    const termHits = (terms: string[]) => terms.filter((term) => combined.includes(term)).length;

    const completeness = clamp(coverage * 70 + Math.min(30, averageWords / 3));
    const communication = clamp(Math.min(65, averageWords * 1.2) + Math.min(35, sentences * 3));
    const confidence = clamp(35 + coverage * 35 + Math.min(30, termHits(confidenceTerms) * 6));
    const problemSolving = clamp(25 + coverage * 35 + Math.min(40, termHits(problemSolvingTerms) * 6));
    const technicalAccuracy = session.domain === InterviewDomain.TECHNICAL
      ? clamp(20 + coverage * 35 + Math.min(45, termHits(technicalTerms) * 5))
      : clamp(35 + coverage * 45 + Math.min(20, termHits(['situation', 'task', 'action', 'result']) * 5));
    const overallScore = clamp((technicalAccuracy + communication + completeness + confidence + problemSolving) / 5);

    const strengths = [
      ...(completeness >= 70 ? ['You answered most questions with enough detail.'] : []),
      ...(communication >= 70 ? ['Your responses have useful structure and sentence-level clarity.'] : []),
      ...(problemSolving >= 70 ? ['You described a clear reasoning process.'] : []),
    ];
    const suggestions = [
      ...(completeness < 70 ? ['Answer every question with a specific example, action, and outcome.'] : []),
      ...(technicalAccuracy < 70 ? [session.domain === InterviewDomain.TECHNICAL ? 'Explain the technology choice, trade-offs, testing, and measurable result.' : 'Use the STAR format: Situation, Task, Action, and Result.'] : []),
      ...(communication < 70 ? ['Use shorter, structured sentences and finish with the impact of your work.'] : []),
      ...(confidence < 70 ? ['Use ownership language such as “I designed”, “I implemented”, and “I improved”.'] : []),
      ...(problemSolving < 70 ? ['State your approach, diagnosis, alternatives considered, and final result.'] : []),
    ];
    const detailedFeedback = strengths.length
      ? `${strengths.join(' ')} Focus next on: ${suggestions.slice(0, 2).join(' ')}`
      : `Your responses need more evidence and structure. ${suggestions.slice(0, 3).join(' ')}`;
    const idealAnswer = session.domain === InterviewDomain.TECHNICAL
      ? 'Start by clarifying the problem and requirements. Describe your approach and architecture, explain the important trade-offs, then explain testing, security or performance considerations, and finish with a measurable result.'
      : 'Use the STAR method: briefly set the Situation and Task, explain the specific Actions you personally took, and close with the Result and what you learned.';

    const data = { technicalAccuracy, communication, completeness, confidence, problemSolving, overallScore, detailedFeedback, idealAnswer, suggestions };
    await this.prisma.interviewEvaluation.upsert({ where: { sessionId }, create: { sessionId, ...data }, update: data });
    await this.prisma.interviewSession.update({ where: { id: sessionId }, data: { finalScore: overallScore } });
    return data;
  }
}
