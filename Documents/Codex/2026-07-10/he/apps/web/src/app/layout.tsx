import type { Metadata } from 'next';
import './styles.css';

export const metadata: Metadata = { title: 'AI Placement Mentor', description: 'Prepare with clarity. Interview with confidence.' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
