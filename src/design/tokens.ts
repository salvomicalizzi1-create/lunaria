/**
 * LUNARIA · design tokens
 *
 * This file is the ONE source. `scripts/tokens-to-css.mjs` reads it and writes
 * src/styles/theme.css, so nothing here is ever retyped by hand in a component.
 * If a value is not in this file, it does not belong in the design.
 */

/* ------------------------------------------------------------------ colour */
/* Every pastel is for DARK grounds only. Its `-ink` twin is the only version
   allowed as text on light. The ratios are measured against --ink #0B1020 and
   --moonlight #F2F0EA; scripts/check-contrast.mjs re-measures them on build. */
export const colour = {
  /* ground */
  ink: '#0B1020',          // deep night, the dark ground
  ink2: '#131A2E',         // raised dark surface
  veil: '#1E2740',         // hairlines and borders on dark
  moonlight: '#F2F0EA',    // bone white, the light ground
  moonlight2: '#E8E5DC',   // raised light surface
  hairline: '#D6D2C6',     // borders on light

  /* A hairline is a whisper and sits far below 3:1 on purpose. A border you can
     click is not decoration and needs its own, stronger value. */
  edge: '#77839F',         // interactive border on night      4.99:1
  edgeInk: '#7A8090',      // interactive border on bone        3.4:1

  /* text */
  silver: '#C9CEDC',       // primary text on dark      13.0:1
  argento: '#A9B4CC',      // secondary text on dark      8.7:1
  inkText: '#0B1020',      // primary text on light      17.0:1
  inkMuted: '#55607A',     // secondary text on light     6.6:1

  /* accents, pastel on dark + ink twin on light */
  aurora: '#8FA5D8', auroraInk: '#4A5F94',        // periwinkle, the primary accent
  peonia: '#E3B7C4', peoniaInk: '#8A4E62',        // dusty rose, ARCANI
  zolfo: '#D9B26A', zolfoInk: '#75591F',          // brass, price and CTA
  verderame: '#7E9E8E', verderameInk: '#476255',  // sage, materials
  errore: '#C4726A', erroreInk: '#9E4A3A',        // never pure red
} as const;

/* Pairs the contrast gate checks on every build. Anything used as text goes
   here, with the ground it sits on and the minimum it must clear. */
export const contrastPairs: Array<{ fg: string; bg: string; min: number; note: string }> = [
  { fg: colour.silver, bg: colour.ink, min: 4.5, note: 'body on night' },
  { fg: colour.argento, bg: colour.ink, min: 4.5, note: 'secondary on night' },
  { fg: colour.silver, bg: colour.ink2, min: 4.5, note: 'body on raised night' },
  { fg: colour.argento, bg: colour.ink2, min: 4.5, note: 'secondary on raised night' },
  { fg: colour.inkText, bg: colour.moonlight, min: 4.5, note: 'body on bone' },
  { fg: colour.inkMuted, bg: colour.moonlight, min: 4.5, note: 'secondary on bone' },
  { fg: colour.inkMuted, bg: colour.moonlight2, min: 4.5, note: 'secondary on raised bone' },
  { fg: colour.aurora, bg: colour.ink, min: 4.5, note: 'accent on night' },
  { fg: colour.zolfo, bg: colour.ink, min: 4.5, note: 'price on night' },
  { fg: colour.peonia, bg: colour.ink, min: 4.5, note: 'arcani on night' },
  { fg: colour.verderame, bg: colour.ink, min: 4.5, note: 'sage on night' },
  { fg: colour.errore, bg: colour.ink, min: 4.5, note: 'error on night' },
  { fg: colour.auroraInk, bg: colour.moonlight, min: 4.5, note: 'accent on bone' },
  { fg: colour.zolfoInk, bg: colour.moonlight, min: 4.5, note: 'price on bone' },
  { fg: colour.peoniaInk, bg: colour.moonlight, min: 4.5, note: 'arcani on bone' },
  { fg: colour.verderameInk, bg: colour.moonlight, min: 4.5, note: 'sage on bone' },
  { fg: colour.erroreInk, bg: colour.moonlight, min: 4.5, note: 'error on bone' },
  { fg: colour.auroraInk, bg: colour.moonlight2, min: 4.5, note: 'accent on raised bone' },
  { fg: colour.zolfoInk, bg: colour.moonlight2, min: 4.5, note: 'price on raised bone' },
  /* interface borders and large text need 3:1, not 4.5.
     --veil and --hairline are deliberately below that: they are decoration, they
     never carry meaning, and nothing clickable is drawn with them. */
  { fg: colour.edge, bg: colour.ink, min: 3, note: 'interactive border on night' },
  { fg: colour.edgeInk, bg: colour.moonlight, min: 3, note: 'interactive border on bone' },
  { fg: colour.aurora, bg: colour.ink, min: 3, note: 'focus ring on night' },
  { fg: colour.auroraInk, bg: colour.moonlight, min: 3, note: 'focus ring on bone' },
];

/* ------------------------------------------------------------------- space */
/* 8px base. Everything on the page picks from this ladder. */
export const space = {
  1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '24px',
  6: '32px', 7: '48px', 8: '64px', 9: '96px', 10: '128px', 11: '192px',
} as const;

/* ------------------------------------------------------------------ layout */
export const layout = {
  maxWidth: '1440px',
  gutter: '24px',
  padMobile: '20px',
  padTablet: '32px',
  padDesktop: '40px',
} as const;

/* breakpoints, mobile first, min-width only. The phone is the design target. */
export const screens = {
  sm: '600px',    // large phone, phone landscape
  md: '768px',    // tablet portrait
  lg: '1024px',   // tablet landscape and small laptop: desktop patterns begin
  xl: '1280px',   // desktop
  '2xl': '1600px', // the layout stops growing, only the gutters do
} as const;

/* --------------------------------------------------------------- typography */
export const font = {
  display: "'Bodoni Moda', ui-serif, Georgia, serif",
  body: "'Inter', ui-sans-serif, system-ui, sans-serif",
  mono: "'Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
} as const;

/* fluid scale, ratio 1.25 on the phone opening to 1.333 from 1024px */
export const type = {
  displayXl: 'clamp(2.75rem, 7vw, 6.5rem)',
  h1: 'clamp(2rem, 4.5vw, 3.75rem)',
  h2: 'clamp(1.5rem, 3vw, 2.5rem)',
  h3: 'clamp(1.15rem, 1.8vw, 1.5rem)',
  body: '1rem',
  small: '0.8125rem',
  eyebrow: '0.6875rem',
} as const;

export const leading = { tight: '1.05', display: '0.98', body: '1.65', small: '1.5' } as const;
export const tracking = { display: '-0.02em', eyebrow: '0.18em', mono: '0.02em' } as const;
/* max measure lives on the text element, never on a container: a ch resolves
   against the font the element inherits, not the display face inside it */
export const measure = { body: '68ch', quote: '42ch' } as const;

/* ------------------------------------------------------------------ shape */
/* 0 on cards, images and inputs. 999px on pills and the cart badge only.
   That contrast is a brand signature, not an oversight. */
export const radius = { none: '0', pill: '999px' } as const;

/* On light there are no drop shadows: elevation is a 1px hairline. On dark it is
   a lighter surface plus a 1px veil. The drawer and modals are the one exception. */
export const shadow = { overlay: '0 24px 80px -12px rgb(11 16 32 / 0.45)' } as const;

/* ----------------------------------------------------------------- motion */
export const motion = {
  easeOutQuart: 'cubic-bezier(0.25, 1, 0.5, 1)',
  easeInOutQuint: 'cubic-bezier(0.83, 0, 0.17, 1)',
  easeSpring: 'linear(0, .38 12%, .84 26%, 1.04 38%, .99 56%, 1)',
  durMicro: '160ms',
  durBase: '320ms',
  durExpressive: '720ms',
  staggerGrid: '60ms',
  staggerText: '70ms',
  staggerNav: '40ms',
} as const;

/* --------------------------------------------------------------- commerce */
export const commerce = {
  currency: 'EUR',
  freeShippingThreshold: 12000,   // in cents, so 120,00 euro
  vatRate: 0.22,                  // shown included, broken out at checkout
  returnDays: 30,
  withdrawalDays: 14,             // Codice del Consumo, arts. 52-59
} as const;

export const tokens = {
  colour, space, layout, screens, font, type,
  leading, tracking, measure, radius, shadow, motion, commerce,
};
export default tokens;
