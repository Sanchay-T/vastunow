'use client';

import { useTranslation } from 'react-i18next';
import type { ParsedRoom } from '@/lib/llm/parse-floorplan';

const ROOM_TYPES = [
  'kitchen', 'master_bedroom', 'bedroom', 'bathroom', 'living_room',
  'dining_room', 'pooja_room', 'balcony', 'storage', 'corridor',
  'study', 'utility', 'hall', 'drawing_room', 'unknown'
];

interface RoomReviewListProps {
  rooms: ParsedRoom[];
  onRoomChange: (index: number, field: 'name' | 'type', value: string) => void;
}

export default function RoomReviewList({ rooms, onRoomChange }: RoomReviewListProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-lg border border-stone-200 divide-y divide-stone-100">
      {rooms.map((room, i) => (
        <div key={i} className="px-3.5 py-3 flex items-center gap-3">
          {/* Direction badge */}
          <div className="w-9 h-9 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-bold text-[var(--primary)]">{room.compass_direction}</span>
          </div>

          {/* Name + Type — compact inline */}
          <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
            <input
              type="text"
              value={room.name}
              onChange={(e) => onRoomChange(i, 'name', e.target.value)}
              className="flex-1 min-w-0 px-2.5 py-1.5 text-sm font-medium text-stone-800 border border-transparent rounded-md hover:border-stone-200 focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none bg-transparent min-h-[40px]"
            />
            <select
              value={room.type}
              onChange={(e) => onRoomChange(i, 'type', e.target.value)}
              className="px-2 py-1.5 text-xs text-stone-500 border border-transparent rounded-md hover:border-stone-200 focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none bg-transparent min-h-[40px] cursor-pointer"
            >
              {ROOM_TYPES.map(type => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          {/* Direction name */}
          <span className="text-[10px] text-stone-400 flex-shrink-0 hidden min-[480px]:block">
            {t(`directions.${room.compass_direction}` as string)}
          </span>
        </div>
      ))}
    </div>
  );
}
