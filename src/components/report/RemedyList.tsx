'use client';

import { useTranslation } from 'react-i18next';

interface RemedyListProps {
  priorities?: string[];
  positiveNotes?: string[];
  generalTips?: string[];
}

export default function RemedyList({ priorities, positiveNotes, generalTips }: RemedyListProps) {
  const { t } = useTranslation();

  const hasPriorities = priorities && priorities.length > 0;
  const hasPositives = positiveNotes && positiveNotes.length > 0;
  const hasTips = generalTips && generalTips.length > 0;

  if (!hasPriorities && !hasPositives && !hasTips) return null;

  return (
    <div className="space-y-8">
      {/* Priority Actions */}
      {hasPriorities && (
        <div>
          <h4 className="text-sm font-semibold text-stone-900 mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold flex-shrink-0">!</span>
            {t('priority_actions')}
          </h4>
          <div className="space-y-2.5">
            {priorities!.map((p, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <span className="text-red-500 font-semibold tabular-nums flex-shrink-0 w-5 text-right">{i + 1}.</span>
                <p className="text-stone-700 leading-relaxed">{p}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* What's Working */}
      {hasPositives && (
        <div>
          <h4 className="text-sm font-semibold text-stone-900 mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-green-500 text-white text-[10px] flex items-center justify-center flex-shrink-0">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            {t('whats_working')}
          </h4>
          <div className="space-y-2.5">
            {positiveNotes!.map((p, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <span className="text-green-500 flex-shrink-0 mt-1">
                  <svg width="6" height="6"><circle cx="3" cy="3" r="3" fill="currentColor"/></svg>
                </span>
                <p className="text-stone-700 leading-relaxed">{p}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* General Tips */}
      {hasTips && (
        <div>
          <h4 className="text-sm font-semibold text-stone-900 mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[var(--primary)] text-white text-[10px] flex items-center justify-center flex-shrink-0">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="3.5" r="2.5" stroke="white" strokeWidth="1.2"/><path d="M4 7h2M4.5 6v1M5.5 6v1" stroke="white" strokeWidth="1" strokeLinecap="round"/></svg>
            </span>
            {t('general_tips')}
          </h4>
          <div className="space-y-2.5">
            {generalTips!.map((tip, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <span className="text-[var(--primary)] flex-shrink-0 mt-1">
                  <svg width="6" height="6"><circle cx="3" cy="3" r="3" fill="currentColor"/></svg>
                </span>
                <p className="text-stone-700 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
