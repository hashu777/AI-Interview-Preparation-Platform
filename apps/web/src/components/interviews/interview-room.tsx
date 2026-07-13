'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { InterviewSessionResponse } from '@placement/contracts';
import { advanceInterview, completeInterview, getInterview, saveInterviewAnswer } from '../../lib/api';

function formatTime(seconds: number) { return `${String(Math.floor(Math.max(seconds, 0) / 60)).padStart(2, '0')}:${String(Math.max(seconds, 0) % 60).padStart(2, '0')}`; }

export function InterviewRoom() {
  const router = useRouter();
  const params = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<InterviewSessionResponse>();
  const [answer, setAnswer] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const loadedQuestionId = useRef<string | null>(null);
  const current = session?.questions[session.currentQuestionIndex];

  useEffect(() => { getInterview(params.sessionId).then(setSession).catch((error: unknown) => { if (error instanceof Error && error.message === 'Authentication is required.') router.push(`/login?next=/interviews/${params.sessionId}`); else setMessage(error instanceof Error ? error.message : 'Could not load interview.'); }); }, [params.sessionId, router]);
  useEffect(() => { if (!session) return; const end = new Date(session.startedAt).getTime() + session.durationMinutes * 60000; const tick = () => setSecondsLeft(Math.ceil((end - Date.now()) / 1000)); tick(); const interval = window.setInterval(tick, 1000); return () => window.clearInterval(interval); }, [session]);
  useEffect(() => { if (!current || loadedQuestionId.current === current.id) return; loadedQuestionId.current = current.id; setAnswer(current.answer?.content ?? ''); }, [current]);
  useEffect(() => { if (!current || !session || answer === current.answer?.content) return; const timer = window.setTimeout(() => { saveInterviewAnswer(session.id, current.id, answer).then(setSession).then(() => setMessage('Saved')).catch(() => setMessage('Could not save. Your answer remains on this page.')); }, 800); return () => window.clearTimeout(timer); }, [answer, current, session]);

  async function persist() { if (!session || !current) return; const updated = await saveInterviewAnswer(session.id, current.id, answer); setSession(updated); }
  async function next() { if (!session || !current) return; setBusy(true); try { await persist(); if (session.currentQuestionIndex === session.questions.length - 1) { const done = await completeInterview(session.id); setSession(done); } else setSession(await advanceInterview(session.id)); } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not continue interview.'); } finally { setBusy(false); } }
  async function finish() { if (!session) return; setBusy(true); try { if (current) await persist(); const done = await completeInterview(session.id); setSession(done); } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not complete interview.'); } finally { setBusy(false); } }

  if (!session) return <main className="interview-page"><p className="form-message">{message || 'Loading interview...'}</p></main>;
  if (session.status === 'COMPLETED') return <main className="interview-page"><p className="eyebrow">SESSION COMPLETE</p><h1>Your interview score: {session.finalScore ?? 0}%</h1><p className="muted">Your completed session is now included in your dashboard history and progress.</p><button className="primary-button" onClick={() => router.push('/dashboard')}>View dashboard</button></main>;
  if (!current) return null;
  return <main className="interview-page"><header className="interview-header"><div><p className="eyebrow">{session.domain === 'TECHNICAL' ? 'TECHNICAL' : 'HR'} · {session.difficulty}</p><h1>Interview in progress</h1></div><div className={secondsLeft <= 60 ? 'timer urgent' : 'timer'}>{formatTime(secondsLeft)}</div></header><p className="question-count">Question {session.currentQuestionIndex + 1} of {session.questions.length} · answers save automatically</p><section className="question-card"><h2>{current.prompt}</h2><textarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Type your answer here..." maxLength={10000} disabled={busy} /><div className="room-actions"><span className="muted">{message}</span><div><button className="secondary-button" onClick={finish} disabled={busy}>Finish now</button><button className="primary-button" onClick={next} disabled={busy || secondsLeft <= 0}>{session.currentQuestionIndex === session.questions.length - 1 ? 'Finish interview' : 'Save and continue'}</button></div></div></section></main>;
}
