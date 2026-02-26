import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { SessionProvider } from '@/components/SessionProvider';
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <SessionProvider session={session}>
      <AnalyticsProvider>{children}</AnalyticsProvider>
    </SessionProvider>
  );
}

