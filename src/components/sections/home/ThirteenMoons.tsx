'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { moonPath, formatMoonDate } from '@/lib/moon';
import { moons, moonStateAt, garmentsPerMoon, moonName, type MoonState } from '@/data/moons';
import { collectionById } from '@/data/collections';

/**
 * The thirteen releases of the year, as a rail you can push.
 *
 * Each card is a link into the collection that moon left behind, and the count
 * under it is the number of garments that actually carry that release date —
 * counted from the catalogue, not typed. What is gone stays gone: there is no
 * "back in stock" here, because reprinting to create pressure is the thing this
 * brand says it will not do.
 */
export function ThirteenMoons() {
  const t = useTranslations('moons');
  const locale = useLocale() as 'it' | 'en';
  const railRef = useRef<HTMLDivElement>(null);

  /* which moon is live depends on the clock, so it is decided after mount */
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);

  function step(dir: number) {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.querySelector('.moon');
    const w = card ? card.getBoundingClientRect().width + 16 : 250;
    const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    rail.scrollBy({ left: dir * w * 2, behavior: smooth ? 'smooth' : 'auto' });
  }

  const stateLabel: Record<MoonState, string> = {
    past: t('past'), live: t('live'), next: t('next'),
  };

  return (
    <section className="sec" id="lune" aria-labelledby="luneT">
      <div className="wrap">
        <div className="sechead rise">
          <p className="eyebrow">{t('eyebrow')}</p>
          <h2 id="luneT">{t('heading')}</h2>
          <p className="lede">{t('lede')}</p>
        </div>

        <div
          className="rail13"
          ref={railRef}
          tabIndex={0}
          role="group"
          aria-labelledby="luneT"
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
          }}
        >
          {moons.map((m, i) => {
            const state: MoonState | null = now === null ? null : moonStateAt(m, now);
            const n = garmentsPerMoon[m.numeral] ?? 0;
            const collection = collectionById[m.collection];
            return (
              <Link
                className={`moon${state === 'live' ? ' moon--live' : ''}`}
                href={`/collezioni/${m.collection}`}
                key={m.numeral}
              >
                <svg className="moon__d" viewBox="0 0 40 40" aria-hidden="true">
                  <circle cx="20" cy="20" r="15" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4" />
                  <path d={moonPath(20, 20, 15, (i + 1) / 14)} fill="currentColor" opacity="0.9" />
                </svg>
                <span className="moon__n">{m.numeral} / XIII</span>
                <span className="moon__t">{moonName(m, locale).toUpperCase()}</span>
                <span className="moon__dt">{formatMoonDate(m.at, locale)}</span>
                <span className="eyebrow">
                  {collection.name[locale].toUpperCase()} · {t('garments', { n })}
                </span>
                {/* the state is empty until the clock has been read, and the row
                    keeps its height either way so the rail never jumps */}
                <span className={`state state--${state ?? 'past'}`}>
                  {state ? stateLabel[state] : ' '}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="railnav">
          <button type="button" onClick={() => step(-1)} aria-label={t('prev')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <button type="button" onClick={() => step(1)} aria-label={t('next2')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" aria-hidden="true">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}

export default ThirteenMoons;
