import { Injectable } from '@nestjs/common';
import type { DashboardResponse } from '@placement/contracts';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}
  /** Temporary empty-state source; authentication and interview persistence replace this aggregate. */
  async getDashboard(userId: string): Promise<DashboardResponse> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true } });
    const latestAnalysis = await this.prisma.resumeAnalysis.findFirst({
      where: { resumeVersion: { resume: { userId } } },
      orderBy: { updatedAt: 'desc' },
      select: { score: true },
    });
    const completed = await this.prisma.interviewSession.findMany({
      where: { userId, status: 'COMPLETED', completedAt: { not: null } },
      orderBy: { completedAt: 'desc' },
      select: { id: true, domain: true, company: true, finalScore: true, completedAt: true },
    });
    const totalScore = completed.reduce((sum, session) => sum + (session.finalScore ?? 0), 0);
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, index) => { const day = new Date(today); day.setDate(today.getDate() - (6 - index)); day.setHours(0, 0, 0, 0); return day; });
    const progress = days.map((day) => {
      const nextDay = new Date(day); nextDay.setDate(day.getDate() + 1);
      const scores = completed.filter((session) => session.completedAt! >= day && session.completedAt! < nextDay).map((session) => session.finalScore ?? 0);
      return { label: day.toLocaleDateString('en-US', { weekday: 'short' }), score: scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null };
    });
    let currentStreak = 0;
    for (const day of days.slice().reverse()) {
      const nextDay = new Date(day); nextDay.setDate(day.getDate() + 1);
      if (!completed.some((session) => session.completedAt! >= day && session.completedAt! < nextDay)) break;
      currentStreak += 1;
    }
    return {
      user,
      metrics: { totalInterviews: completed.length, averageScore: completed.length ? Math.round(totalScore / completed.length) : null, atsScore: latestAnalysis?.score ?? null, currentStreak },
      recentInterviews: completed.slice(0, 5).map((session) => ({ id: session.id, role: `${session.domain === 'TECHNICAL' ? 'Technical' : 'HR'} interview`, company: session.company ? companyLabel(session.company) : 'Practice session', score: session.finalScore, completedAt: session.completedAt!.toISOString() })),
      progress,
    };
  }
}

function companyLabel(company: string) { return company.charAt(0) + company.slice(1).toLowerCase(); }
