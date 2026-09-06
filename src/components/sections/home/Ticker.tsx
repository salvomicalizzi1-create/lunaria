'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from '@/lib/i18n/navigation';
import { moonNow } from '@/lib/moon';
import { liveMoonAt, moonName } from '@/data/moons';

/**
 * The strip above the header. It carries three claims that are always true and
 * three measurements that are only true right now, and the measurements are
 * added after mount: the sky at the moment of the build is not the sky at the
 * moment of reading.
 *
 * It stops on hover and on focus, because a moving line of text is unreadable
 * to anyone trying to actually read it.
 */
export function Ticker() {
  const t = useTranslations('ticker');
  const locale = useLocale() as 'it' | 'en';
  const pathname = usePathname();
  const [live, setLive] = useState<string[]>([]);

  /* It lives in the layout so it can sit above the header, where it belongs
     visually, and it takes itself off every page but the homepage. */
  const onHome = pathname === '/';

  useEffect(() => {
    if (!onHome) return;
    const m = moonNow();
    const drop = liveMoonAt(Date.now());
    setLive([
      t('illuminated', { pct: (m.illum * 100).toFixed(0) }),
      t('nextIn', { days: m.daysToNext.toFixed(1) }),
      t('liveRelease', { moon: moonName(drop, locale).toUpperCase() }),
    ]);
  }, [t, locale, onHome]);

  if (!onHome) return null;

  const items = [t('payoff'), ...live, t('shipping'), t('returns')];
  const set = (
    <div className="ticker__set">
      {items.map((text, i) => (
        <span className="ticker__i" key={i}>{text}</span>
      ))}
    </div>
  );

  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker__track">
        {set}
        {/* the second copy is what makes the loop seamless: the track slides
            exactly -50% and lands on an identical frame */}
        {set}
      </div>
    </div>
  );
}

export default Ticker;
