'use client';

import { ReactNode } from 'react';
import '@/lib/i18n/config';
import NavBar from '@/components/ui/NavBar';
import PostHogProvider from '@/components/analytics/PostHogProvider';

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <>
      <PostHogProvider />
      <NavBar />
      <main className="min-h-[calc(100vh-56px)] overflow-x-hidden">
        {children}
      </main>
    </>
  );
}
