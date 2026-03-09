'use client';

import { useId } from 'react';

interface ScrollingBorderProps {
  src: string;
  speed?: number;
  direction?: 'left' | 'right';
}

const COPIES = 6;

export default function ScrollingBorder({
  src,
  speed = 30,
  direction = 'left',
}: ScrollingBorderProps) {
  const id = useId();
  const keyframeName = `marquee-${id.replace(/:/g, '')}`;
  // Each copy is 1/COPIES of total width. Scroll by one copy = 100/COPIES %
  const translatePercent = 100 / COPIES;

  return (
    <>
      <style>{`
        @keyframes ${keyframeName} {
          0% { transform: translateX(0); }
          100% { transform: translateX(-${translatePercent}%); }
        }
      `}</style>
      <div style={{ overflow: 'hidden', width: '100%' }}>
        <div
          style={{
            display: 'flex',
            width: 'fit-content',
            willChange: 'transform',
            animation: `${keyframeName} ${speed}s linear infinite`,
            animationDirection: direction === 'right' ? 'reverse' : 'normal',
          }}
        >
          {Array.from({ length: COPIES }).map((_, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt=""
              style={{
                height: '2.5rem',
                width: 'auto',
                display: 'block',
                flexShrink: 0,
                margin: 0,
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
