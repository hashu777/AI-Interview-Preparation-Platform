'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AnalyticsResponse } from '@placement/contracts';
import { getAnalytics } from '../../lib/api';

function BarChart<T extends { label: string }>({
  points,
  value = (item: any) => item.score,
  caption
}: {
  points: T[];
  value?: (item: T) => number | null | undefined;
  caption: string;
}) {
  const hasData = points.some((item) => value(item) !== null && value(item) !== undefined);
  return <div className="analytics-chart" aria-label={caption}>{hasData ? points.map((item) => { const amount = value(item) ?? 0; return <div className="analytics-bar-wrap" key={item.label}><span className="analytics-value">{amount}</span><div className="analytics-bar" style={{ height: `${Math.max(amount, 3)}%` }} /><small>{item.label}</small></div>; }) : <p className="empty">Complete interviews or analyze a resume to populate this chart.</p>}</div>;
}

function TrendChart({ points }: { points: AnalyticsResponse['interviewScoreTrend'] }) {
  const coordinates = useMemo(() => points.map((point, index) => `${points.length === 1 ? 50 : (index / (points.length - 1)) * 100},${100 - (point.score ?? 0)}`).join(' '), [points]);
  if (!points.length) return <p className="empty">Complete an interview to start your score trend.</p>;
  return <div className="trend-chart"><svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Interview score trend"><polyline points={coordinates} fill="none" vectorEffect="non-scaling-stroke" /></svg><div className="trend-labels">{points.map((point, index) => <span key={`${point.label}-${index}`}>{point.label}</span>)}</div></div>;
}

function downloadReport(data: AnalyticsResponse) {
  const rows = [['Section', 'Label', 'Score', 'Completed interviews'], ...data.interviewScoreTrend.map((item) => ['Interview score trend', item.label, item.score ?? '', '']), ...data.atsImprovement.map((item) => ['ATS improvement', item.label, item.score, '']), ...data.skillBreakdown.map((item) => ['Skill', item.skill, item.score ?? '', '']), ...data.weeklyProgress.map((item) => ['Weekly progress', item.label, item.averageScore ?? '', item.completedInterviews]), ...data.monthlyProgress.map((item) => ['Monthly progress', item.label, item.averageScore ?? '', item.completedInterviews])];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'placement-mentor-analytics.csv'; anchor.click(); URL.revokeObjectURL(url);
}

export function AnalyticsDashboard() {
  const router = useRouter(); const [data, setData] = useState<AnalyticsResponse>(); const [error, setError] = useState('');
  useEffect(() => { getAnalytics().then(setData).catch((reason: unknown) => { if (reason instanceof Error && reason.message === 'Authentication is required.') router.push('/login?next=/analytics'); else setError(reason instanceof Error ? reason.message : 'Analytics are unavailable.'); }); }, [router]);
  if (error) return <main className="analytics-page"><div className="error"><h1>Analytics unavailable</h1><p>{error}</p><button onClick={() => window.location.reload()}>Try again</button></div></main>;
  if (!data) return <main className="analytics-page"><div className="skeleton title" /><div className="analytics-grid"><div className="panel skeleton chart" /><div className="panel skeleton chart" /></div></main>;
  return <main className="analytics-page"><header className="analytics-header"><div><p className="eyebrow">ANALYTICS DASHBOARD</p><h1>Measure your interview readiness.</h1><p className="muted">Your scores and resume analysis history, in one place.</p></div><button className="secondary-button" onClick={() => downloadReport(data)}>Export report (CSV)</button></header><section className="analytics-grid"><article className="panel"><p className="eyebrow">INTERVIEW SCORE TREND</p><h2>Latest interview scores</h2><TrendChart points={data.interviewScoreTrend}/></article><article className="panel"><p className="eyebrow">ATS IMPROVEMENT</p><h2>Resume score history</h2><BarChart points={data.atsImprovement} caption="ATS improvement" /></article><article className="panel"><p className="eyebrow">SKILL-WISE GRAPH</p><h2>Evaluation strengths</h2><BarChart points={data.skillBreakdown.map((item) => ({ label: item.skill, score: item.score }))} caption="Skill-wise graph" /></article><article className="panel"><p className="eyebrow">WEEKLY PROGRESS</p><h2>Interviews completed</h2><BarChart points={data.weeklyProgress} value={(item) => item.completedInterviews} caption="Weekly interview count" /></article><article className="panel analytics-wide"><p className="eyebrow">MONTHLY PROGRESS</p><h2>Last six months</h2><BarChart points={data.monthlyProgress} value={(item) => item.averageScore} caption="Monthly average interview score" /></article></section></main>;
}
