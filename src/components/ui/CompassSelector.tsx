'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCw } from 'lucide-react';

const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
const SNAP_ANGLES: Record<string, number> = {
  N: 0, NE: 315, E: 270, SE: 225, S: 180, SW: 135, W: 90, NW: 45,
};

const TICK_MARKS = DIRECTIONS.map((dir, i) => {
  const angle = i * 45;
  const rad = (angle * Math.PI) / 180;
  return {
    dir,
    x1: 100 + 92 * Math.sin(rad), y1: 100 - 92 * Math.cos(rad),
    x2: 100 + 98 * Math.sin(rad), y2: 100 - 98 * Math.cos(rad),
    isCardinal: i % 2 === 0,
  };
});

function rotationToDirection(rotation: number): string {
  const normalized = ((rotation % 360) + 360) % 360;
  const index = Math.round(normalized / 45) % 8;
  return DIRECTIONS[index === 0 ? 0 : 8 - index];
}

function directionToRotation(dir: string): number {
  return SNAP_ANGLES[dir] ?? 0;
}

interface CompassSelectorProps {
  value: string;
  onChange: (dir: string) => void;
  imageFile?: File | null;
}

export default function CompassSelector({ value, onChange, imageFile }: CompassSelectorProps) {
  const { t } = useTranslation();
  const [preview, setPreview] = useState<string | null>(null);
  const [rotation, setRotation] = useState(value ? directionToRotation(value) : 0);
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  const dialRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const startAngleRef = useRef(0);
  const startRotationRef = useRef(0);
  const rotationRef = useRef(rotation);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!imageFile) { setPreview(null); return; }
    if (imageFile.type === 'application/pdf') { setPreview(null); return; }
    const url = URL.createObjectURL(imageFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  // Auto-set direction to N on first mount if no value set yet
  // (rotation=0 means North is at top, which is the default)
  useEffect(() => {
    if (imageFile && !value) {
      onChange(rotationToDirection(rotation));
    }
  }, [imageFile]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyRotation = useCallback((deg: number) => {
    rotationRef.current = deg;
    if (imageRef.current) imageRef.current.style.transform = `rotate(${deg}deg) scale(${scale})`;
    if (thumbRef.current) thumbRef.current.style.left = `${(deg / 360) * 100}%`;
    if (fillRef.current) fillRef.current.style.width = `${(deg / 360) * 100}%`;
  }, [scale]);

  const getAngle = useCallback((clientX: number, clientY: number) => {
    if (!dialRef.current) return 0;
    const rect = dialRef.current.getBoundingClientRect();
    return (Math.atan2(clientX - (rect.left + rect.width / 2), -(clientY - (rect.top + rect.height / 2))) * 180) / Math.PI;
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    startAngleRef.current = getAngle(e.clientX, e.clientY);
    startRotationRef.current = rotationRef.current;
  }, [getAngle]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const delta = getAngle(e.clientX, e.clientY) - startAngleRef.current;
    applyRotation(((startRotationRef.current + delta) % 360 + 360) % 360);
  }, [isDragging, getAngle, applyRotation]);

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    const snapped = Math.round(rotationRef.current / 45) * 45;
    setRotation(snapped);
    rotationRef.current = snapped;
    onChangeRef.current(rotationToDirection(snapped));
  }, [isDragging]);

  const handleSliderInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    applyRotation(Number(e.target.value));
  }, [applyRotation]);

  const handleSliderRelease = useCallback(() => {
    const snapped = Math.round(rotationRef.current / 45) * 45;
    setRotation(snapped);
    rotationRef.current = snapped;
    onChangeRef.current(rotationToDirection(snapped));
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale(prev => Math.min(3, Math.max(0.5, prev - e.deltaY * 0.002)));
  }, []);

  const handleQuickSelect = useCallback((dir: string) => {
    const rot = directionToRotation(dir);
    setRotation(rot);
    rotationRef.current = rot;
    onChange(dir);
  }, [onChange]);

  const handleReset = useCallback(() => {
    setRotation(0);
    setScale(1);
    rotationRef.current = 0;
    onChange(rotationToDirection(0));
  }, [onChange]);

  useEffect(() => { rotationRef.current = rotation; }, [rotation]);

  const currentDir = value || rotationToDirection(rotation);
  const pct = (rotation / 360) * 100;

  return (
    <div className="w-full bg-white rounded-xl border border-stone-200 overflow-hidden">
      {/* Header */}
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-stone-100">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-stone-800">Set North Direction</p>
            <p className="text-[10px] sm:text-[11px] text-stone-400 mt-0.5 truncate">
              Drag image, use slider, or tap a direction
            </p>
          </div>
          {value && (
            <span className="text-xs font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-1 rounded-md flex-shrink-0">
              {currentDir}
            </span>
          )}
        </div>
      </div>

      {/* Image dial */}
      <div className="relative bg-stone-50 px-3 sm:px-4 pt-3 sm:pt-4 pb-4 sm:pb-5 overflow-hidden">
        {/* N indicator */}
        <div className="flex justify-center mb-2 sm:mb-3 relative z-10">
          <div className="flex items-center gap-1 bg-[var(--primary)] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
            <svg width="8" height="8" viewBox="0 0 8 8"><polygon points="4,0 1,8 7,8" fill="currentColor" /></svg>
            N
          </div>
        </div>

        {/* Circular dial — responsive: smaller on mobile */}
        <div className="relative w-[220px] sm:w-[280px] mx-auto">
          <div
            ref={dialRef}
            className={`relative w-full aspect-square rounded-full bg-white border-2 shadow-sm overflow-hidden flex items-center justify-center select-none will-change-transform ${
              isDragging ? 'border-[var(--primary)] cursor-grabbing touch-none' : 'border-stone-200 cursor-grab'
            }`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
          >
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 200">
              {TICK_MARKS.map(({ dir, x1, y1, x2, y2, isCardinal }) => (
                <line key={dir} x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={isCardinal ? '#6E1126' : '#d6d3d1'} strokeWidth={isCardinal ? 2 : 1} opacity={0.5} />
              ))}
            </svg>

            <div
              ref={imageRef}
              className="w-[82%] h-[82%] origin-center flex items-center justify-center will-change-transform"
              style={{ transform: `rotate(${rotation}deg) scale(${scale})` }}
            >
              {preview ? (
                <img src={preview} alt="Floor plan" className="w-full h-full object-contain pointer-events-none" draggable={false} />
              ) : (
                <span className="text-xs sm:text-sm text-stone-400">
                  {imageFile?.type === 'application/pdf' ? 'PDF uploaded' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Indicators */}
          {(rotation !== 0 || scale !== 1) && (
            <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 flex gap-1 z-10">
              {scale !== 1 && (
                <span className="bg-black/60 text-white text-[9px] sm:text-[10px] font-medium px-1.5 py-0.5 rounded-full">{Math.round(scale * 100)}%</span>
              )}
              {rotation !== 0 && (
                <span className="bg-black/60 text-white text-[9px] sm:text-[10px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <RotateCw className="w-2.5 h-2.5 sm:w-3 sm:h-3" />{Math.round(rotation)}°
                </span>
              )}
            </div>
          )}
        </div>

        {!isDragging && rotation === 0 && preview && (
          <p className="text-[10px] text-stone-400 text-center mt-2">Click and drag to rotate</p>
        )}
      </div>

      {/* Controls */}
      <div className="px-3 sm:px-4 py-3 sm:py-4 space-y-3 sm:space-y-4">
        {/* Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-[11px] font-medium text-stone-400 uppercase tracking-wide">Rotation</span>
            <button
              onClick={handleReset}
              className="text-[10px] sm:text-[11px] text-stone-400 hover:text-[var(--primary)] px-2 py-1 rounded hover:bg-stone-50 min-h-[32px] sm:min-h-0 flex items-center"
            >
              Reset
            </button>
          </div>
          <div className="relative h-10 sm:h-8 flex items-center">
            <div className="absolute left-0 right-0 h-1.5 sm:h-1 bg-stone-200 rounded-full" />
            <div ref={fillRef} className="absolute left-0 h-1.5 sm:h-1 bg-[var(--primary)] rounded-full" style={{ width: `${pct}%` }} />
            <div ref={thumbRef} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none z-10" style={{ left: `${pct}%` }}>
              <div className="w-5 h-5 sm:w-4 sm:h-4 rounded-full bg-[var(--primary)] border-2 border-white shadow" />
            </div>
            <input
              type="range" min="0" max="360" step="1" value={rotation}
              onChange={handleSliderInput}
              onMouseUp={handleSliderRelease}
              onTouchEnd={handleSliderRelease}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer touch-pan-x z-20"
            />
          </div>
        </div>

        {/* Direction pills */}
        <div className="flex items-center gap-1.5 sm:gap-1 justify-center flex-wrap">
          {DIRECTIONS.map((dir) => (
            <button
              key={dir}
              onClick={() => handleQuickSelect(dir)}
              className={`px-3 sm:px-3 py-2 sm:py-1.5 rounded-full text-xs font-semibold min-h-[44px] sm:min-h-[32px] ${
                currentDir === dir
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-stone-100 text-stone-500 active:bg-stone-200'
              }`}
            >
              {dir}
            </button>
          ))}
        </div>

        {/* Confirmation */}
        {value && (
          <div className="flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <p className="text-xs text-stone-500">
              Main door faces <span className="font-semibold text-stone-700">{t(`directions.${currentDir}`)}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
