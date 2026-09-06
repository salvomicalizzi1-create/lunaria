'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { moonNow, moonPath, terminatorPath, phaseName, formatMoonDate, type MoonState } from '@/lib/moon';
import { nextMoonAt, moonName } from '@/data/moons';

/** Forty-eight marks: one for every half hour of the lunar day. */
const TICKS = Array.from({ length: 48 }, (_, i) => {
  const a = (i * 7.5 * Math.PI) / 180;
  const r0 = i % 4 === 0 ? 82 : 86;
  return {
    x1: (100 + r0 * Math.cos(a)).toFixed(1),
    y1: (100 + r0 * Math.sin(a)).toFixed(1),
    x2: (100 + 88 * Math.cos(a)).toFixed(1),
    y2: (100 + 88 * Math.sin(a)).toFixed(1),
  };
});

/**
 * The instrument: the moon as it is at this second, drawn from the Meeus
 * calculation and not from a picture. Everything on this panel is measured.
 *
 * It renders empty on the server and fills in after mount. The alternative is to
 * send the server's idea of "now", which is a different second and often a
 * different day from the reader's, and React would call that a hydration error.
 */
export function MoonInstrument() {
  const t = useTranslations('instrument');
  const locale = useLocale() as 'it' | 'en';
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    // the readout is a clock: it would be a lie if it froze at the first paint
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const m: MoonState | null = useMemo(() => (now ? moonNow(now) : null), [now]);
  const drop = now ? nextMoonAt(now.getTime()) : null;

  const fill = m ? moonPath(100, 100, 78, m.f) : '';
  const term = m ? terminatorPath(100, 100, 78, m.f) : '';

  const cycleLength = (() => {
    if (!m) return '—';
    const total = Math.round(m.cycle / 60000);
    return `${Math.floor(total / 1440)}${t('dayShort')} ${Math.floor((total % 1440) / 60)} h ${total % 60} min`;
  })();

  const rows: [string, string, boolean][] = [
    [t('phase'), m ? phaseName(m.f, locale) : '—', false],
    [t('illuminated'), m ? `${(m.illum * 100).toFixed(1)} %` : '—', false],
    [t('age'), m ? `${m.ageDays.toFixed(2)} ${t('days')}` : '—', false],
    [t('cycleLength'), cycleLength, false],
    [t('nextNewMoon'), m ? formatMoonDate(m.next, locale) : '—', false],
    [
      t('nextRelease'),
      drop ? `${moonName(drop, locale).toUpperCase()} · ${drop.numeral} / XIII` : t('yearClosed'),
      true,
    ],
    [t('remaining'), m ? `${m.daysToNext.toFixed(2)} ${t('days')}` : '—', true],
  ];

  return (
    <section className="sec" id="luna" aria-labelledby="lunaT">
      <div className="wrap">
        <div className="instr">
          <div className="dial rise">
            <div className="dial__glow" />
            <svg viewBox="0 0 200 200" role="img" aria-labelledby="dialT">
              <title id="dialT">{t('dialTitle')}</title>
              <circle cx="100" cy="100" r="78" fill="none" stroke="var(--rule)" strokeWidth="1" />
              <circle cx="100" cy="100" r="88" fill="none" stroke="var(--rule)" strokeWidth="1" opacity="0.5" />
              <g stroke="var(--rule)" strokeWidth="1" opacity="0.8">
                {TICKS.map((k, i) => <line key={i} x1={k.x1} y1={k.y1} x2={k.x2} y2={k.y2} />)}
              </g>
              {/* the lit face is bone, always: there is one ground on this page */}
              <path d={fill} fill="var(--color-moonlight2)" opacity="0.92" />
              <circle cx="100" cy="100" r="78" fill="none" stroke="var(--accent)" strokeWidth="1" opacity="0.55" />
              {/* the terminator is stroked separately on purpose: at a nearly full
                  moon the boundary sits on the rim, and the filled shape alone
                  would hide the one idea the brand is built on */}
              <path d={term} fill="none" stroke="var(--accent)" strokeWidth="8" opacity="0.16" />
              <path d={term} fill="none" stroke="var(--accent)" strokeWidth="2" opacity="0.95" />
            </svg>
          </div>

          <div className="rise stack">
            <p className="eyebrow">{t('eyebrow')}</p>
            <h2 id="lunaT">{t('heading')}</h2>
            <p className="lede">{t('lede')}</p>
            <div className="readout" aria-live="polite">
              {rows.map(([k, v, hi]) => (
                <div key={k}>
                  <span className="k">{k}</span>
                  <span className={hi ? 'v hi' : 'v'}>{v}</span>
                </div>
              ))}
            </div>
            {drop && (
              <Link className="btn btn--ghost" href={`/collezioni/${drop.collection}`}>
                {t('seeCollection')}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default MoonInstrument;
