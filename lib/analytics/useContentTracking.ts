'use client';

import { useEffect, useRef, useCallback } from 'react';
import { getTracker } from './tracker';

interface UseContentTrackingOptions {
  contentId: string;
  contentType: 'briefing' | 'explainer' | 'lesson';
}

export function useContentTracking({
  contentId,
  contentType,
}: UseContentTrackingOptions) {
  const startTimeRef = useRef<number>(Date.now());
  const maxScrollRef = useRef<number>(0);
  const completedRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track open on mount
  useEffect(() => {
    const tracker = getTracker();
    startTimeRef.current = Date.now();
    maxScrollRef.current = 0;
    completedRef.current = false;

    tracker.track({ contentId, contentType, eventType: 'open' });

    // Scroll tracking
    const handleScroll = () => {
      if (!containerRef.current) return;

      const el = containerRef.current;
      const scrollTop = el.scrollTop || window.scrollY;
      const scrollHeight = el.scrollHeight || document.documentElement.scrollHeight;
      const clientHeight = el.clientHeight || window.innerHeight;

      const depth = scrollHeight <= clientHeight
        ? 100
        : Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);

      if (depth > maxScrollRef.current) {
        maxScrollRef.current = depth;
      }

      // Track completion at 90%
      if (depth >= 90 && !completedRef.current) {
        completedRef.current = true;
        tracker.track({ contentId, contentType, eventType: 'complete' });
      }
    };

    // Use passive listener for performance
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Track dwell time on unmount or visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const dwellSeconds = Math.round(
          (Date.now() - startTimeRef.current) / 1000
        );
        tracker.track({
          contentId,
          contentType,
          eventType: 'dwell',
          metadata: { seconds: dwellSeconds, scrollDepth: maxScrollRef.current },
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      // Record dwell on unmount
      const dwellSeconds = Math.round(
        (Date.now() - startTimeRef.current) / 1000
      );
      tracker.track({
        contentId,
        contentType,
        eventType: 'dwell',
        metadata: { seconds: dwellSeconds, scrollDepth: maxScrollRef.current },
      });

      // Record scroll depth
      tracker.track({
        contentId,
        contentType,
        eventType: 'scroll',
        metadata: { depth: maxScrollRef.current },
      });
    };
  }, [contentId, contentType]);

  const trackClick = useCallback(
    (label?: string) => {
      getTracker().track({
        contentId,
        contentType,
        eventType: 'click',
        metadata: label ? { label } : undefined,
      });
    },
    [contentId, contentType]
  );

  return { trackClick, containerRef };
}
