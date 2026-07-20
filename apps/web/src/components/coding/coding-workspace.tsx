'use client';

import { useEffect, useState } from 'react';
import type { CodingLanguage, CodingProblemResponse, CodingSubmissionResponse } from '@placement/contracts';
import { executeCode, getCodingProblem, getCodingProblems } from '../../lib/api';

const labels: Record<CodingLanguage, string> = { JAVASCRIPT: 'JavaScript', PYTHON: 'Python', JAVA: 'Java' };

export function CodingWorkspace() {
  const [problems, setProblems] = useState<CodingProblemResponse[]>([]);
  const [problem, setProblem] = useState<CodingProblemResponse>();
  const [language, setLanguage] = useState<CodingLanguage>('JAVASCRIPT');
  const [sourceCode, setSourceCode] = useState('');
  const [result, setResult] = useState<CodingSubmissionResponse>();
  const [message, setMessage] = useState('Loading coding problems...');
  const [busy, setBusy] = useState(false);

  useEffect(() => { getCodingProblems().then(setProblems).catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Could not load coding problems.')); }, []);
  useEffect(() => { if (!problems[0]) return; getCodingProblem(problems[0].id).then((loaded) => { setProblem(loaded); setSourceCode(loaded.starterCode?.[language] ?? ''); setMessage(''); }).catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Could not load problem.')); }, [problems]);
  function changeLanguage(next: CodingLanguage) { setLanguage(next); setSourceCode(problem?.starterCode?.[next] ?? ''); setResult(undefined); }
  async function execute(submit: boolean) { if (!problem) return; setBusy(true); setMessage(submit ? 'Running public and hidden tests...' : 'Running public test cases...'); try { const output = await executeCode(problem.id, language, sourceCode, submit); setResult(output); setMessage(''); } catch (error) { setMessage(error instanceof Error ? error.message : 'Execution failed.'); } finally { setBusy(false); } }

  if (!problem) return <main className="coding-page"><p className="form-message">{message}</p></main>;
  return <main className="coding-page"><header><p className="eyebrow">CODING INTERVIEW</p><h1>{problem.title}</h1><p className="muted">{problem.description}</p><span className="difficulty-badge">{problem.difficulty}</span></header><section className="coding-layout"><article className="test-panel"><h2>Public examples</h2>{problem.testCases.map((test, index) => <div className="test-case" key={test.input}><strong>Example {index + 1}</strong><code>Input: {test.input}</code><code>Output: {test.output}</code></div>)}<p className="muted">Submit runs additional hidden tests. Hidden inputs and expected outputs are never sent to the browser.</p></article><article className="editor-panel"><div className="editor-toolbar"><label>Language<select value={language} onChange={(event) => changeLanguage(event.target.value as CodingLanguage)}>{(Object.keys(labels) as CodingLanguage[]).map((item) => <option value={item} key={item}>{labels[item]}</option>)}</select></label><span className="muted">Saved on every Run or Submit</span></div><textarea className="code-editor" spellCheck={false} value={sourceCode} onChange={(event) => setSourceCode(event.target.value)} disabled={busy} aria-label="Code editor"/><div className="editor-actions"><span className="muted">{message}</span><div><button className="secondary-button" onClick={() => execute(false)} disabled={busy}>Run code</button><button className="primary-button" onClick={() => execute(true)} disabled={busy}>Submit code</button></div></div></article></section>{result && <section className={`submission-result ${result.status === 'ACCEPTED' ? 'accepted' : 'rejected'}`}><h2>{result.status.replaceAll('_', ' ')}</h2><p>{result.passedTestCases}/{result.totalTestCases} test cases passed</p>{result.stdout && <pre>Output: {result.stdout}</pre>}{result.stderr && <pre>Error: {result.stderr}</pre>}<div className="complexity"><strong>Time complexity: {result.timeComplexity}</strong><p>{result.complexityFeedback}</p></div></section>}</main>;
}
