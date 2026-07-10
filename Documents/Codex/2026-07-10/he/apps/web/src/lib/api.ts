import type { DashboardResponse } from '@placement/contracts';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';
export async function getDashboard(): Promise<DashboardResponse> {
  const response = await fetch(`${apiUrl}/dashboard`, { cache: 'no-store' });
  if (!response.ok) throw new Error('We could not load your dashboard.');
  return response.json() as Promise<DashboardResponse>;
}
