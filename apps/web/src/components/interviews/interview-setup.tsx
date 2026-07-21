'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { InterviewCompany, InterviewDifficulty, InterviewDomain } from '@placement/contracts';
import { createInterview } from '../../lib/api';

const companies: Array<{ value: InterviewCompany; label: string }> = [
  { value: 'GOOGLE', label: 'Google' }, { value: 'AMAZON', label: 'Amazon' }, { value: 'MICROSOFT', label: 'Microsoft' },
  { value: 'INFOSYS', label: 'Infosys' }, { value: 'TCS', label: 'TCS' }, { value: 'ACCENTURE', label: 'Accenture' },
];

export function InterviewSetup({ companyMode = false }: { companyMode?: boolean }) {
  const router = useRouter();
  const [domain, setDomain] = useState<InterviewDomain>('TECHNICAL');
  const [difficulty, setDifficulty] = useState<InterviewDifficulty>('MEDIUM');
  const [company, setCompany] = useState<InterviewCompany>('GOOGLE');
  const [isVoice, setIsVoice] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true); setError('');
    try {
      const session = await createInterview({ domain, difficulty, durationMinutes, isVoice, company: companyMode ? company : undefined });
      router.push(`/interviews/${session.id}`);
    } catch (reason) {
      if (reason instanceof Error && reason.message === 'Authentication is required.') { router.push(`/login?next=${companyMode ? '/interviews/company' : '/interviews/setup'}`); return; }
      setError(reason instanceof Error ? reason.message : 'Could not start your interview.');
    } finally { setBusy(false); }
  }

  return <main className="interview-page"><p className="eyebrow">{companyMode ? 'COMPANY INTERVIEW MODE' : 'PRACTICE INTERVIEW'}</p><h1>{companyMode ? 'Prepare for a company interview' : 'Set up your session'}</h1><p className="muted">{companyMode ? 'Choose a company for targeted questions, then practise in the same timed interview room.' : 'Questions are tailored to the practice format you select. Your answers are saved automatically once the interview begins.'}</p><section className="setup-card">{companyMode && <fieldset><legend>Target company</legend><div className="company-choice-grid">{companies.map(({ value, label }) => <button className={company === value ? 'choice active-choice' : 'choice'} type="button" onClick={() => setCompany(value)} key={value}>{label}</button>)}</div></fieldset>}<fieldset><legend>Interview domain</legend><div className="choice-row">{([['TECHNICAL', 'Technical'], ['HR', 'HR and behavioural']] as const).map(([value, label]) => <button className={domain === value ? 'choice active-choice' : 'choice'} type="button" onClick={() => setDomain(value)} key={value}>{label}</button>)}</div></fieldset><fieldset><legend>Difficulty</legend><div className="choice-row">{([['EASY', 'Easy'], ['MEDIUM', 'Medium'], ['HARD', 'Hard']] as const).map(([value, label]) => <button className={difficulty === value ? 'choice active-choice' : 'choice'} type="button" onClick={() => setDifficulty(value)} key={value}>{label}</button>)}</div></fieldset><fieldset><legend>Interview mode</legend><div className="choice-row">{([[false, 'Standard (Written)'], [true, 'Voice & Speech']] as const).map(([value, label]) => <button className={isVoice === value ? 'choice active-choice' : 'choice'} type="button" onClick={() => setIsVoice(value)} key={String(value)}>{label}</button>)}</div></fieldset><label>Interview duration<select value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))}><option value={10}>10 minutes</option><option value={15}>15 minutes</option><option value={30}>30 minutes</option><option value={45}>45 minutes</option><option value={60}>60 minutes</option></select></label><button className="primary-button" onClick={start} disabled={busy}>{busy ? 'Preparing questions...' : 'Start interview'}</button>{error && <p className="form-message">{error}</p>}</section></main>;
}
