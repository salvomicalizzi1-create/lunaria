'use client';

import { useEffect, useState } from 'react';
import { moonNow, moonPath } from '@/lib/moon';

/**
 * The brand mark is the moon as it is tonight, not a logo of a moon.
 *
 * It starts as the plain disc the server can safely draw, and the terminator
 * moves into its real position once the browser has read the clock. Anyone who
 * looks at the mark twice a fortnight apart will see it has changed, which is
 * the entire promise of the brand stated in twenty-two pixels.
 */
export function MoonMark() {
  const [d, setD] = useState<string | null>(null);
  useEffect(() => setD(moonPath(16, 16, 12.5, moonNow().f)), []);

  return (
    <svg width="20" height="20" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="12.5" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.45" />
      <path d={d ?? 'M16 3.5 A12.5 12.5 0 0 1 16 28.5 A8 12.5 0 0 0 16 3.5 Z'} fill="currentColor" />
    </svg>
  );
}

export default MoonMark;
