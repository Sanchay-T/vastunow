import posthog from 'posthog-js';

let initialized = false;

export function initPostHog() {
  if (initialized || typeof window === 'undefined') return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  posthog.init(key, {
    api_host: '/ingest',
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: true,
    capture_dead_clicks: false,
    capture_performance: false,
    disable_session_recording: true,
    loaded: (ph) => {
      if (process.env.NODE_ENV === 'development') ph.debug(false);
    },
  });

  initialized = true;
}

export function track(event: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  if (!initialized) return;
  posthog.capture(event, properties);
}

export function capturePageview(url: string) {
  if (typeof window === 'undefined' || !initialized) return;
  posthog.capture('$pageview', { $current_url: url });
}

export { posthog };
