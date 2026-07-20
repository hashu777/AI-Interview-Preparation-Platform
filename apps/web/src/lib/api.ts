import type { CodingLanguage, CodingProblemResponse, CodingSubmissionResponse, DashboardResponse, InterviewDifficulty, InterviewDomain, InterviewSessionResponse } from '@placement/contracts';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';
export async function getDashboard(): Promise<DashboardResponse> {
  const response = await fetch(`${apiUrl}/dashboard`, { cache: 'no-store', credentials: 'include' });
  if (!response.ok) throw new Error('We could not load your dashboard.');
  return response.json() as Promise<DashboardResponse>;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, { credentials: 'include', ...options, headers: { 'Content-Type': 'application/json', ...options?.headers } });
  const payload = await response.json().catch(() => null) as { message?: string | string[] } | T | null;
  if (!response.ok) {
    const message = typeof payload === 'object' && payload && 'message' in payload ? payload.message : undefined;
    throw new Error(Array.isArray(message) ? message[0] : message ?? 'Request failed.');
  }
  return payload as T;
}

export function createInterview(input: { domain: InterviewDomain; difficulty: InterviewDifficulty; durationMinutes: number; isVoice?: boolean }) {
  return request<InterviewSessionResponse>('/interviews', { method: 'POST', body: JSON.stringify(input) });
}
export function getInterview(sessionId: string) { return request<InterviewSessionResponse>(`/interviews/${sessionId}`); }
export function saveInterviewAnswer(sessionId: string, questionId: string, content: string) { return request<InterviewSessionResponse>(`/interviews/${sessionId}/questions/${questionId}/answer`, { method: 'PATCH', body: JSON.stringify({ content }) }); }
export function advanceInterview(sessionId: string) { return request<InterviewSessionResponse>(`/interviews/${sessionId}/advance`, { method: 'POST' }); }
export function completeInterview(sessionId: string) { return request<InterviewSessionResponse>(`/interviews/${sessionId}/complete`, { method: 'POST' }); }
export function getCodingProblems() { return request<CodingProblemResponse[]>('/coding/problems'); }
export function getCodingProblem(problemId: string) { return request<CodingProblemResponse>(`/coding/problems/${problemId}`); }
export function executeCode(problemId: string, language: CodingLanguage, sourceCode: string, submit: boolean) { return request<CodingSubmissionResponse>(`/coding/problems/${problemId}/${submit ? 'submit' : 'run'}`, { method: 'POST', body: JSON.stringify({ language, sourceCode }) }); }
