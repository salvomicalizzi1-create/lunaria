/**
 * The moon, computed here and nowhere else.
 *
 * Meeus, Astronomical Algorithms, chapter 49: the instant of every new moon,
 * to about a minute. No network call, no third-party ephemeris, no data leaving
 * the device. Everything the brand claims about the sky is calculated from this
 * one file, so the site can never show a moon that disagrees with the sky.
 */

const RAD = Math.PI / 180;
const sin = (deg: number) => Math.sin(deg * RAD);

/** Julian Ephemeris Day of the k-th new moon after 2000 January 6. */
function newMoonJDE(k: number): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const T4 = T3 * T;

  let J =
    2451550.09766 + 29.530588861 * k + 0.00015437 * T2 - 0.00000015 * T3 + 0.00000000073 * T4;

  const E = 1 - 0.002516 * T - 0.0000074 * T2;
  const M = 2.5534 + 29.1053567 * k - 0.0000014 * T2 - 0.00000011 * T3;
  const M1 = 201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3 - 0.000000058 * T4;
  const F = 160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.000000011 * T4;
  const O = 124.7746 - 1.56375588 * k + 0.0020672 * T2 + 0.00000215 * T3;

  J +=
    -0.4072 * sin(M1) + 0.17241 * E * sin(M) + 0.01608 * sin(2 * M1) + 0.01039 * sin(2 * F) +
    0.00739 * E * sin(M1 - M) - 0.00514 * E * sin(M1 + M) + 0.00208 * E * E * sin(2 * M) -
    0.00111 * sin(M1 - 2 * F) - 0.00057 * sin(M1 + 2 * F) + 0.00056 * E * sin(2 * M1 + M) -
    0.00042 * sin(3 * M1) + 0.00042 * E * sin(M + 2 * F) + 0.00038 * E * sin(M - 2 * F) -
    0.00024 * E * sin(2 * M1 - M) - 0.00017 * sin(O) - 0.00007 * sin(M1 + 2 * M) +
    0.00004 * sin(2 * M1 - 2 * F) + 0.00004 * sin(3 * M) + 0.00003 * sin(M1 + M - 2 * F) +
    0.00003 * sin(2 * M1 + 2 * F) - 0.00003 * sin(M1 + M + 2 * F) + 0.00003 * sin(M1 - M + 2 * F) -
    0.00002 * sin(M1 - M - 2 * F) - 0.00002 * sin(3 * M1 + M) + 0.00002 * sin(4 * M1);

  J +=
    0.000325 * sin(299.77 + 0.107408 * k - 0.009173 * T2) +
    0.000165 * sin(251.88 + 0.016321 * k) + 0.000164 * sin(251.83 + 26.651886 * k) +
    0.000126 * sin(349.42 + 36.412478 * k) + 0.00011 * sin(84.66 + 18.206239 * k) +
    0.000062 * sin(141.74 + 53.303771 * k) + 0.00006 * sin(207.14 + 2.453732 * k) +
    0.000056 * sin(154.84 + 7.30686 * k) + 0.000047 * sin(34.52 + 27.261239 * k) +
    0.000042 * sin(207.19 + 0.121824 * k) + 0.00004 * sin(291.34 + 1.844379 * k) +
    0.000037 * sin(161.72 + 24.198154 * k) + 0.000035 * sin(239.56 + 25.513099 * k) +
    0.000023 * sin(331.55 + 3.592518 * k);

  return J;
}

const jdeToMs = (j: number) => (j - 2440587.5) * 86400000 - 70000;
const newMoonAt = (k: number) => new Date(jdeToMs(newMoonJDE(k)));

/** A rough k for a date; moonNow then walks to the pair that actually brackets it. */
function kFor(date: Date): number {
  const y = date.getUTCFullYear() + (date.getUTCMonth() + date.getUTCDate() / 30) / 12;
  return Math.floor((y - 2000) * 12.3685);
}

export type MoonState = {
  k: number;
  prev: Date;
  next: Date;
  /** length of the cycle you are inside, in milliseconds */
  cycle: number;
  ageDays: number;
  /** 0 at new moon, 0.5 at full, 1 at the next new moon */
  f: number;
  illum: number;
  waxing: boolean;
  daysToNext: number;
};

export function moonNow(now: Date = new Date()): MoonState {
  let k = kFor(now);
  let prev: Date | undefined;
  let next: Date | undefined;

  for (let i = k - 2; i < k + 3; i++) {
    const a = newMoonAt(i);
    const b = newMoonAt(i + 1);
    if (a <= now && now < b) {
      prev = a;
      next = b;
      k = i;
      break;
    }
  }
  if (!prev || !next) {
    prev = newMoonAt(k);
    next = newMoonAt(k + 1);
  }

  const cycle = next.getTime() - prev.getTime();
  const age = now.getTime() - prev.getTime();
  const f = age / cycle;

  return {
    k, prev, next, cycle,
    ageDays: age / 86400000,
    f,
    illum: (1 - Math.cos(2 * Math.PI * f)) / 2,
    waxing: f < 0.5,
    daysToNext: (next.getTime() - now.getTime()) / 86400000,
  };
}

/** The lit face: a half circle plus a half ellipse, filled. */
export function moonPath(cx: number, cy: number, r: number, f: number): string {
  const c = Math.cos(2 * Math.PI * f);
  const rx = Math.abs(r * c);
  const waxing = f < 0.5;
  const sweepOuter = waxing ? 1 : 0;
  const sweepTerm = waxing ? (c > 0 ? 0 : 1) : (c > 0 ? 1 : 0);
  return (
    `M${cx} ${cy - r} A${r} ${r} 0 0 ${sweepOuter} ${cx} ${cy + r}` +
    ` A${rx.toFixed(2)} ${r} 0 0 ${sweepTerm} ${cx} ${cy - r} Z`
  );
}

/**
 * Just the dividing line. Drawn on purpose and separately: at a nearly full moon
 * the boundary sits on the rim, and the filled shape alone would hide the one
 * idea the whole brand is built on.
 */
export function terminatorPath(cx: number, cy: number, r: number, f: number): string {
  const c = Math.cos(2 * Math.PI * f);
  const rx = Math.abs(r * c);
  const waxing = f < 0.5;
  const sweep = waxing ? (c > 0 ? 0 : 1) : (c > 0 ? 1 : 0);
  return `M${cx} ${cy + r} A${rx.toFixed(2)} ${r} 0 0 ${sweep} ${cx} ${cy - r}`;
}

const PHASE_NAMES = {
  it: ['Luna nuova', 'Falce crescente', 'Primo quarto', 'Gibbosa crescente',
       'Luna piena', 'Gibbosa calante', 'Ultimo quarto', 'Falce calante'],
  en: ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous',
       'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'],
} as const;

export function phaseName(f: number, locale: 'it' | 'en'): string {
  return PHASE_NAMES[locale][Math.floor(((f + 0.0625) % 1) * 8)];
}

const MONTHS_SHORT = {
  it: ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
} as const;

export const MONTHS_LONG = {
  it: ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
       'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June',
       'July', 'August', 'September', 'October', 'November', 'December'],
} as const;

/** Every instant is shown in UTC, and says so: a new moon is one moment for
 *  everybody, and a local rendering would make two readers disagree. */
export function formatMoonDate(iso: string | Date, locale: 'it' | 'en'): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const hh = `0${d.getUTCHours()}`.slice(-2);
  const mm = `0${d.getUTCMinutes()}`.slice(-2);
  return `${d.getUTCDate()} ${MONTHS_SHORT[locale][d.getUTCMonth()]} ${d.getUTCFullYear()} · ${hh}:${mm} UTC`;
}

/**
 * Italian elides the article before otto and undici, and says "il primo" for the
 * first of the month. Machine translation gets this wrong every time.
 */
export function italianDay(day: number): string {
  if (day === 1) return 'il primo';
  if (day === 8 || day === 11) return `l'${day}`;
  return `il ${day}`;
}
