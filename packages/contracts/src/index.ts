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

export interface AnalyticsResponse {
  interviewScoreTrend: Array<{ label: string; score: number | null }>;
  atsImprovement: Array<{ label: string; score: number }>;
  skillBreakdown: Array<{ skill: string; score: number | null }>;
  weeklyProgress: Array<{ label: string; completedInterviews: number; averageScore: number | null }>;
  monthlyProgress: Array<{ label: string; completedInterviews: number; averageScore: number | null }>;
}

export type InterviewDomain = 'TECHNICAL' | 'HR';
export type InterviewDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type InterviewStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
export type InterviewCompany = 'GOOGLE' | 'AMAZON' | 'MICROSOFT' | 'INFOSYS' | 'TCS' | 'ACCENTURE';
export interface InterviewSessionResponse {
  id: string;
  isVoice: boolean;
  domain: InterviewDomain;
  company: InterviewCompany | null;
  difficulty: InterviewDifficulty;
  durationMinutes: number;
  status: InterviewStatus;
  currentQuestionIndex: number;
  finalScore: number | null;
  startedAt: string;
  completedAt: string | null;
  evaluation: InterviewEvaluationResponse | null;
  questions: Array<{ id: string; position: number; prompt: string; answer: { content: string } | null }>;
}

export interface CompanyPerformanceResponse {
  company: InterviewCompany;
  completedInterviews: number;
  averageScore: number | null;
}

export interface InterviewEvaluationResponse {
  technicalAccuracy: number;
  communication: number;
  completeness: number;
  confidence: number;
  problemSolving: number;
  overallScore: number;
  detailedFeedback: string;
  idealAnswer: string;
  suggestions: string[];
}

export type CodingLanguage = 'JAVASCRIPT' | 'PYTHON' | 'JAVA';
export interface CodingProblemResponse { id: string; slug: string; title: string; description: string; difficulty: string; testCases: Array<{ input: string; output: string }>; starterCode?: Record<CodingLanguage, string>; }
export interface CodingSubmissionResponse { id: string; status: string; passedTestCases: number; totalTestCases: number; stdout: string | null; stderr: string | null; executionTimeMs: number | null; memoryKb: number | null; timeComplexity: string | null; complexityFeedback: string | null; }
