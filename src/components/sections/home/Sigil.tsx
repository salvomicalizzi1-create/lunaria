import type { CSSProperties } from 'react';
import { moonPath } from '@/lib/moon';
import type { CollectionId } from '@/types/product';

/** roughly each path's length, which is all the draw-on transition needs */
const len = (n: number) => ({ '--len': n }) as CSSProperties;

/**
 * One mark per collection, drawn rather than set in a symbol font: a glyph
 * pulled from a typeface carries whatever that designer meant by it, and the
 * whole point of this brand is that every mark has a stated source.
 */
export function Sigil({ id }: { id: CollectionId }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.25,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  if (id === 'fasi') {
    /* the eight phases in a row, so this one gets a strip viewBox of its own */
    return (
      <svg className="sigil sigil--strip draw" viewBox="0 0 100 16" {...common}>
        {Array.from({ length: 8 }, (_, i) => {
          const cx = Number((6.5 + i * 12.4).toFixed(1));
          return (
            <g key={i}>
              <circle cx={cx} cy="8" r="5.6" style={len(36)} />
              <path d={moonPath(cx, 8, 5.6, i / 8)} fill="currentColor" stroke="none" opacity="0.88" />
            </g>
          );
        })}
      </svg>
    );
  }

  if (id === 'arcani') {
    return (
      <svg className="sigil draw" viewBox="0 0 100 100" {...common}>
        <path d="M22 80 L22 44 A28 28 0 0 1 78 44 L78 80" style={len(170)} />
        <path d="M36 52 L44 68 M44 52 L36 68" style={len(44)} />
        <path d="M50 52 L54 68 L58 52" style={len(40)} />
        <path d="M64 52 L64 68" style={len(18)} />
        <path d="M70 52 L70 68" style={len(18)} />
      </svg>
    );
  }

  if (id === 'erbario') {
    return (
      <svg className="sigil draw" viewBox="0 0 100 100" {...common}>
        <path d="M50 88 C50 66 50 44 50 20" style={len(70)} />
        <path d="M50 66 C34 64 26 54 28 42 C42 42 50 52 50 66Z" style={len(80)} />
        <path d="M50 50 C66 48 74 38 72 26 C58 26 50 36 50 50Z" style={len(80)} />
        <path d="M50 34 C38 32 32 24 34 14 C45 14 50 23 50 34Z" style={len(66)} />
      </svg>
    );
  }

  if (id === 'carta-del-cielo') {
    const spokes = Array.from({ length: 12 }, (_, h) => {
      const a = (h * 30 * Math.PI) / 180;
      return (
        `M${(50 + 11 * Math.cos(a)).toFixed(1)} ${(50 + 11 * Math.sin(a)).toFixed(1)}` +
        `L${(50 + 34 * Math.cos(a)).toFixed(1)} ${(50 + 34 * Math.sin(a)).toFixed(1)} `
      );
    }).join('');
    return (
      <svg className="sigil draw" viewBox="0 0 100 100" {...common}>
        <circle cx="50" cy="50" r="34" style={len(216)} />
        <circle cx="50" cy="50" r="11" style={len(70)} />
        <path d={spokes} opacity="0.75" style={len(290)} />
      </svg>
    );
  }

  /* sale e ferro: a key, and the line of salt drawn across it */
  return (
    <svg className="sigil draw" viewBox="0 0 100 100" {...common}>
      <circle cx="36" cy="34" r="10" style={len(64)} />
      <path d="M43 41 L72 70" style={len(42)} />
      <path d="M64 62 L58 68 M70 68 L64 74" style={len(24)} />
      <path d="M18 74 L84 30" strokeDasharray="1 6" opacity="0.85" style={len(0)} />
    </svg>
  );
}

export default Sigil;
