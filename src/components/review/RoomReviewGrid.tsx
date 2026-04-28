'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import {
  Bed, Bath, ChefHat, Sofa, Utensils, Flame, BookOpen, Package,
  Wrench, DoorOpen, Palette, HelpCircle, Wind, MoveHorizontal,
  ChevronDown, Check, Compass, Plus, Trash2, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ParsedRoom, Direction } from '@/lib/llm/parse-floorplan';

const ROOM_TYPES = [
  'kitchen', 'master_bedroom', 'bedroom', 'bathroom', 'living_room',
  'dining_room', 'pooja_room', 'balcony', 'storage', 'corridor',
  'study', 'utility', 'hall', 'drawing_room', 'unknown',
];

const ROOM_ICONS: Record<string, LucideIcon> = {
  kitchen: ChefHat,
  master_bedroom: Bed,
  bedroom: Bed,
  bathroom: Bath,
  living_room: Sofa,
  dining_room: Utensils,
  pooja_room: Flame,
  balcony: Wind,
  storage: Package,
  corridor: MoveHorizontal,
  study: BookOpen,
  utility: Wrench,
  hall: DoorOpen,
  drawing_room: Palette,
  unknown: HelpCircle,
};

const COMPASS_GRID: Direction[][] = [
  ['NW', 'N', 'NE'],
  ['W', 'CENTER', 'E'],
  ['SW', 'S', 'SE'],
];

const formatType = (type: string) =>
  type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

function gridFromPct(xPct: number, yPct: number): { row: number; col: number } {
  const col = xPct < 33.333 ? 0 : xPct < 66.666 ? 1 : 2;
  const row = yPct < 33.333 ? 0 : yPct < 66.666 ? 1 : 2;
  return { row, col };
}

function compassFromGrid(row: number, col: number): Direction {
  return COMPASS_GRID[row][col];
}

interface RoomReviewGridProps {
  rooms: ParsedRoom[];
  imageUrl: string;
  onRoomChange: (index: number, field: 'name' | 'type', value: string) => void;
  onRoomReposition: (index: number, posXPct: number, posYPct: number) => void;
  onAddRoom: (room: ParsedRoom) => void;
  onDeleteRoom: (index: number) => void;
}

const GRID_POSITIONS = [16, 50, 83];

interface PinPosition {
  topPct: number;
  leftPct: number;
  offsetX: number;
  offsetY: number;
}

function computePinPositions(rooms: ParsedRoom[]): PinPosition[] {
  // Rooms with explicit pos_x_pct/pos_y_pct render at that position;
  // rooms without it fall back to grid-cell positioning with collision fan-out.
  const positions: PinPosition[] = new Array(rooms.length);
  const groups = new Map<string, number[]>();

  rooms.forEach((r, i) => {
    if (r.pos_x_pct !== undefined && r.pos_y_pct !== undefined) {
      positions[i] = { topPct: r.pos_y_pct, leftPct: r.pos_x_pct, offsetX: 0, offsetY: 0 };
      return;
    }
    const row = Math.min(Math.max(r.grid_row, 0), 2);
    const col = Math.min(Math.max(r.grid_col, 0), 2);
    const key = `${row}-${col}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(i);
  });

  groups.forEach((indices, key) => {
    const [row, col] = key.split('-').map(Number);
    const topPct = GRID_POSITIONS[row];
    const leftPct = GRID_POSITIONS[col];

    if (indices.length === 1) {
      positions[indices[0]] = { topPct, leftPct, offsetX: 0, offsetY: 0 };
      return;
    }
    const radius = indices.length <= 3 ? 26 : indices.length <= 5 ? 32 : 38;
    const angleStep = (2 * Math.PI) / indices.length;
    indices.forEach((idx, i) => {
      const angle = -Math.PI / 2 + i * angleStep;
      positions[idx] = {
        topPct,
        leftPct,
        offsetX: Math.cos(angle) * radius,
        offsetY: Math.sin(angle) * radius,
      };
    });
  });

  return positions;
}

interface DragState {
  index: number;
  pointerId: number;
  moved: boolean;
}

interface DrawState {
  pointerId: number;
  startX: number;
  startY: number;
  curX: number;
  curY: number;
}

export default function RoomReviewGrid({
  rooms, imageUrl, onRoomChange, onRoomReposition, onAddRoom, onDeleteRoom,
}: RoomReviewGridProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [drawMode, setDrawMode] = useState(false);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [draw, setDraw] = useState<DrawState | null>(null);

  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const imgWrapRef = useRef<HTMLDivElement>(null);

  const positions = computePinPositions(rooms);

  const getImagePct = useCallback((clientX: number, clientY: number) => {
    const rect = imgWrapRef.current?.getBoundingClientRect();
    if (!rect) return { x: 50, y: 50 };
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    };
  }, []);

  // Pin pointer handlers — drag to reposition
  const onPinPointerDown = (i: number, e: React.PointerEvent) => {
    if (drawMode) return;
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ index: i, pointerId: e.pointerId, moved: false });
  };

  const onPinPointerMove = (i: number, e: React.PointerEvent) => {
    if (!drag || drag.index !== i || drag.pointerId !== e.pointerId) return;
    const { x, y } = getImagePct(e.clientX, e.clientY);
    if (!drag.moved) setDrag(d => (d ? { ...d, moved: true } : d));
    onRoomReposition(i, x, y);
  };

  const onPinPointerUp = (i: number, e: React.PointerEvent) => {
    if (!drag || drag.index !== i || drag.pointerId !== e.pointerId) return;
    const wasDrag = drag.moved;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    setDrag(null);
    if (!wasDrag) {
      // Treat as a click → open card
      setActiveIdx(prev => (prev === i ? null : i));
      setTimeout(() => cardRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
    }
  };

  // Image pointer handlers — draw a new room rectangle
  const onImagePointerDown = (e: React.PointerEvent) => {
    if (!drawMode) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const { x, y } = getImagePct(e.clientX, e.clientY);
    setDraw({ pointerId: e.pointerId, startX: x, startY: y, curX: x, curY: y });
  };

  const onImagePointerMove = (e: React.PointerEvent) => {
    if (!draw || draw.pointerId !== e.pointerId) return;
    const { x, y } = getImagePct(e.clientX, e.clientY);
    setDraw(d => (d ? { ...d, curX: x, curY: y } : d));
  };

  const onImagePointerUp = (e: React.PointerEvent) => {
    if (!draw || draw.pointerId !== e.pointerId) return;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    const x = Math.min(draw.startX, draw.curX);
    const y = Math.min(draw.startY, draw.curY);
    const w = Math.abs(draw.curX - draw.startX);
    const h = Math.abs(draw.curY - draw.startY);
    setDraw(null);
    setDrawMode(false);

    // Require minimum size to register as a drawn room
    if (w < 3 || h < 3) return;

    const cx = x + w / 2;
    const cy = y + h / 2;
    const { row, col } = gridFromPct(cx, cy);
    const newRoom: ParsedRoom = {
      name: 'New Room',
      type: 'unknown',
      compass_direction: compassFromGrid(row, col),
      grid_row: row,
      grid_col: col,
      size: 'medium',
      has_window: false,
      has_door: true,
      pos_x_pct: cx,
      pos_y_pct: cy,
      bbox: { x, y, w, h },
      user_added: true,
    };
    onAddRoom(newRoom);
    // Open the new card after the next render
    setTimeout(() => {
      const newIdx = rooms.length; // index in the appended array
      setActiveIdx(newIdx);
      cardRefs.current[newIdx]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 80);
  };

  // Auto-cancel draw mode on Esc
  useEffect(() => {
    if (!drawMode) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawMode(false);
        setDraw(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [drawMode]);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <p className="text-xs text-stone-500">
          {drawMode
            ? 'Draw a rectangle around the room. Press Esc to cancel.'
            : 'Drag pins to reposition · Tap a card to edit'}
        </p>
        {drawMode ? (
          <button
            onClick={() => { setDrawMode(false); setDraw(null); }}
            className="flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 px-3 py-2 rounded-lg border border-stone-200 bg-white min-h-[36px]"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>
        ) : (
          <button
            onClick={() => { setDrawMode(true); setActiveIdx(null); }}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#6E1126] hover:bg-[#5a0e1f] px-3 py-2 rounded-lg shadow-sm min-h-[36px]"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Room
          </button>
        )}
      </div>

      {/* Floor plan with pins + drawing surface */}
      <div
        ref={imgWrapRef}
        onPointerDown={onImagePointerDown}
        onPointerMove={onImagePointerMove}
        onPointerUp={onImagePointerUp}
        onPointerCancel={onImagePointerUp}
        className={`relative w-full rounded-2xl overflow-hidden border bg-stone-100 mb-5 shadow-sm select-none ${
          drawMode ? 'border-[#6E1126] ring-2 ring-[#6E1126]/30 cursor-crosshair' : 'border-[var(--border)]'
        }`}
        style={{ touchAction: drawMode || drag ? 'none' : 'auto' }}
      >
        <img
          src={imageUrl}
          alt="Floor plan"
          className="w-full block pointer-events-none"
          draggable={false}
        />

        {/* Existing user-added bboxes */}
        {rooms.map((room, i) =>
          room.bbox ? (
            <div
              key={`bbox-${i}`}
              className={`absolute border-2 border-dashed rounded-md pointer-events-none transition-colors ${
                activeIdx === i ? 'border-[#6E1126] bg-[#6E1126]/10' : 'border-[#6E1126]/60 bg-[#6E1126]/5'
              }`}
              style={{
                left: `${room.bbox.x}%`,
                top: `${room.bbox.y}%`,
                width: `${room.bbox.w}%`,
                height: `${room.bbox.h}%`,
              }}
            />
          ) : null
        )}

        {/* In-progress draw rectangle */}
        {draw && (
          <div
            className="absolute border-2 border-[#6E1126] bg-[#6E1126]/15 rounded-md pointer-events-none"
            style={{
              left: `${Math.min(draw.startX, draw.curX)}%`,
              top: `${Math.min(draw.startY, draw.curY)}%`,
              width: `${Math.abs(draw.curX - draw.startX)}%`,
              height: `${Math.abs(draw.curY - draw.startY)}%`,
            }}
          />
        )}

        {/* Pins */}
        {rooms.map((room, i) => {
          const pos = positions[i];
          const isActive = activeIdx === i;
          const isDragging = drag?.index === i && drag.moved;
          return (
            <div
              key={`pin-${i}`}
              onPointerDown={(e) => onPinPointerDown(i, e)}
              onPointerMove={(e) => onPinPointerMove(i, e)}
              onPointerUp={(e) => onPinPointerUp(i, e)}
              onPointerCancel={(e) => onPinPointerUp(i, e)}
              role="button"
              aria-label={`Room ${i + 1}: ${room.name}`}
              className={`absolute group ${drawMode ? 'pointer-events-none' : ''}`}
              style={{
                top: `${pos.topPct}%`,
                left: `${pos.leftPct}%`,
                transform: `translate(calc(-50% + ${pos.offsetX}px), calc(-50% + ${pos.offsetY}px))`,
                zIndex: isActive || isDragging ? 30 : 10,
                cursor: isDragging ? 'grabbing' : 'grab',
                touchAction: 'none',
              }}
            >
              {(isActive || isDragging) && (
                <span className="absolute inset-0 rounded-full bg-[#6E1126]/30 blur-md scale-150 pointer-events-none" />
              )}
              <span
                className={`relative flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold transition-all duration-150 ${
                  isActive || isDragging
                    ? 'bg-[#6E1126] text-white scale-110 shadow-xl ring-4 ring-white'
                    : 'bg-white text-[#6E1126] shadow-md ring-2 ring-[#6E1126] group-hover:scale-110 group-hover:shadow-lg'
                }`}
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                {i + 1}
              </span>
            </div>
          );
        })}
      </div>

      {/* Section header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Detected Rooms · {rooms.length}
        </h3>
      </div>

      {/* Room cards */}
      <div className="space-y-2">
        {rooms.map((room, i) => {
          const isActive = activeIdx === i;
          const Icon = ROOM_ICONS[room.type] || HelpCircle;

          return (
            <div
              key={`card-${i}`}
              ref={(el) => { cardRefs.current[i] = el; }}
              className={`rounded-xl border bg-white overflow-hidden transition-all ${
                isActive
                  ? 'border-[#6E1126] shadow-md ring-1 ring-[#6E1126]/10'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <button
                onClick={() => setActiveIdx(prev => (prev === i ? null : i))}
                className="w-full flex items-center gap-3 p-3 text-left"
              >
                <span
                  className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold transition-colors ${
                    isActive ? 'bg-[#6E1126] text-white' : 'bg-[#6E1126]/8 text-[#6E1126]'
                  }`}
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  {i + 1}
                </span>

                <span
                  className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg ${
                    isActive ? 'bg-[#6E1126]/10' : 'bg-stone-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#6E1126]' : 'text-stone-600'}`} />
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-stone-900 truncate">{room.name}</span>
                    {room.user_added && (
                      <span className="flex-shrink-0 text-[9px] font-bold uppercase tracking-wider text-[#6E1126] bg-[#6E1126]/10 px-1.5 py-0.5 rounded">
                        Added
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-stone-500 truncate">{formatType(room.type)}</div>
                </div>

                <span className="flex-shrink-0 inline-flex items-center gap-1 bg-[#6E1126]/8 text-[#6E1126] text-[11px] font-bold px-2 py-1 rounded-md">
                  <Compass className="w-3 h-3" />
                  {room.compass_direction}
                </span>

                <ChevronDown
                  className={`w-4 h-4 text-stone-400 transition-transform flex-shrink-0 ${
                    isActive ? 'rotate-180 text-[#6E1126]' : ''
                  }`}
                />
              </button>

              {isActive && (
                <div className="border-t border-stone-100 p-3 bg-stone-50/50 space-y-3">
                  <div>
                    <label className="text-[10px] text-stone-500 font-semibold uppercase tracking-wide mb-1.5 block">
                      Name
                    </label>
                    <input
                      type="text"
                      value={room.name}
                      onChange={(e) => onRoomChange(i, 'name', e.target.value)}
                      className="w-full px-3 py-2.5 text-sm bg-white border border-stone-200 rounded-lg focus:ring-2 focus:ring-[#6E1126]/30 focus:border-[#6E1126] focus:outline-none min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-stone-500 font-semibold uppercase tracking-wide mb-1.5 block">
                      Type
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {ROOM_TYPES.map(type => {
                        const TypeIcon = ROOM_ICONS[type] || HelpCircle;
                        const selected = room.type === type;
                        return (
                          <button
                            key={type}
                            onClick={() => onRoomChange(i, 'type', type)}
                            className={`flex items-center gap-1.5 px-2 py-2 rounded-lg text-[11px] font-medium border transition-colors min-h-[40px] ${
                              selected
                                ? 'bg-[#6E1126] text-white border-[#6E1126]'
                                : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                            }`}
                          >
                            <TypeIcon className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{formatType(type)}</span>
                            {selected && <Check className="w-3 h-3 ml-auto flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {room.user_added && (
                    <button
                      onClick={() => { onDeleteRoom(i); setActiveIdx(null); }}
                      className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700 px-3 py-2 rounded-lg border border-red-200 hover:bg-red-50 min-h-[40px]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove this room
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
