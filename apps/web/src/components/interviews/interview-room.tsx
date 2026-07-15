'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { InterviewSessionResponse } from '@placement/contracts';
import { advanceInterview, completeInterview, getInterview, saveInterviewAnswer } from '../../lib/api';

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onresult: ((event: { resultIndex: number; results: { isFinal: boolean; 0: { transcript: string } }[] }) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface WindowWithSpeech extends Window {
  SpeechRecognition?: new () => SpeechRecognitionInstance;
  webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
}

function formatTime(seconds: number) {
  return `${String(Math.floor(Math.max(seconds, 0) / 60)).padStart(2, '0')}:${String(Math.max(seconds, 0) % 60).padStart(2, '0')}`;
}

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

  // Voice State variables
  const [isSupported, setIsSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micError, setMicError] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [showTextEditor, setShowTextEditor] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const voiceEnabledRef = useRef(true); // Track if user wants active mic

  // Fetch session details
  useEffect(() => {
    getInterview(params.sessionId)
      .then((data) => {
        setSession(data);
        if (data.isVoice) {
          voiceEnabledRef.current = true;
        }
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.message === 'Authentication is required.') {
          router.push(`/login?next=/interviews/${params.sessionId}`);
        } else {
          setMessage(error instanceof Error ? error.message : 'Could not load interview.');
        }
      });
  }, [params.sessionId, router]);

  // Handle absolute timer logic, support pausing
  useEffect(() => {
    if (!session || session.status === 'COMPLETED') return;
    const initialSeconds = Math.max(0, Math.ceil((new Date(session.startedAt).getTime() + session.durationMinutes * 60000 - Date.now()) / 1000));
    setSecondsLeft(initialSeconds);
  }, [session]);

  useEffect(() => {
    if (!session || session.status === 'COMPLETED' || isPaused) return;
    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [session, isPaused]);

  // Load question answer
  useEffect(() => {
    if (!current || loadedQuestionId.current === current.id) return;
    loadedQuestionId.current = current.id;
    setAnswer(current.answer?.content ?? '');
    setInterimText('');

    if (session?.isVoice && !isPaused) {
      speakPrompt(current.prompt);
    }
  }, [current, session]);

  // Auto-save logic
  useEffect(() => {
    if (!current || !session || answer === current.answer?.content || isPaused) return;
    const timer = window.setTimeout(() => {
      saveInterviewAnswer(session.id, current.id, answer)
        .then(setSession)
        .then(() => setMessage('Saved'))
        .catch(() => setMessage('Could not save. Your answer remains on this page.'));
    }, 800);
    return () => window.clearTimeout(timer);
  }, [answer, current, session, isPaused]);

  // Speak AI question aloud
  const speakPrompt = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    const cleanText = text.replace(/Give a clear example\. |Discuss your reasoning, alternatives, and trade-offs\. |Use a structured example and explain your reasoning\. /i, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    utterance.onstart = () => {
      setIsSpeaking(true);
      // Mute microphone while AI is speaking
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        // eslint-disable-next-line no-empty
        } catch {}
      }
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      // Auto-resume microphone if enabled and not paused
      if (voiceEnabledRef.current && !isPaused && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        // eslint-disable-next-line no-empty
        } catch {}
      }
    };
    
    utterance.onerror = () => {
      setIsSpeaking(false);
      if (voiceEnabledRef.current && !isPaused && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        // eslint-disable-next-line no-empty
        } catch {}
      }
    };
    
    window.speechSynthesis.speak(utterance);
  };

  // Setup Web Speech API for Speech-to-Text
  useEffect(() => {
    if (typeof window === 'undefined' || !session?.isVoice) return;
    
    const win = window as unknown as WindowWithSpeech;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }
    
    setIsSupported(true);
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setMicError('');
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
      // Keep mic running if enabled, not paused, and not speaking
      if (voiceEnabledRef.current && !isPaused && !window.speechSynthesis.speaking) {
        try {
          recognition.start();
        // eslint-disable-next-line no-empty
        } catch {}
      }
    };

    recognition.onerror = (event: { error: string }) => {
      if (event.error === 'not-allowed') {
        setMicError('Microphone permission blocked. Please allow mic access in browser settings.');
        voiceEnabledRef.current = false;
        setIsListening(false);
      } else if (event.error === 'no-speech') {
        // ignore no speech timeouts
      } else {
        setMicError(`Microphone error: ${event.error}`);
      }
    };

    recognition.onresult = (event: { resultIndex: number; results: { isFinal: boolean; 0: { transcript: string } }[] }) => {
      let interimTranscript = '';
      let newFinalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          newFinalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setInterimText(interimTranscript);
      if (newFinalTranscript) {
        setAnswer((prev) => {
          const trimmed = prev.trim();
          const suffix = newFinalTranscript.trim();
          return trimmed ? `${trimmed} ${suffix}` : suffix;
        });
      }
    };

    recognitionRef.current = recognition;

    if (voiceEnabledRef.current && !isPaused) {
      try {
        recognition.start();
      // eslint-disable-next-line no-empty
      } catch {}
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        // eslint-disable-next-line no-empty
        } catch {}
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [session?.isVoice, isPaused]);

  // Persist current answer
  async function persist() {
    if (!session || !current) return;
    const updated = await saveInterviewAnswer(session.id, current.id, answer);
    setSession(updated);
  }

  // Advance question or finish
  async function next() {
    if (!session || !current) return;
    setBusy(true);
    
    // Stop any synthesis immediately
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    
    try {
      await persist();
      if (session.currentQuestionIndex === session.questions.length - 1) {
        const done = await completeInterview(session.id);
        setSession(done);
      } else {
        setSession(await advanceInterview(session.id));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not continue interview.');
    } finally {
      setBusy(false);
    }
  }

  // Finish session early
  async function finish() {
    if (!session) return;
    setBusy(true);
    
    // Stop synthesis
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    
    try {
      if (current) await persist();
      const done = await completeInterview(session.id);
      setSession(done);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not complete interview.');
    } finally {
      setBusy(false);
    }
  }

  // Toggle mic listen state
  const handleToggleMic = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      voiceEnabledRef.current = false;
      try {
        recognitionRef.current.stop();
      // eslint-disable-next-line no-empty
      } catch {}
    } else {
      voiceEnabledRef.current = true;
      try {
        recognitionRef.current.start();
      // eslint-disable-next-line no-empty
      } catch {}
    }
  };

  // Toggle general session pause
  const handleTogglePause = () => {
    setIsPaused((prev) => {
      const nextVal = !prev;
      if (nextVal) {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
        try {
          recognitionRef.current?.stop();
        // eslint-disable-next-line no-empty
        } catch {}
      } else {
        if (session?.isVoice && current) {
          speakPrompt(current.prompt);
        }
      }
      return nextVal;
    });
  };

  if (!session) {
    return <main className="interview-page"><p className="form-message">{message || 'Loading interview...'}</p></main>;
  }

  if (session.status === 'COMPLETED') {
    return (
      <main className="interview-page">
        <p className="eyebrow">SESSION COMPLETE</p>
        <h1>Your interview score: {session.finalScore ?? 0}%</h1>
        <p className="muted">Your completed session is now included in your dashboard history and progress.</p>
        <button className="primary-button" onClick={() => router.push('/dashboard')}>View dashboard</button>
      </main>
    );
  }

  if (!current) return null;

  // Render Voice Interview UI
  if (session.isVoice && isSupported) {
    return (
      <main className="interview-page">
        <header className="interview-header">
          <div>
            <p className="eyebrow">VOICE INTERVIEW · {session.domain} · {session.difficulty}</p>
            <h1>Voice Prep Room</h1>
          </div>
          <div className={`timer ${secondsLeft <= 60 ? 'urgent' : ''}`}>{formatTime(secondsLeft)}</div>
        </header>

        <p className="question-count">Question {session.currentQuestionIndex + 1} of {session.questions.length} · saves automatically</p>

        <div className="voice-room">
          {/* Main prompt */}
          <div className="voice-prompt-card">
            <h2>{current.prompt}</h2>
            <button className="listen-again-button" onClick={() => speakPrompt(current.prompt)} disabled={isSpeaking || isPaused}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
              <span>{isSpeaking ? 'AI is speaking...' : 'Listen Question'}</span>
            </button>
          </div>

          {/* Interactive visualizer & state banner */}
          <div className="visualizer-container">
            <div className={`visualizer ${isListening ? 'listening-pulse' : ''} ${isSpeaking ? 'speaking-wave' : ''} ${isPaused ? 'paused-state' : ''}`}>
              {isPaused ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#64708a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
              ) : isSpeaking ? (
                <div className="sound-wave">
                  <span className="wave-bar bar-1"></span>
                  <span className="wave-bar bar-2"></span>
                  <span className="wave-bar bar-3"></span>
                  <span className="wave-bar bar-4"></span>
                </div>
              ) : isListening ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ff8f8f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="2" x2="22" y1="2" y2="22"/><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/><path d="M5 10v1.5a7 7 0 0 0 12 5"/><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
              )}
            </div>

            <div className="voice-status-bar">
              {isPaused ? (
                <span className="status-label paused">Interview Paused</span>
              ) : isSpeaking ? (
                <span className="status-label speaking">AI Speaking Question</span>
              ) : isListening ? (
                <span className="status-label listening">Microphone Active · Speak your answer</span>
              ) : (
                <span className="status-label muted">Microphone Muted / Paused</span>
              )}
            </div>
          </div>

          {micError && <p className="mic-error">{micError}</p>}

          {/* Live transcript text */}
          <div className="transcript-preview">
            <p className="eyebrow">LIVE TRANSCRIPT</p>
            <div className="transcript-box">
              {answer ? (
                <p className="final-transcript-text">{answer}</p>
              ) : null}
              {interimText ? (
                <p className="interim-transcript-text">{interimText}</p>
              ) : null}
              {!answer && !interimText && (
                <p className="transcript-placeholder">Your transcript will appear here as you speak...</p>
              )}
            </div>
          </div>

          {/* Edit answers toggle */}
          <div className="editor-accordion">
            <button className="accordion-toggle" onClick={() => setShowTextEditor(!showTextEditor)}>
              {showTextEditor ? 'Hide Complete Answer Box' : 'View / Edit Full Answer Text'}
            </button>
            {showTextEditor && (
              <textarea
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                placeholder="You can edit or type your answer directly here..."
                maxLength={10000}
                disabled={busy || isPaused}
                className="voice-textarea"
              />
            )}
          </div>

          {/* Core controls */}
          <div className="voice-controls">
            <button className={`secondary-button mic-toggle-btn ${isListening ? 'active-listening' : ''}`} onClick={handleToggleMic} disabled={isSpeaking || isPaused}>
              {isListening ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="2" x2="22" y1="2" y2="22"/><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/><path d="M5 10v1.5a7 7 0 0 0 12 5"/><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                  <span>Mute Mic</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                  <span>Unmute Mic</span>
                </>
              )}
            </button>

            <button className="secondary-button pause-btn" onClick={handleTogglePause}>
              {isPaused ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  <span>Resume Prep</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/></svg>
                  <span>Pause Prep</span>
                </>
              )}
            </button>
          </div>

          {/* Action Row */}
          <div className="room-actions">
            <span className="muted">{message}</span>
            <div>
              <button className="secondary-button" onClick={finish} disabled={busy}>Finish now</button>
              <button className="primary-button" onClick={next} disabled={busy || secondsLeft <= 0 || isPaused}>
                {session.currentQuestionIndex === session.questions.length - 1 ? 'Finish interview' : 'Save and continue'}
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Fallback Standard Text Interface (renders when isVoice is false, or Speech API is unsupported)
  return (
    <main className="interview-page">
      <header className="interview-header">
        <div>
          <p className="eyebrow">{session.domain === 'TECHNICAL' ? 'TECHNICAL' : 'HR'} · {session.difficulty}</p>
          <h1>Interview in progress</h1>
        </div>
        <div className={secondsLeft <= 60 ? 'timer urgent' : 'timer'}>{formatTime(secondsLeft)}</div>
      </header>

      {!isSupported && session.isVoice && (
        <div className="unsupported-banner">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff8f8f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12" y1="17" y2="17.01"/></svg>
          <span>Voice interview mode is not supported by your browser. Reverting to text mode.</span>
        </div>
      )}

      <p className="question-count">Question {session.currentQuestionIndex + 1} of {session.questions.length} · answers save automatically</p>

      <section className="question-card">
        <h2>{current.prompt}</h2>
        <textarea
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          placeholder="Type your answer here..."
          maxLength={10000}
          disabled={busy}
        />
        <div className="room-actions">
          <span className="muted">{message}</span>
          <div>
            <button className="secondary-button" onClick={finish} disabled={busy}>Finish now</button>
            <button className="primary-button" onClick={next} disabled={busy || secondsLeft <= 0}>
              {session.currentQuestionIndex === session.questions.length - 1 ? 'Finish interview' : 'Save and continue'}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
