import { products } from './products';
import type { Locale } from '@/lib/i18n/routing';
import rawMoons from './moons.json';

/**
 * The thirteen moons of the year. Every `at` is a real new moon instant in UTC,
 * cross-checked against the Meeus calculation in @/lib/moon — the table is here
 * because a release is an editorial decision with a name, and the algorithm only
 * supplies the timing.
 *
 * `collection` is the collection the release belongs to, so a moon in the rail
 * is a link into the catalogue and not a caption. `at`'s date half also matches
 * the `releasedOn` of the garments that moon left, which is how the count under
 * each card is derived rather than typed.
 */
export type Moon = {
  numeral: string;
  name: { it: string; en: string };
  at: string;
  collection: string;
};

/* La tabella sta in moons.json, così nomi e date si cambiano dal pannello. */
export const moons: Moon[] = rawMoons as Moon[];

export type MoonState = 'past' | 'live' | 'next';

/** How many garments a given moon actually left behind. */
export const garmentsPerMoon: Record<string, number> = Object.fromEntries(
  moons.map((m) => [
    m.numeral,
    products.filter((p) => p.releasedOn === m.at.slice(0, 10)).length,
  ]),
);

export function moonStateAt(moon: Moon, now: number): MoonState {
  const t = new Date(moon.at).getTime();
  if (t > now) return 'next';
  const past = moons.map((m) => new Date(m.at).getTime()).filter((x) => x <= now);
  return t === Math.max(...past) ? 'live' : 'past';
}

/** The release that is out right now: the most recent moon that has passed. */
export function liveMoonAt(now: number): Moon {
  for (let i = moons.length - 1; i >= 0; i--) {
    if (new Date(moons[i].at).getTime() <= now) return moons[i];
  }
  return moons[0];
}

/** The release that has not happened yet, or null once the year is closed. */
export function nextMoonAt(now: number): Moon | null {
  for (const m of moons) {
    if (new Date(m.at).getTime() > now) return m;
  }
  return null;
}

export const moonName = (m: Moon, locale: Locale) => m.name[locale === 'en' ? 'en' : 'it'];
