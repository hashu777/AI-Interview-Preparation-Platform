import { Suspense } from 'react';
import { AuthCard } from '../../components/auth/auth-card';
export default function VerifyEmailPage() { return <Suspense fallback={null}><AuthCard mode="verify-email" /></Suspense>; }
