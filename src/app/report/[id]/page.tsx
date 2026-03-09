'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Download, ArrowRight } from 'lucide-react';
import ScoreCard from '@/components/report/ScoreCard';
import ZoneComparison from '@/components/report/ZoneComparison';
import RoomAnalysis from '@/components/report/RoomAnalysis';
import RemedyList from '@/components/report/RemedyList';
import AnalyzeAnother from '@/components/report/AnalyzeAnother';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import type { RoomScore } from '@/lib/vastu/types';
import type { ReportContent } from '@/lib/llm/generate-report';
import type { ParsedRoom } from '@/lib/llm/parse-floorplan';

interface AnalysisResult {
  id: string;
  overall_score: number;
  grade: string;
  room_scores: RoomScore[];
  critical_issues: string[];
  positive_aspects: string[];
  report: ReportContent | null;
  report_available: boolean;
  image_url: string;
  schematic_data: {
    rooms: ParsedRoom[];
    entrance: {
      compass_direction: string;
      grid_row: number;
      grid_col: number;
      side: string;
    };
    facing: string;
    scores: RoomScore[];
  };
}

export default function ReportPage() {
  const params = useParams();
  const { t, i18n } = useTranslation();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('vastuResult');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.id === params.id) {
        setResult(parsed);
        setLoading(false);
        return;
      }
    }
    fetch(`/api/report-pdf?id=${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.analysis) {
          setResult({
            id: data.analysis.id,
            overall_score: data.analysis.overall_score,
            grade: data.analysis.grade,
            room_scores: data.analysis.vastu_analysis.room_scores,
            critical_issues: data.analysis.vastu_analysis.critical_issues,
            positive_aspects: data.analysis.vastu_analysis.positive_aspects,
            report: data.analysis.report_content,
            report_available: !!data.analysis.report_content,
            image_url: data.analysis.image_url,
            schematic_data: {
              rooms: data.analysis.parsed_floorplan.rooms,
              entrance: data.analysis.parsed_floorplan.entrance,
              facing: data.analysis.facing_direction,
              scores: data.analysis.vastu_analysis.room_scores
            }
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleLanguageChange = useCallback(async (lang: string) => {
    if (!result) return;
    setRegenerating(true);
    try {
      const languageMap: Record<string, string> = { en: 'English', hi: 'Hindi' };
      const res = await fetch('/api/regenerate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis_id: result.id, language: languageMap[lang] || 'English' })
      });
      const data = await res.json();
      if (data.report) {
        setResult(prev => prev ? { ...prev, report: data.report, report_available: true } : prev);
      }
    } catch (error) {
      console.error('Failed to regenerate report:', error);
    } finally {
      setRegenerating(false);
    }
  }, [result]);

  useEffect(() => {
    const handler = (lng: string) => handleLanguageChange(lng);
    i18n.on('languageChanged', handler);
    return () => { i18n.off('languageChanged', handler); };
  }, [i18n, handleLanguageChange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner step={2} />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600">Analysis not found.</p>
        <div className="mt-4"><AnalyzeAnother /></div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--background)]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-40 sm:pb-28">

        {/* Report header — editorial style */}
        <header className="text-center mb-10 sm:mb-12">
          <p className="text-[11px] text-stone-400 tracking-[0.2em] uppercase mb-3">
            Vaastu Compliance Report
          </p>
          <h1
            className="text-2xl sm:text-3xl font-bold text-[var(--secondary)] leading-tight"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {t('report_title')}
          </h1>
          <div className="w-12 h-0.5 bg-[var(--primary)] mx-auto mt-4" />
        </header>

        {/* Score */}
        <ScoreCard
          score={result.overall_score}
          grade={result.grade}
          summary={result.report?.summary}
        />

        {/* Partial results */}
        {!result.report_available && (
          <p className="mt-6 text-center text-sm text-amber-700 bg-amber-50/60 py-3 px-4 rounded-lg">
            {t('partial_results')}
          </p>
        )}

        {regenerating && (
          <p className="mt-6 text-center text-sm text-stone-400 animate-pulse">
            Regenerating report...
          </p>
        )}

        {/* Interpretation — clean editorial block */}
        {result.report?.overall_interpretation && (
          <div className="mt-10">
            <p className="text-sm sm:text-base text-stone-600 leading-7 sm:leading-8">
              {result.report.overall_interpretation}
            </p>
          </div>
        )}

        {/* Divider */}
        <div className="my-10 sm:my-12 flex items-center gap-4">
          <div className="flex-1 h-px bg-stone-200" />
          <span className="text-[10px] text-stone-300 tracking-[0.15em] uppercase whitespace-nowrap flex-shrink-0">Floor Plan vs Zone Map</span>
          <div className="flex-1 h-px bg-stone-200" />
        </div>

        {/* Side-by-side comparison */}
        <ZoneComparison
          imageUrl={result.image_url}
          rooms={result.schematic_data.rooms}
          scores={result.room_scores}
          entrance={result.schematic_data.entrance}
        />

        {/* Divider */}
        <div className="my-10 sm:my-12 flex items-center gap-4">
          <div className="flex-1 h-px bg-stone-200" />
          <span className="text-[10px] text-stone-300 tracking-[0.15em] uppercase whitespace-nowrap flex-shrink-0">Room Analysis</span>
          <div className="flex-1 h-px bg-stone-200" />
        </div>

        {/* Room Analysis */}
        <RoomAnalysis
          roomScores={result.room_scores}
          reportDetails={result.report?.room_details}
        />

        {/* Divider */}
        <div className="my-10 sm:my-12 flex items-center gap-4">
          <div className="flex-1 h-px bg-stone-200" />
          <span className="text-[10px] text-stone-300 tracking-[0.15em] uppercase whitespace-nowrap flex-shrink-0">Recommendations</span>
          <div className="flex-1 h-px bg-stone-200" />
        </div>

        {/* Recommendations */}
        <RemedyList
          priorities={result.report?.top_priorities}
          positiveNotes={result.report?.positive_notes || result.positive_aspects}
          generalTips={result.report?.general_tips}
        />

        {/* Disclaimer */}
        <footer className="mt-12 pt-6 border-t border-stone-200">
          <p className="text-[11px] text-stone-400 leading-5 text-center max-w-sm mx-auto">
            {t('disclaimer')}
          </p>
        </footer>
      </div>

      {/* Fixed footer */}
      <div className="fixed bottom-0 left-0 right-0 z-10 pb-[env(safe-area-inset-bottom)]">
        {/* Fade edge */}
        <div className="h-6 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        <div className="bg-white border-t border-stone-100">
          <div className="max-w-2xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Primary: Download PDF */}
            <button
              onClick={() => window.open(`/api/report-pdf?id=${result.id}`, '_blank')}
              className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-[var(--secondary)] hover:bg-[#1e2860] text-white font-medium text-sm py-3 px-4 sm:px-5 rounded-lg transition-colors min-h-[48px]"
            >
              <Download className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{t('download_pdf')}</span>
            </button>

            {/* Secondary: Analyze Another */}
            <button
              onClick={() => window.location.href = '/'}
              className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 text-sm font-medium text-stone-500 hover:text-[var(--primary)] py-3 px-3 sm:px-4 rounded-lg hover:bg-stone-50 transition-colors min-h-[48px]"
            >
              <span className="truncate">{t('analyze_another')}</span>
              <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
