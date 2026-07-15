import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <p className="eyebrow">AI PLACEMENT MENTOR</p>
      <h1>Build interview confidence with evidence-based practice.</h1>
      <p className="lead">Your professional career-preparation workspace is being built on a secure, scalable foundation.</p>
      <div className="home-actions">
        <Link href="/login" className="primary-button">Sign in</Link>
        <Link href="/register" className="secondary-button">Create account</Link>
      </div>
    </main>
  );
}
