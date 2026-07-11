import { Injectable } from '@nestjs/common';
import type { DashboardResponse } from '@placement/contracts';

@Injectable()
export class DashboardService {
  /** Temporary empty-state source; authentication and interview persistence replace this aggregate. */
  getDashboard(): DashboardResponse {
    return { user: { name: 'there' }, metrics: { totalInterviews: 0, averageScore: null, atsScore: null, currentStreak: 0 }, recentInterviews: [], progress: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((label) => ({ label, score: null })) };
  }
}
