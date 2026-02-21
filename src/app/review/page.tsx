'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ArrowRight, SkipForward } from 'lucide-react';
import type { ParsedFloorPlan } from '@/lib/llm/parse-floorplan';
import RoomReviewGrid from '@/components/review/RoomReviewGrid';
import EntranceConfirm from '@/components/review/EntranceConfirm';
import ProgressStepper from '@/components/ui/ProgressStepper';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface VastuSessionData {
  parsed_floorplan: ParsedFloorPlan;
  image_url: string;
  facing_direction: string;
  confidence: string;
}

export default function ReviewPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [data, setData] = useState<VastuSessionData | null>(null);
  const [rooms, setRooms] = useState(data?.parsed_floorplan.rooms || []);
  const [entranceConfirmed, setEntranceConfirmed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);

  useEffect(() => {
    const stored = sessionStorage.getItem('vastuData');
    if (!stored) { router.push('/'); return; }
    const parsed = JSON.parse(stored) as VastuSessionData;
    setData(parsed);
    setRooms([...parsed.parsed_floorplan.rooms]);
  }, [router]);

  const handleRoomChange = (index: number, field: 'name' | 'type', value: string) => {
    setRooms(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleScore = async (skipReview = false) => {
    if (!data) return;
    setLoading(true);
    setLoadingStep(1);

    try {
      const corrections = skipReview ? undefined : {
        rooms: rooms.map((room, i) => {
          const original = data.parsed_floorplan.rooms[i];
          if (room.name !== original.name || room.type !== original.type) {
            return { index: i, name: room.name, type: room.type };
          }
          return null;
        }).filter(Boolean)
      };

      setLoadingStep(2);
      const languageMap: Record<string, string> = { en: 'English', hi: 'Hindi' };

      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parsed_floorplan: data.parsed_floorplan,
          image_url: data.image_url,
          facing_direction: data.facing_direction,
          language: languageMap[i18n.language] || 'English',
          user_corrections: corrections && corrections.rooms && corrections.rooms.length > 0 ? corrections : undefined
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      sessionStorage.setItem('vastuResult', JSON.stringify(result));
      router.push(`/report/${result.id}`);
    } catch (error) {
      console.error('Scoring failed:', error);
      alert(t('error_generic'));
    } finally {
      setLoading(false);
    }
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner step={1} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner step={loadingStep} />
      </div>
    );
  }

  const roomCount = rooms.length;

  return (
    <div className="bg-[var(--background)]">
      <div className="max-w-3xl mx-auto px-3 sm:px-6 py-5 sm:py-8">
        {/* Stepper */}
        <div className="mb-6 sm:mb-8">
          <ProgressStepper currentStep={2} />
        </div>

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1
                className="text-xl sm:text-2xl font-bold text-[var(--secondary)] leading-tight"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                {t('review_title')}
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 mt-1">
                {roomCount} rooms detected &middot; Tap any room to edit
              </p>
            </div>
            {/* Confidence */}
            <div className="flex-shrink-0">
              <div className={`text-[10px] sm:text-xs font-medium px-2 py-1 rounded-md ${
                data.confidence === 'high' ? 'bg-green-50 text-green-700' :
                data.confidence === 'medium' ? 'bg-amber-50 text-amber-700' :
                'bg-red-50 text-red-700'
              }`}>
                {data.confidence === 'high' ? 'High' : data.confidence === 'medium' ? 'Medium' : 'Low'} confidence
              </div>
            </div>
          </div>
        </div>

        {/* Entrance confirmation — inline, minimal */}
        {data.parsed_floorplan.entrance && (
          <EntranceConfirm
            direction={data.parsed_floorplan.entrance.compass_direction}
            side={data.parsed_floorplan.entrance.side}
            confirmed={entranceConfirmed}
            onConfirm={setEntranceConfirmed}
          />
        )}

        {/* Floor plan with pin tag overlays — all screen sizes */}
        <div className="mb-6 sm:mb-8">
          <RoomReviewGrid
            rooms={rooms}
            imageUrl={data.image_url}
            onRoomChange={handleRoomChange}
          />
        </div>

        {/* Actions — primary + skip */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleScore(false)}
            className="flex-1 flex items-center justify-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white font-medium text-sm py-3.5 px-6 rounded-lg min-h-[52px] shadow-sm"
          >
            <span>{t('looks_good')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleScore(true)}
            className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-600 py-3 px-3 rounded-lg min-h-[48px] whitespace-nowrap"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('skip_review')}</span>
            <span className="sm:hidden">Skip</span>
          </button>
        </div>
      </div>
    </div>
  );
}
