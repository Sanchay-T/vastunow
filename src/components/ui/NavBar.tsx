'use client';

import Image from 'next/image';
import Link from 'next/link';
import LanguageSwitcher from './LanguageSwitcher';

interface NavBarProps {
  onLanguageChange?: (lang: string) => void;
}

export default function NavBar({ onLanguageChange }: NavBarProps) {
  return (
    <nav className="sticky top-0 z-50 relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #6E1126 0%, #4a0c1a 35%, #1a0a20 70%, #283171 100%)',
    }}>
      {/* Subtle gold shimmer line at top */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(234,156,51,0.5), rgba(234,156,51,0.8), rgba(234,156,51,0.5), transparent)' }}
      />

      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(234,156,51,0.4) 1px, transparent 0)',
        backgroundSize: '24px 24px',
      }} />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 h-[68px] flex items-center justify-between gap-3">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          {/* Mascot with subtle glow */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[var(--gold)] opacity-0 group-hover:opacity-15 blur-md transition-opacity duration-500" />
            <Image
              src="/images/mascot.png"
              alt="My Vaastu Pandit"
              width={48}
              height={48}
              className="relative w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md"
              priority
            />
          </div>

          {/* Text */}
          <div className="flex flex-col leading-none">
            <span
              className="font-bold text-[15px] sm:text-lg text-white tracking-wide drop-shadow-sm"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              My Vaastu Pandit
            </span>
            {/* Gold divider */}
            <div className="w-full h-[1px] my-1" style={{
              background: 'linear-gradient(90deg, rgba(234,156,51,0.6), rgba(234,156,51,0.2), transparent)',
            }} />
            <span className="text-[7px] sm:text-[8px] text-[var(--gold)] tracking-[0.3em] uppercase font-semibold">
              Analyse &middot; Remedy &middot; Prosper
            </span>
          </div>
        </Link>

        {/* Right side — nav links + language */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Nav links - hidden on very small screens */}
          <div className="hidden sm:flex items-center gap-1">
            {['Home', 'How It Works'].map((label) => (
              <span
                key={label}
                className="text-[11px] sm:text-xs text-white/60 hover:text-white px-3 py-2 rounded-lg hover:bg-white/8 transition-all duration-200 cursor-pointer tracking-wide uppercase font-medium"
              >
                {label}
              </span>
            ))}
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-6 bg-white/15 mx-1" />

          <LanguageSwitcher onLanguageChange={onLanguageChange} />
        </div>
      </div>

      {/* Bottom gold accent line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[1px]"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(234,156,51,0.3), rgba(234,156,51,0.5), rgba(234,156,51,0.3), transparent)' }}
      />
    </nav>
  );
}
