'use client';

import { useState } from 'react';
import VastuSchematic from './VastuSchematic';
import type { RoomScore } from '@/lib/vastu/types';
import type { ParsedRoom } from '@/lib/llm/parse-floorplan';

interface ZoneComparisonProps {
  imageUrl: string;
  rooms: ParsedRoom[];
  scores: RoomScore[];
  entrance?: {
    compass_direction: string;
    grid_row: number;
    grid_col: number;
    side: string;
  };
}

export default function ZoneComparison({ imageUrl, rooms, scores, entrance }: ZoneComparisonProps) {
  const [activeView, setActiveView] = useState<'both' | 'plan' | 'zone'>('both');

  return (
    <div>
      {/* View toggle */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex bg-stone-100 rounded-lg p-0.5 text-xs font-medium">
          {([
            { key: 'both' as const, label: 'Compare' },
            { key: 'plan' as const, label: 'Floor Plan' },
            { key: 'zone' as const, label: 'Zone Map' },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveView(key)}
              className={`px-4 py-2 rounded-md transition-all min-h-[44px] ${
                activeView === key
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Compare view — side by side on desktop, stacked on mobile */}
      {activeView === 'both' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <div className="flex flex-col">
            <p className="text-[10px] text-stone-400 tracking-wide uppercase mb-2 text-center">
              Floor Plan
            </p>
            <div className="flex-1 rounded-lg overflow-hidden border border-stone-200 bg-stone-50 flex items-center justify-center">
              <img
                src={imageUrl}
                alt="Original floor plan"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <div className="flex flex-col">
            <p className="text-[10px] text-stone-400 tracking-wide uppercase mb-2 text-center">
              Zone Map
            </p>
            <div className="flex-1 flex items-start">
              <VastuSchematic rooms={rooms} scores={scores} entrance={entrance} />
            </div>
          </div>
        </div>
      )}

      {/* Floor plan only */}
      {activeView === 'plan' && (
        <div className="max-w-sm mx-auto">
          <div className="rounded-lg overflow-hidden border border-stone-200 bg-stone-50">
            <img
              src={imageUrl}
              alt="Original floor plan"
              className="w-full block object-contain"
            />
          </div>
        </div>
      )}

      {/* Zone map only */}
      {activeView === 'zone' && (
        <div className="max-w-sm mx-auto">
          <VastuSchematic rooms={rooms} scores={scores} entrance={entrance} />
        </div>
      )}
    </div>
  );
}
