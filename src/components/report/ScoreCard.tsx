'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface ScoreCardProps {
  score: number;
  grade: string;
  summary?: string;
}

function getScoreColor(score: number) {
  if (score >= 80) return { color: '#16a34a', bg: '#f0fdf4', label: 'Excellent' };
  if (score >= 70) return { color: '#65a30d', bg: '#f7fee7', label: 'Good' };
  if (score >= 55) return { color: '#d97706', bg: '#fffbeb', label: 'Fair' };
  if (score >= 40) return { color: '#ea580c', bg: '#fff7ed', label: 'Below Average' };
  return { color: '#dc2626', bg: '#fef2f2', label: 'Needs Work' };
}

function useCountUp(target: number, duration = 1500) {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return current;
}

export default function ScoreCard({ score, grade, summary }: ScoreCardProps) {
  const { t } = useTranslation();
  const info = getScoreColor(score);
  const displayScore = useCountUp(score);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      {/* Score + Grade row */}
      <div className="flex items-center gap-6 sm:gap-8 mb-5">
        {/* Circular gauge */}
        <div className="relative">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="6" />
            <circle
              cx="60" cy="60" r={radius}
              fill="none" stroke={info.color} strokeWidth="6"
              strokeDasharray={circumference} strokeDashoffset={dashOffset}
              strokeLinecap="round" transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold tabular-nums" style={{ color: info.color }}>
              {displayScore}
            </span>
          </div>
        </div>

        {/* Grade + label */}
        <div>
          <p className="text-[11px] text-stone-400 tracking-wide uppercase mb-1">{t('grade')}</p>
          <p className="text-4xl sm:text-5xl font-bold leading-none" style={{ color: info.color }}>{grade}</p>
          <p className="text-sm font-medium mt-1" style={{ color: info.color }}>{info.label}</p>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <p className="text-sm text-stone-500 leading-6 text-center max-w-md">
          {summary}
        </p>
      )}
    </div>
  );
}
