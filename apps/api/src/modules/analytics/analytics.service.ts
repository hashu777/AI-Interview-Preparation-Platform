import { Injectable } from '@nestjs/common';
import type { AnalyticsResponse } from '@placement/contracts';
import { PrismaService } from '../../infrastructure/database/prisma.service';

type CompletedSession = { completedAt: Date; finalScore: number | null; evaluation: { technicalAccuracy: number; communication: number; completeness: number; confidence: number; problemSolving: number } | null };

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAnalytics(userId: string): Promise<AnalyticsResponse> {
    const [sessions, analyses] = await Promise.all([
      this.prisma.interviewSession.findMany({ where: { userId, status: 'COMPLETED', completedAt: { not: null } }, orderBy: { completedAt: 'asc' }, select: { completedAt: true, finalScore: true, evaluation: { select: { technicalAccuracy: true, communication: true, completeness: true, confidence: true, problemSolving: true } } } }),
      this.prisma.resumeAnalysis.findMany({ where: { resumeVersion: { resume: { userId } } }, orderBy: { updatedAt: 'asc' }, select: { score: true, updatedAt: true } }),
    ]);
    const completed = sessions.filter((session): session is CompletedSession => session.completedAt !== null);
    const skills: Array<[string, keyof NonNullable<CompletedSession['evaluation']>]> = [['Technical accuracy', 'technicalAccuracy'], ['Communication', 'communication'], ['Completeness', 'completeness'], ['Confidence', 'confidence'], ['Problem solving', 'problemSolving']];

    return {
      interviewScoreTrend: completed.slice(-12).map((session) => ({ label: formatDate(session.completedAt), score: session.finalScore })),
      atsImprovement: analyses.slice(-12).map((analysis) => ({ label: formatDate(analysis.updatedAt), score: analysis.score })),
      skillBreakdown: skills.map(([skill, field]) => {
        const values = completed.flatMap((session) => session.evaluation ? [session.evaluation[field]] : []);
        return { skill, score: values.length ? Math.round(values.reduce((total, value) => total + value, 0) / values.length) : null };
      }),
      weeklyProgress: this.weeklyProgress(completed),
      monthlyProgress: this.monthlyProgress(completed),
    };
  }

  private weeklyProgress(sessions: CompletedSession[]) {
    const today = startOfDay(new Date());
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(today); day.setDate(today.getDate() - (6 - index));
      const nextDay = new Date(day); nextDay.setDate(day.getDate() + 1);
      const scores = sessions.filter((session) => session.completedAt >= day && session.completedAt < nextDay).map((session) => session.finalScore).filter((score): score is number => score !== null);
      return { label: day.toLocaleDateString('en-US', { weekday: 'short' }), completedInterviews: scores.length, averageScore: average(scores) };
    });
  }

  private monthlyProgress(sessions: CompletedSession[]) {
    const current = new Date(); current.setDate(1); current.setHours(0, 0, 0, 0);
    return Array.from({ length: 6 }, (_, index) => {
      const month = new Date(current); month.setMonth(current.getMonth() - (5 - index));
      const nextMonth = new Date(month); nextMonth.setMonth(month.getMonth() + 1);
      const scores = sessions.filter((session) => session.completedAt >= month && session.completedAt < nextMonth).map((session) => session.finalScore).filter((score): score is number => score !== null);
      return { label: month.toLocaleDateString('en-US', { month: 'short' }), completedInterviews: scores.length, averageScore: average(scores) };
    });
  }
}

function average(values: number[]) { return values.length ? Math.round(values.reduce((total, value) => total + value, 0) / values.length) : null; }
function startOfDay(date: Date) { const value = new Date(date); value.setHours(0, 0, 0, 0); return value; }
function formatDate(date: Date) { return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
