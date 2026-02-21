'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import type { ParsedRoom } from '@/lib/llm/parse-floorplan';

const ROOM_TYPES = [
  'kitchen', 'master_bedroom', 'bedroom', 'bathroom', 'living_room',
  'dining_room', 'pooja_room', 'balcony', 'storage', 'corridor',
  'study', 'utility', 'hall', 'drawing_room', 'unknown'
];

interface RoomReviewGridProps {
  rooms: ParsedRoom[];
  imageUrl: string;
  onRoomChange: (index: number, field: 'name' | 'type', value: string) => void;
}

// Map grid_row/grid_col (0-2) to percentage positions on the image
function getPosition(row: number, col: number): { top: string; left: string } {
  // Map 0->16%, 1->50%, 2->83% for both axes
  const positions = [16, 50, 83];
  return {
    top: `${positions[Math.min(row, 2)]}%`,
    left: `${positions[Math.min(col, 2)]}%`,
  };
}

// Determine popover alignment based on position to prevent overflow
function getPopoverAlignment(row: number, col: number): { horizontal: 'left' | 'center' | 'right'; vertical: 'above' | 'below' } {
  return {
    horizontal: col === 0 ? 'left' : col === 2 ? 'right' : 'center',
    vertical: row === 2 ? 'above' : 'below',
  };
}

export default function RoomReviewGrid({ rooms, imageUrl, onRoomChange }: RoomReviewGridProps) {
  const [activeTag, setActiveTag] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Clamp popover inside container boundaries after render
  const clampPopover = useCallback(() => {
    if (!popoverRef.current || !containerRef.current) return;
    const container = containerRef.current.getBoundingClientRect();
    const popover = popoverRef.current.getBoundingClientRect();

    // Clamp horizontal: if popover exceeds container, shift it
    if (popover.left < container.left) {
      const shift = container.left - popover.left + 4;
      popoverRef.current.style.transform = `translateX(${shift}px)`;
    } else if (popover.right > container.right) {
      const shift = popover.right - container.right + 4;
      popoverRef.current.style.transform = `translateX(-${shift}px)`;
    }
  }, []);

  useEffect(() => {
    if (activeTag !== null) {
      // Allow one frame for layout, then clamp
      requestAnimationFrame(clampPopover);
    }
  }, [activeTag, clampPopover]);

  return (
    <div ref={containerRef} className="relative w-full rounded-xl overflow-hidden border border-[var(--border)] bg-gray-900">
      {/* Floor plan image -- full and clean */}
      <img
        src={imageUrl}
        alt="Floor plan"
        className="w-full block"
        onClick={() => setActiveTag(null)}
      />

      {/* Pin tags overlaid on image */}
      {rooms.map((room, i) => {
        const pos = getPosition(room.grid_row, room.grid_col);
        const isActive = activeTag === i;
        const alignment = getPopoverAlignment(room.grid_row, room.grid_col);

        // Compute popover horizontal position classes
        const hAlignClass =
          alignment.horizontal === 'left'
            ? 'left-0'
            : alignment.horizontal === 'right'
            ? 'right-0'
            : 'left-1/2 -translate-x-1/2';

        return (
          <div
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ top: pos.top, left: pos.left, zIndex: isActive ? 20 : 10 }}
          >
            {/* The tag pill */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveTag(isActive ? null : i);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-full shadow-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 min-h-[44px] ${
                isActive
                  ? 'bg-[#c2410c] text-white scale-110'
                  : 'bg-white/95 text-stone-800 hover:bg-white hover:scale-105'
              }`}
              style={{ backdropFilter: 'blur(4px)' }}
            >
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? 'bg-white' : 'bg-[#c2410c]'}`} />
              {room.name}
              <span className={`text-[10px] font-bold ${isActive ? 'text-white/70' : 'text-[#c2410c]'}`}>
                {room.compass_direction}
              </span>
            </button>

            {/* Popover editor */}
            {isActive && (
              <div
                ref={popoverRef}
                className={`absolute ${
                  alignment.vertical === 'above' ? 'bottom-full mb-2' : 'top-full mt-2'
                } ${hAlignClass} w-56 bg-white rounded-xl shadow-2xl border border-stone-200 p-3 z-30`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Arrow */}
                <div
                  className={`absolute ${hAlignClass} w-4 h-4 bg-white border-stone-200 rotate-45 ${
                    alignment.vertical === 'above'
                      ? '-bottom-2 border-r border-b'
                      : '-top-2 border-l border-t'
                  }`}
                />

                <div className="relative">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-[#c2410c] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {room.compass_direction}
                    </span>
                    <button
                      onClick={() => setActiveTag(null)}
                      className="p-1.5 hover:bg-gray-100 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                      <X className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </div>

                  {/* Name input */}
                  <label className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Name</label>
                  <input
                    type="text"
                    value={room.name}
                    onChange={(e) => onRoomChange(i, 'name', e.target.value)}
                    className="w-full px-2.5 py-2.5 text-sm border border-gray-200 rounded-lg mb-2 focus:ring-2 focus:ring-[#c2410c] focus:border-transparent min-h-[44px]"
                  />

                  {/* Type select */}
                  <label className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Type</label>
                  <select
                    value={room.type}
                    onChange={(e) => onRoomChange(i, 'type', e.target.value)}
                    className="w-full px-2.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#c2410c] focus:border-transparent min-h-[44px]"
                  >
                    {ROOM_TYPES.map(type => (
                      <option key={type} value={type}>
                        {type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
