'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';

type ResumeAnalysis = { score: number; strengths: string[]; improvements: string[]; matchedKeywords: string[]; missingKeywords: string[] };
type ResumeVersion = { id: string; originalName: string; status: string; createdAt: string; analysis?: ResumeAnalysis | null };
type Resume = { id: string; title: string; versions: ResumeVersion[] };
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

async function errorMessage(response: Response, fallback: string) {
  const payload = await response.json().catch(() => null) as { message?: string | string[] } | null;
  const message = Array.isArray(payload?.message) ? payload.message[0] : payload?.message;
  return response.status === 401 ? 'Your session has expired. Please sign in again.' : (message ?? fallback);
}

export function ResumeWorkspace() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await fetch(`${apiUrl}/resumes`, { credentials: 'include' });
    if (!response.ok) throw new Error(await errorMessage(response, 'Unable to load resumes.'));
    setResumes(await response.json() as Resume[]);
  }

  useEffect(() => { load().catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Unable to load resumes.')); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const title = String(form.get('title') ?? '').trim();
    const file = form.get('file');
    if (!(file instanceof File) || file.size === 0) return setMessage('Choose a PDF file first.');

    setBusy(true); setMessage('');
    try {
      const created = await fetch(`${apiUrl}/resumes`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }) });
      if (!created.ok) throw new Error(await errorMessage(created, 'Could not create the resume.'));
      const resume = await created.json() as Resume;
      const upload = new FormData(); upload.append('file', file);
      const saved = await fetch(`${apiUrl}/resumes/${resume.id}/versions`, { method: 'POST', credentials: 'include', body: upload });
      if (!saved.ok) throw new Error(await errorMessage(saved, 'Upload failed. Use a PDF smaller than 5 MB.'));
      const version = await saved.json() as ResumeVersion;
      formElement.reset(); setMessage(version.status === 'EXTRACTED' ? 'Resume uploaded and text extracted successfully.' : 'Resume uploaded, but text extraction failed.'); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Upload failed.'); } finally { setBusy(false); }
  }

  const displayMessage = message === 'Your session has expired. Please sign in again.' ? <>Your session has expired. Please <Link href="/login?next=/resumes">sign in</Link> again.</> : message;
  return <main className="resume-page"><p className="eyebrow">RESUME WORKSPACE</p><h1>Upload a resume</h1><p className="muted">PDF files only, up to 5 MB. Your files are private to your account.</p><form className="upload-form" onSubmit={submit}><label>Resume title<input name="title" required maxLength={120} placeholder="Software engineer resume" /></label><label>PDF file<input name="file" type="file" accept="application/pdf" required /></label><button disabled={busy}>{busy ? 'Uploading and analyzing...' : 'Upload resume'}</button></form>{message && <p className="form-message" role="status">{displayMessage}</p>}<section><h2>Your resumes</h2>{resumes.length === 0 ? <p className="empty">No resumes uploaded yet.</p> : <ul className="resume-list">{resumes.map((resume) => { const version = resume.versions[0]; const analysis = version?.analysis; return <li key={resume.id}><strong>{resume.title}</strong><span>{version ? `${version.originalName} · ${version.status}` : 'No file uploaded'}</span>{analysis && <div className="ats-result"><strong>ATS score: {analysis.score}/100</strong><p><b>Strengths:</b> {analysis.strengths.join(' ') || 'Continue building clear, relevant content.'}</p><p><b>Improve:</b> {analysis.improvements.join(' ') || 'No major baseline issues were detected.'}</p><p><b>Matched skills:</b> {analysis.matchedKeywords.join(', ') || 'No baseline skills found.'}</p></div>}</li>; })}</ul>}</section></main>;
}
