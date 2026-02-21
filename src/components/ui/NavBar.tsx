'use client';

import Link from 'next/link';
import LanguageSwitcher from './LanguageSwitcher';

interface NavBarProps {
  onLanguageChange?: (lang: string) => void;
}

export default function NavBar({ onLanguageChange }: NavBarProps) {
  return (
    <nav className="sticky top-0 z-50 bg-[var(--background)]/95 backdrop-blur-sm border-b border-[var(--border)]">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <span className="font-bold text-lg text-[var(--secondary)]" style={{ fontFamily: 'var(--font-serif)' }}>
            VastuNow
          </span>
        </Link>
        <LanguageSwitcher onLanguageChange={onLanguageChange} />
      </div>
    </nav>
  );
}
