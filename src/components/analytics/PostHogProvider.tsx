'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initPostHog, capturePageview } from '@/lib/analytics/posthog';

function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    const search = searchParams?.toString();
    const url = window.location.origin + pathname + (search ? `?${search}` : '');
    capturePageview(url);
  }, [pathname, searchParams]);

  return null;
}

export default function PostHogProvider() {
  useEffect(() => {
    initPostHog();
  }, []);

  return (
    <Suspense fallback={null}>
      <PageviewTracker />
    </Suspense>
  );
}
