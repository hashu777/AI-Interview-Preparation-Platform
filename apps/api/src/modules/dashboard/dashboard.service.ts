import { Injectable } from '@nestjs/common';
import type { DashboardResponse } from '@placement/contracts';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}
  /** Temporary empty-state source; authentication and interview persistence replace this aggregate. */
  async getDashboard(userId: string): Promise<DashboardResponse> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true } });
    return { user, metrics: { totalInterviews: 0, averageScore: null, atsScore: null, currentStreak: 0 }, recentInterviews: [], progress: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((label) => ({ label, score: null })) };
  }
}
