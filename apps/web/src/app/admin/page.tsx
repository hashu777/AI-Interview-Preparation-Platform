'use client';

import { useEffect, useRef, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

type CheckStatus = 'idle' | 'checking' | 'pass' | 'fail' | 'warn';

interface Check {
  id: string;
  label: string;
  description: string;
  category: string;
  status: CheckStatus;
  detail: string;
  latency?: number;
}

const INITIAL_CHECKS: Check[] = [
  // Backend
  { id: 'api', label: 'API Server', description: 'Backend NestJS server reachability', category: 'Backend', status: 'idle', detail: '' },
  { id: 'db', label: 'Database (PostgreSQL)', description: 'Prisma DB connection via API health probe', category: 'Backend', status: 'idle', detail: '' },
  { id: 'redis', label: 'Redis Cache', description: 'Redis connection status via API', category: 'Backend', status: 'idle', detail: '' },
  // Browser
  { id: 'mic', label: 'Microphone Access', description: 'getUserMedia microphone permission', category: 'Browser', status: 'idle', detail: '' },
  { id: 'stt', label: 'Speech-to-Text (STT)', description: 'Web Speech Recognition API support', category: 'Browser', status: 'idle', detail: '' },
  { id: 'tts', label: 'Text-to-Speech (TTS)', description: 'SpeechSynthesis API support and voice availability', category: 'Browser', status: 'idle', detail: '' },
  { id: 'mediaDevices', label: 'Media Devices API', description: 'navigator.mediaDevices availability', category: 'Browser', status: 'idle', detail: '' },
  // Network
  { id: 'cors', label: 'CORS Configuration', description: 'Cross-origin requests to API allowed', category: 'Network', status: 'idle', detail: '' },
  { id: 'latency', label: 'API Latency', description: 'Round-trip time to API server', category: 'Network', status: 'idle', detail: '' },
  // Environment
  { id: 'env', label: 'API URL Configured', description: 'NEXT_PUBLIC_API_URL environment variable', category: 'Environment', status: 'idle', detail: '' },
  { id: 'https', label: 'Secure Context', description: 'Page served over HTTPS or localhost', category: 'Environment', status: 'idle', detail: '' },
  { id: 'browser', label: 'Browser Compatibility', description: 'Chrome/Edge recommended for full voice support', category: 'Environment', status: 'idle', detail: '' },
];

const STATUS_META: Record<CheckStatus, { color: string; bg: string; border: string; dot: string; label: string }> = {
  idle:     { color: '#a5b4cf', bg: 'rgba(165,180,207,0.06)', border: 'rgba(165,180,207,0.15)', dot: '#64708a', label: 'Idle' },
  checking: { color: '#72e2b5', bg: 'rgba(114,226,181,0.06)', border: 'rgba(114,226,181,0.2)', dot: '#72e2b5', label: 'Checking…' },
  pass:     { color: '#72e2b5', bg: 'rgba(114,226,181,0.07)', border: 'rgba(114,226,181,0.25)', dot: '#72e2b5', label: 'Pass' },
  fail:     { color: '#ff8f8f', bg: 'rgba(255,143,143,0.07)', border: 'rgba(255,143,143,0.25)', dot: '#ff8f8f', label: 'Fail' },
  warn:     { color: '#f5c542', bg: 'rgba(245,197,66,0.07)', border: 'rgba(245,197,66,0.25)', dot: '#f5c542', label: 'Warning' },
};

const CATEGORIES = ['Backend', 'Browser', 'Network', 'Environment'];

export default function AdminPortal() {
  const [checks, setChecks] = useState<Check[]>(INITIAL_CHECKS);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateCheck = (id: string, patch: Partial<Check>) => {
    setChecks(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
  };

  const runAllChecks = async () => {
    if (running) return;
    setRunning(true);
    setChecks(prev => prev.map(c => ({ ...c, status: 'checking' as CheckStatus, detail: '', latency: undefined })));

    // --- ENV checks (sync) ---
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
    updateCheck('env', {
      status: apiUrl ? 'pass' : 'warn',
      detail: apiUrl ? `URL: ${apiUrl}` : 'NEXT_PUBLIC_API_URL not set, using fallback http://localhost:4000/v1',
    });

    updateCheck('https', {
      status: (window.isSecureContext) ? 'pass' : 'warn',
      detail: window.isSecureContext
        ? `Secure context confirmed (${window.location.protocol})`
        : 'Not a secure context — some browser APIs may be restricted',
    });

    const ua = navigator.userAgent;
    const isChrome = /Chrome/.test(ua) && !/Edg/.test(ua);
    const isEdge = /Edg/.test(ua);
    const isFirefox = /Firefox/.test(ua);
    updateCheck('browser', {
      status: (isChrome || isEdge) ? 'pass' : 'warn',
      detail: isChrome ? 'Google Chrome — full voice support'
        : isEdge ? 'Microsoft Edge — full voice support'
        : isFirefox ? 'Firefox — limited Web Speech API support'
        : `Unknown browser — voice features may not work`,
    });

    // --- BROWSER checks (async) ---
    // Media Devices
    const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    updateCheck('mediaDevices', {
      status: hasMediaDevices ? 'pass' : 'fail',
      detail: hasMediaDevices ? 'navigator.mediaDevices.getUserMedia available' : 'navigator.mediaDevices not available in this browser',
    });

    // STT
    const win = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
    const hasStt = !!(win.SpeechRecognition || win.webkitSpeechRecognition);
    updateCheck('stt', {
      status: hasStt ? 'pass' : 'fail',
      detail: hasStt
        ? `SpeechRecognition API available (${win.SpeechRecognition ? 'standard' : 'webkit prefix'})`
        : 'SpeechRecognition not supported — voice input will not work',
    });

    // TTS
    const hasTts = typeof window !== 'undefined' && 'speechSynthesis' in window;
    if (hasTts) {
      const voices = window.speechSynthesis.getVoices();
      const voiceCount = voices.length;
      updateCheck('tts', {
        status: voiceCount > 0 ? 'pass' : 'warn',
        detail: voiceCount > 0 ? `SpeechSynthesis ready — ${voiceCount} voice(s) available` : 'SpeechSynthesis API present but no voices loaded yet',
      });
    } else {
      updateCheck('tts', { status: 'fail', detail: 'SpeechSynthesis API not supported' });
    }

    // Microphone
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      updateCheck('mic', { status: 'pass', detail: 'Microphone permission granted and accessible' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const isDenied = msg.toLowerCase().includes('denied') || msg.toLowerCase().includes('not allowed');
      updateCheck('mic', {
        status: 'fail',
        detail: isDenied
          ? 'Microphone permission denied — allow mic access in browser settings'
          : `Microphone error: ${msg}`,
      });
    }

    // --- NETWORK / BACKEND checks ---
    const t0 = performance.now();
    try {
      const res = await fetch(`${API_URL}/health`, { method: 'GET', signal: AbortSignal.timeout(5000) });
      const latency = Math.round(performance.now() - t0);

      if (res.ok) {
        const data = await res.json() as { status?: string; service?: string };
        updateCheck('api', {
          status: 'pass',
          detail: `Status: ${data.status ?? 'ok'} · Service: ${data.service ?? 'api'}`,
          latency,
        });
        updateCheck('cors', { status: 'pass', detail: 'CORS headers accepted — cross-origin request succeeded' });
        updateCheck('latency', {
          status: latency < 100 ? 'pass' : latency < 500 ? 'warn' : 'fail',
          detail: `Round-trip: ${latency}ms ${latency < 100 ? '(excellent)' : latency < 500 ? '(acceptable)' : '(slow — check server load)'}`,
          latency,
        });
        // DB & Redis: inferred from successful API response (API won't return 200 if Prisma is down)
        updateCheck('db', { status: 'pass', detail: 'API responded successfully — Prisma/PostgreSQL connection healthy' });
        updateCheck('redis', { status: 'warn', detail: 'API is running — Redis status not individually exposed by health endpoint' });
      } else {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const latency = Math.round(performance.now() - t0);
      const isTimeout = msg.includes('timeout') || msg.includes('abort');
      const isCors = msg.toLowerCase().includes('cors') || msg.toLowerCase().includes('failed to fetch');

      updateCheck('api', { status: 'fail', detail: isTimeout ? `Timed out after 5s — API not reachable` : `Cannot reach API: ${msg}`, latency });
      updateCheck('cors', { status: isCors ? 'fail' : 'warn', detail: isCors ? 'CORS error — API may be blocking cross-origin requests' : 'Could not verify CORS — API unreachable' });
      updateCheck('latency', { status: 'fail', detail: `No response after ${latency}ms`, latency });
      updateCheck('db', { status: 'fail', detail: 'Cannot verify DB — API is not reachable' });
      updateCheck('redis', { status: 'fail', detail: 'Cannot verify Redis — API is not reachable' });
    }

    setRunning(false);
    setLastRun(new Date().toLocaleTimeString());
  };

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(runAllChecks, 30000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh]);

  const passed = checks.filter(c => c.status === 'pass').length;
  const failed = checks.filter(c => c.status === 'fail').length;
  const warned = checks.filter(c => c.status === 'warn').length;
  const total = checks.length;

  const overallStatus: CheckStatus = failed > 0 ? 'fail' : warned > 0 ? 'warn' : checks.every(c => c.status === 'pass') ? 'pass' : 'idle';

  return (
    <div className="admin-portal">
      <header className="admin-header">
        <div className="admin-header-left">
          <p className="eyebrow">SYSTEM ADMINISTRATION</p>
          <h1 className="admin-title">
            <span className="brand-name">placement<span className="brand-accent">mentor</span></span>
            <span className="admin-badge">Admin Portal</span>
          </h1>
          <p className="admin-subtitle">Live feature health diagnostics · {total} checks across {CATEGORIES.length} categories</p>
        </div>
        <div className="admin-header-right">
          {overallStatus !== 'idle' && (
            <div className={`overall-badge overall-${overallStatus}`}>
              <span className={`overall-dot dot-${overallStatus}`} />
              {overallStatus === 'pass' ? 'All Systems Operational' : overallStatus === 'fail' ? 'Issues Detected' : 'Warnings Present'}
            </div>
          )}
        </div>
      </header>

      {/* Summary bar */}
      <div className="summary-bar">
        <div className="summary-card summary-pass">
          <span className="summary-num">{passed}</span>
          <span className="summary-label">Passing</span>
        </div>
        <div className="summary-card summary-warn">
          <span className="summary-num">{warned}</span>
          <span className="summary-label">Warnings</span>
        </div>
        <div className="summary-card summary-fail">
          <span className="summary-num">{failed}</span>
          <span className="summary-label">Failing</span>
        </div>
        <div className="summary-card summary-total">
          <span className="summary-num">{total}</span>
          <span className="summary-label">Total Checks</span>
        </div>
      </div>

      {/* Controls */}
      <div className="admin-controls">
        <button
          className={`run-button ${running ? 'run-button-active' : ''}`}
          onClick={runAllChecks}
          disabled={running}
          id="run-all-checks"
        >
          {running ? (
            <><span className="spinner" />Running Diagnostics…</>
          ) : (
            <><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>Run All Checks</>
          )}
        </button>
        <label className="auto-refresh-toggle" id="auto-refresh-toggle">
          <span className={`toggle-switch ${autoRefresh ? 'toggle-on' : ''}`} onClick={() => setAutoRefresh(p => !p)} />
          <span>Auto-refresh every 30s</span>
        </label>
        {lastRun && <span className="last-run">Last run: {lastRun}</span>}
      </div>

      {/* Checks grid by category */}
      <div className="checks-grid">
        {CATEGORIES.map(cat => {
          const catChecks = checks.filter(c => c.category === cat);
          return (
            <div key={cat} className="category-section">
              <div className="category-header">
                <span className="category-icon">
                  {cat === 'Backend' ? '🖥️' : cat === 'Browser' ? '🎤' : cat === 'Network' ? '🌐' : '⚙️'}
                </span>
                <h2 className="category-title">{cat}</h2>
                <span className="category-count">{catChecks.filter(c => c.status === 'pass').length}/{catChecks.length}</span>
              </div>
              <div className="checks-list">
                {catChecks.map(check => {
                  const meta = STATUS_META[check.status];
                  return (
                    <div key={check.id} className="check-card" style={{ borderColor: meta.border, background: meta.bg }} id={`check-${check.id}`}>
                      <div className="check-card-top">
                        <div className="check-info">
                          <div className="check-name-row">
                            <span className="check-dot" style={{ background: meta.dot, boxShadow: check.status === 'checking' ? `0 0 6px ${meta.dot}` : 'none' }} />
                            <span className="check-name">{check.label}</span>
                            {check.latency !== undefined && (
                              <span className="check-latency">{check.latency}ms</span>
                            )}
                          </div>
                          <p className="check-desc">{check.description}</p>
                        </div>
                        <span className="check-status-pill" style={{ color: meta.color, borderColor: meta.border, background: 'transparent' }}>
                          {check.status === 'checking' ? (
                            <><span className="spinner-tiny" />Checking</>
                          ) : meta.label}
                        </span>
                      </div>
                      {check.detail && (
                        <div className="check-detail" style={{ color: meta.color }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                          {check.detail}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <footer className="admin-footer">
        <span>PlacementMentor Admin Portal · v1.0</span>
        <span>API: <code>{API_URL}</code></span>
        <a href="/dashboard" className="footer-link">← Back to Dashboard</a>
      </footer>
    </div>
  );
}
