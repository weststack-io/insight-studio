'use client';

import { useEffect } from 'react';
import { getTracker } from '@/lib/analytics/tracker';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const tracker = getTracker();
    tracker.start();
    return () => tracker.stop();
  }, []);

  return <>{children}</>;
}
