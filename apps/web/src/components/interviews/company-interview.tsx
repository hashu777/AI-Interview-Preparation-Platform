'use client';

import { useEffect, useState } from 'react';
import type { CompanyPerformanceResponse } from '@placement/contracts';
import { getCompanyPerformance } from '../../lib/api';
import { InterviewSetup } from './interview-setup';

function label(company: string) { return company === 'TCS' ? company : company.charAt(0) + company.slice(1).toLowerCase(); }

export function CompanyInterview() {
  const [performance, setPerformance] = useState<CompanyPerformanceResponse[]>();
  const [error, setError] = useState('');

  useEffect(() => { getCompanyPerformance().then(setPerformance).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Could not load company performance.')); }, []);

  return <><section className="company-performance"><div><p className="eyebrow">YOUR COMPANY PROGRESS</p><h2>Performance by company</h2></div>{error ? <p className="form-message">{error}</p> : !performance ? <div className="company-performance-grid skeleton-company" /> : <div className="company-performance-grid">{performance.map((item) => <article key={item.company}><strong>{label(item.company)}</strong><span>{item.completedInterviews} completed</span><b>{item.averageScore === null ? '—' : `${item.averageScore}%`}</b></article>)}</div>}</section><InterviewSetup companyMode/></>;
}
