type EventPayload = {
  contentId?: string;
  contentType?: string;
  eventType: string;
  metadata?: Record<string, unknown>;
  sessionId?: string;
};

const BATCH_SIZE = 10;
const FLUSH_INTERVAL_MS = 5000;

class AnalyticsTracker {
  private queue: EventPayload[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private sessionId: string | null = null;

  start() {
    if (typeof window === 'undefined') return;

    this.sessionId = this.getOrCreateSessionId();

    this.timer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS);

    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    document.removeEventListener(
      'visibilitychange',
      this.handleVisibilityChange
    );
    this.flush();
  }

  track(event: Omit<EventPayload, 'sessionId'>) {
    this.queue.push({ ...event, sessionId: this.sessionId || undefined });

    if (this.queue.length >= BATCH_SIZE) {
      this.flush();
    }
  }

  flush() {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    const body = JSON.stringify({ events });

    // Use sendBeacon for reliability during page unload
    if (
      typeof navigator !== 'undefined' &&
      navigator.sendBeacon &&
      document.visibilityState === 'hidden'
    ) {
      navigator.sendBeacon(
        '/api/analytics/events',
        new Blob([body], { type: 'application/json' })
      );
      return;
    }

    fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch((err) => {
      console.error('Failed to flush analytics:', err);
      // Re-queue failed events (but don't let queue grow unbounded)
      if (this.queue.length < 100) {
        this.queue.unshift(...events);
      }
    });
  }

  private handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      this.flush();
    }
  };

  private getOrCreateSessionId(): string {
    const key = 'analytics_session_id';
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(key, id);
    }
    return id;
  }
}

// Singleton
let instance: AnalyticsTracker | null = null;

export function getTracker(): AnalyticsTracker {
  if (!instance) {
    instance = new AnalyticsTracker();
  }
  return instance;
}
