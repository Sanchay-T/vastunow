'use client';

import type { RoomScore } from '@/lib/vastu/types';
import type { ParsedRoom } from '@/lib/llm/parse-floorplan';
import rulesData from '@/lib/vastu/rules-data.json';

interface SchematicProps {
  rooms: ParsedRoom[];
  scores: RoomScore[];
  entrance?: {
    compass_direction: string;
    grid_row: number;
    grid_col: number;
    side: string;
  };
}

const DIRECTION_GRID = [
  ['NW', 'N', 'NE'],
  ['W', 'CENTER', 'E'],
  ['SW', 'S', 'SE'],
];

const DIR_META = rulesData.direction_metadata as Record<string, { element: string; deity: string; governs: string }>;

function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

function gradientId(score: number | undefined): string {
  if (score === undefined) return 'grad-empty';
  if (score >= 80) return 'grad-green';
  if (score >= 50) return 'grad-amber';
  return 'grad-red';
}

export default function VastuSchematic({ rooms, scores, entrance }: SchematicProps) {
  const cellSize = 140;
  const gap = 4;
  const padding = 40;
  const frameGap = 6;
  const gridSize = cellSize * 3 + gap * 2;
  const svgWidth = gridSize + padding * 2;
  const svgHeight = gridSize + padding * 2 + 36;

  const roomGrid: Record<string, { room: ParsedRoom; score: RoomScore | undefined }> = {};
  rooms.forEach(room => {
    const score = scores.find(s => s.room_name === room.name);
    roomGrid[room.compass_direction] = { room, score };
  });

  if (entrance) {
    const existing = roomGrid[entrance.compass_direction];
    if (!existing) {
      const entranceScore = scores.find(s => s.room_name === 'Main Entrance');
      roomGrid[entrance.compass_direction] = {
        room: { name: 'Main Entrance', type: 'hall', compass_direction: entrance.compass_direction as ParsedRoom['compass_direction'], grid_row: entrance.grid_row, grid_col: entrance.grid_col, size: 'small', has_window: false, has_door: true },
        score: entranceScore
      };
    }
  }

  const gridX = padding;
  const gridY = padding + 20;

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="w-full max-w-md mx-auto"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="grad-green" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0fdf4" />
          <stop offset="100%" stopColor="#dcfce7" />
        </linearGradient>
        <linearGradient id="grad-amber" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="100%" stopColor="#fef3c7" />
        </linearGradient>
        <linearGradient id="grad-red" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef2f2" />
          <stop offset="100%" stopColor="#fee2e2" />
        </linearGradient>
        <linearGradient id="grad-empty" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f9fafb" />
          <stop offset="100%" stopColor="#f3f4f6" />
        </linearGradient>
        <style>{`
          @keyframes entrance-pulse {
            0%, 100% { r: 8; opacity: 1; }
            50% { r: 11; opacity: 0.6; }
          }
          .entrance-pulse { animation: entrance-pulse 2s ease-in-out infinite; }
        `}</style>
      </defs>

      {/* North arrow */}
      <g transform={`translate(${svgWidth / 2}, 18)`}>
        <polygon points="0,-12 -6,4 6,4" fill="#283171" />
        <text textAnchor="middle" y="-14" fontSize="11" fontWeight="bold" fill="#283171">N</text>
      </g>

      {/* Decorative double-line frame */}
      <rect
        x={gridX - frameGap} y={gridY - frameGap}
        width={gridSize + frameGap * 2} height={gridSize + frameGap * 2}
        rx={12} fill="none" stroke="#6E1126" strokeWidth={1.5} opacity={0.3}
      />
      <rect
        x={gridX - frameGap - 4} y={gridY - frameGap - 4}
        width={gridSize + frameGap * 2 + 8} height={gridSize + frameGap * 2 + 8}
        rx={14} fill="none" stroke="#6E1126" strokeWidth={0.75} opacity={0.15}
      />

      {/* Grid */}
      {DIRECTION_GRID.map((row, ri) =>
        row.map((dir, ci) => {
          const x = gridX + ci * (cellSize + gap);
          const y = gridY + ri * (cellSize + gap);
          const cell = roomGrid[dir];
          const meta = DIR_META[dir];
          const score = cell?.score?.score;
          const scoreColor = score !== undefined ? getScoreColor(score) : '#d1d5db';

          return (
            <g key={dir}>
              <rect
                x={x} y={y} width={cellSize} height={cellSize} rx={8}
                fill={`url(#${gradientId(score)})`}
                stroke={scoreColor} strokeWidth={score !== undefined ? 2 : 1}
              />

              {/* Direction label */}
              <text x={x + 8} y={y + 18} fontSize="12" fontWeight="bold" fill="#6b7280">{dir}</text>

              {/* Deity name */}
              {meta && (
                <text x={x + 8} y={y + 30} fontSize="9" fill="#9ca3af">
                  {meta.deity.split('/')[0].split('(')[0].trim()}
                </text>
              )}

              {/* Element label */}
              {meta && (
                <text x={x + 8} y={y + 41} fontSize="8" fill="#d6d3d1" fontStyle="italic">
                  {meta.element}
                </text>
              )}

              {cell ? (
                <>
                  <text
                    x={x + cellSize / 2} y={y + cellSize / 2 - 4}
                    textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1c1917"
                  >
                    {cell.room.name.length > 14 ? cell.room.name.substring(0, 12) + '..' : cell.room.name}
                  </text>

                  {score !== undefined && (
                    <>
                      <circle cx={x + cellSize / 2} cy={y + cellSize / 2 + 20} r={15} fill={scoreColor} opacity={0.15} />
                      <text
                        x={x + cellSize / 2} y={y + cellSize / 2 + 25}
                        textAnchor="middle" fontSize="15" fontWeight="bold" fill={scoreColor}
                      >
                        {score}
                      </text>
                    </>
                  )}
                </>
              ) : (
                <text x={x + cellSize / 2} y={y + cellSize / 2 + 4} textAnchor="middle" fontSize="10" fill="#d1d5db">
                  —
                </text>
              )}

              {/* Entrance marker */}
              {entrance && entrance.compass_direction === dir && (
                <g transform={`translate(${x + cellSize - 18}, ${y + 12})`}>
                  <circle cx="0" cy="0" r="8" fill="#6E1126" opacity={0.2} className="entrance-pulse" />
                  <circle cx="0" cy="0" r="6" fill="#6E1126" />
                  <text x="0" y="3.5" textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">D</text>
                </g>
              )}
            </g>
          );
        })
      )}

      {/* Legend */}
      <g transform={`translate(${svgWidth / 2}, ${svgHeight - 14})`}>
        <circle cx={-145} cy={0} r={6} fill="#22c55e" />
        <text x={-135} y={4} fontSize="11" fill="#6b7280">80-100</text>
        <circle cx={-55} cy={0} r={6} fill="#f59e0b" />
        <text x={-45} y={4} fontSize="11" fill="#6b7280">50-79</text>
        <circle cx={35} cy={0} r={6} fill="#ef4444" />
        <text x={45} y={4} fontSize="11" fill="#6b7280">0-49</text>
      </g>
    </svg>
  );
}
