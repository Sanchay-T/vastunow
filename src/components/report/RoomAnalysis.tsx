'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ArrowRight, Sparkles } from 'lucide-react';
import type { RoomScore } from '@/lib/vastu/types';
import type { ReportRoomDetail } from '@/lib/llm/generate-report';
import rulesData from '@/lib/vastu/rules-data.json';

const DIR_META = rulesData.direction_metadata as Record<string, { element: string; deity: string; governs: string }>;

interface RoomAnalysisProps {
  roomScores: RoomScore[];
  reportDetails?: ReportRoomDetail[];
}

function getScoreColor(score: number) {
  if (score >= 80) return { color: '#16a34a', bg: '#f0fdf4', label: 'Well Placed' };
  if (score >= 50) return { color: '#d97706', bg: '#fffbeb', label: 'Needs Attention' };
  return { color: '#dc2626', bg: '#fef2f2', label: 'Vastu Dosha' };
}

function ScoreArc({ score, size = 48 }: { score: number; size?: number }) {
  const { color } = getScoreColor(score);
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference - (score / 100) * circumference;
  const center = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      <circle cx={center} cy={center} r={r} fill="none" stroke="#f3f4f6" strokeWidth="3" />
      <circle
        cx={center} cy={center} r={r}
        fill="none" stroke={color} strokeWidth="3"
        strokeDasharray={circumference} strokeDashoffset={dashOffset}
        strokeLinecap="round" transform={`rotate(-90 ${center} ${center})`}
      />
      <text
        x={center} y={center} textAnchor="middle" dominantBaseline="central"
        fontSize={size * 0.3} fontWeight="700" fill={color}
      >
        {score}
      </text>
    </svg>
  );
}

export default function RoomAnalysis({ roomScores, reportDetails }: RoomAnalysisProps) {
  const { t } = useTranslation();
  const [expandedRoom, setExpandedRoom] = useState<number | null>(null);

  return (
    <div>
      <h3
        className="text-lg sm:text-xl font-bold text-[var(--secondary)] mb-1"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        {t('room_analysis')}
      </h3>
      <p className="text-xs text-stone-400 mb-6">
        Tap any room for detailed findings and remedies
      </p>

      {/* Room grid — 2 columns on desktop, 1 on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {roomScores.map((rs, i) => {
          const detail = reportDetails?.find(d => d.room_name === rs.room_name);
          const scoreInfo = getScoreColor(rs.score);
          const meta = DIR_META[rs.actual_direction];
          const isExpanded = expandedRoom === i;

          return (
            <motion.div
              key={i}
              layout
              className={`rounded-xl overflow-hidden transition-shadow duration-200 ${
                isExpanded
                  ? 'col-span-1 sm:col-span-2 shadow-lg ring-1'
                  : 'shadow-sm hover:shadow-md'
              }`}
              style={{
                backgroundColor: isExpanded ? scoreInfo.bg : 'white',
                border: `1px solid ${isExpanded ? scoreInfo.color + '30' : '#e5e2de'}`,
                boxShadow: isExpanded ? `0 0 0 1px ${scoreInfo.color}20` : undefined,
              }}
            >
              {/* Room card header */}
              <button
                onClick={() => setExpandedRoom(isExpanded ? null : i)}
                className="w-full text-left p-3 sm:p-4 flex items-start gap-2.5 sm:gap-3"
              >
                {/* Score circle - smaller on mobile */}
                <ScoreArc score={rs.score} size={40} />

                {/* Room info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5">
                    <h4 className="font-semibold text-[var(--foreground)] text-sm truncate">
                      {rs.room_name}
                    </h4>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0"
                      style={{ backgroundColor: scoreInfo.color + '15', color: scoreInfo.color }}
                    >
                      {scoreInfo.label}
                    </span>
                  </div>

                  {/* Direction + zone info */}
                  <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs text-stone-500 flex-wrap">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="font-medium text-[var(--primary)]">{rs.actual_direction}</span>
                    {meta && (
                      <>
                        <span className="text-stone-300">/</span>
                        <span className="italic truncate">{meta.deity.split('/')[0].split('(')[0].trim()}</span>
                        <span className="text-stone-300">/</span>
                        <span>{meta.element}</span>
                      </>
                    )}
                  </div>

                  {/* Ideal placement hint */}
                  {rs.ideal_directions.length > 0 && rs.score < 80 && (
                    <div className="flex items-center gap-1 mt-1.5 text-[11px] text-stone-400">
                      <ArrowRight className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">Ideal: {rs.ideal_directions.join(', ')}</span>
                    </div>
                  )}
                </div>
              </button>

              {/* Expanded detail panel */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                      {/* Divider */}
                      <div className="h-px bg-stone-200/60 mb-3 sm:mb-4" />

                      {detail ? (
                        <div className="space-y-4">
                          {/* Finding */}
                          <div>
                            <h5 className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                              {t('finding')}
                            </h5>
                            <p className="text-sm text-stone-700 leading-relaxed">
                              {detail.finding}
                            </p>
                          </div>

                          {/* Impact */}
                          <div>
                            <h5 className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                              {t('impact')}
                            </h5>
                            <p className="text-sm text-stone-700 leading-relaxed">
                              {detail.impact}
                            </p>
                          </div>

                          {/* Remedy */}
                          {detail.remedy && (
                            <div className="bg-white rounded-lg p-3 border border-stone-200/80">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
                                <h5 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--primary)]">
                                  {t('remedy')}
                                </h5>
                              </div>
                              <p className="text-sm text-stone-700 leading-relaxed">
                                {detail.remedy}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {rs.issues.map((issue, j) => (
                            <p key={j} className="text-sm text-stone-700 leading-relaxed">{issue}</p>
                          ))}
                          {rs.remedies.map((remedy, j) => (
                            <div key={j} className="bg-white rounded-lg p-3 border border-stone-200/80">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
                                <h5 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--primary)]">
                                  {t('remedy')}
                                </h5>
                              </div>
                              <p className="text-sm text-stone-700 leading-relaxed">{remedy}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
