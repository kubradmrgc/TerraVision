import type { CSSProperties } from 'react';

/** Dekoratif peyzaj, kaktüs ve bitki animasyonları (tüm site arka planı). */
export function PlantScenery() {
  return (
    <div className="tv-scenery" aria-hidden="true">
      <div className="tv-scenery-glow tv-scenery-glow--left" />
      <div className="tv-scenery-glow tv-scenery-glow--right" />

      <ul className="tv-scenery-leaves">
        {LEAF_POSITIONS.map((leaf) => (
          <li
            key={leaf.id}
            className="tv-scenery-leaf"
            style={
              {
                left: leaf.left,
                top: leaf.top,
                animationDelay: leaf.delay,
                animationDuration: leaf.duration
              } as CSSProperties
            }
          >
            <span className="tv-scenery-leaf-shape" />
          </li>
        ))}
      </ul>

      <svg className="tv-scenery-hills" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path
          className="tv-scenery-hill tv-scenery-hill--back"
          d="M0,220 C240,160 480,260 720,200 C960,140 1200,240 1440,180 L1440,320 L0,320 Z"
        />
        <path
          className="tv-scenery-hill tv-scenery-hill--mid"
          d="M0,260 C320,200 520,300 800,240 C1080,180 1280,280 1440,250 L1440,320 L0,320 Z"
        />
        <path
          className="tv-scenery-hill tv-scenery-hill--front"
          d="M0,290 C200,250 400,310 640,270 C880,230 1120,300 1440,280 L1440,320 L0,320 Z"
        />
      </svg>

      <div className="tv-scenery-plants">
        <Cactus className="tv-scenery-cactus tv-scenery-cactus--1" variant="tall" />
        <Cactus className="tv-scenery-cactus tv-scenery-cactus--2" variant="round" />
        <Cactus className="tv-scenery-cactus tv-scenery-cactus--3" variant="prickly" />
        <Cactus className="tv-scenery-cactus tv-scenery-cactus--4" variant="mini" />
        <Shrub className="tv-scenery-shrub tv-scenery-shrub--1" />
        <Shrub className="tv-scenery-shrub tv-scenery-shrub--2" />
      </div>
    </div>
  );
}

const LEAF_POSITIONS = [
  { id: 'a', left: '8%', top: '18%', delay: '0s', duration: '14s' },
  { id: 'b', left: '22%', top: '42%', delay: '2s', duration: '16s' },
  { id: 'c', left: '68%', top: '12%', delay: '1s', duration: '13s' },
  { id: 'd', left: '82%', top: '28%', delay: '3s', duration: '15s' },
  { id: 'e', left: '54%', top: '8%', delay: '4s', duration: '17s' },
  { id: 'f', left: '91%', top: '48%', delay: '1.5s', duration: '12s' }
] as const;

function Cactus({
  className,
  variant
}: {
  className: string;
  variant: 'tall' | 'round' | 'prickly' | 'mini';
}) {
  if (variant === 'tall') {
    return (
      <svg className={className} viewBox="0 0 64 120" width="64" height="120">
        <ellipse cx="32" cy="108" rx="22" ry="8" fill="var(--tv-scenery-shadow)" opacity="0.35" />
        <path
          d="M28 108 V42 Q28 28 32 28 Q36 28 36 42 V108"
          fill="var(--tv-cactus-base)"
        />
        <path
          d="M36 62 H48 Q56 62 56 52 Q56 42 48 42 H40 V58 H48 Q52 58 52 52 Q52 46 48 46 H40"
          fill="var(--tv-cactus-arm)"
        />
        <path d="M30 38 L34 32 L38 38" fill="var(--tv-cactus-tip)" opacity="0.7" />
      </svg>
    );
  }
  if (variant === 'round') {
    return (
      <svg className={className} viewBox="0 0 80 100" width="80" height="100">
        <ellipse cx="40" cy="92" rx="28" ry="7" fill="var(--tv-scenery-shadow)" opacity="0.35" />
        <ellipse cx="40" cy="58" rx="26" ry="34" fill="var(--tv-cactus-base)" />
        <ellipse cx="34" cy="50" rx="6" ry="10" fill="var(--tv-cactus-highlight)" opacity="0.45" />
        <path d="M36 30 L40 22 L44 30" fill="var(--tv-cactus-tip)" />
      </svg>
    );
  }
  if (variant === 'prickly') {
    return (
      <svg className={className} viewBox="0 0 56 96" width="56" height="96">
        <ellipse cx="28" cy="88" rx="18" ry="6" fill="var(--tv-scenery-shadow)" opacity="0.35" />
        <path
          d="M24 88 V36 Q24 24 28 24 Q32 24 32 36 V88"
          fill="var(--tv-cactus-alt)"
        />
        <path d="M26 48 H18 V56 H26 M30 40 H38 V48 H30" fill="var(--tv-cactus-arm)" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 40 56" width="40" height="56">
      <ellipse cx="20" cy="50" rx="14" ry="5" fill="var(--tv-scenery-shadow)" opacity="0.3" />
      <ellipse cx="20" cy="32" rx="12" ry="18" fill="var(--tv-cactus-mini)" />
    </svg>
  );
}

function Shrub({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 72 48" width="72" height="48">
      <ellipse cx="36" cy="42" rx="30" ry="6" fill="var(--tv-scenery-shadow)" opacity="0.25" />
      <circle cx="22" cy="28" r="14" fill="var(--tv-shrub)" />
      <circle cx="36" cy="22" r="16" fill="var(--tv-shrub-deep)" />
      <circle cx="50" cy="28" r="13" fill="var(--tv-shrub)" />
    </svg>
  );
}
