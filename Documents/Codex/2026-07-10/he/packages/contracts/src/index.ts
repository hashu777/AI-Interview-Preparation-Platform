/** Shared public API contracts. Keep this package framework-independent. */
export interface HealthResponse {
  status: 'ok';
  timestamp: string;
  service: 'api';
}

export interface ApiErrorResponse {
  statusCode: number;
  code: string;
  message: string;
  requestId: string;
}

export interface DashboardResponse {
  user: { name: string };
  metrics: { totalInterviews: number; averageScore: number | null; atsScore: number | null; currentStreak: number };
  recentInterviews: Array<{ id: string; role: string; company: string; score: number | null; completedAt: string }>;
  progress: Array<{ label: string; score: number | null }>;
}
