import { Suspense } from 'react';
import { AuthCard } from '../../components/auth/auth-card';
export default function ResetPasswordPage() { return <Suspense fallback={null}><AuthCard mode="reset-password" /></Suspense>; }
