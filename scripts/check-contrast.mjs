/**
 * The contrast gate.
 *
 * Every colour pair declared in tokens.ts is measured against WCAG 2.2. If one
 * fails, the build stops. Catching it here costs a second; catching it after the
 * shop is live costs a redesign, and every barrier in a checkout is a sale that
 * does not happen.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const file = readFileSync(resolve(here, '../src/design/tokens.ts'), 'utf8');

const hexOf = (name) => {
  const m = new RegExp(`\\b${name}:\\s*'(#[0-9A-Fa-f]{6})'`).exec(file);
  return m ? m[1] : null;
};

const rows = [...file.matchAll(
  /\{\s*fg:\s*colour\.(\w+),\s*bg:\s*colour\.(\w+),\s*min:\s*([\d.]+),\s*note:\s*'([^']+)'/g
)].map(([, fg, bg, min, note]) => ({ fg, bg, min: Number(min), note }));

if (!rows.length) {
  console.error('contrast gate: no pairs found in tokens.ts, refusing to pass silently');
  process.exit(1);
}

const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 };
const lum = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

let failed = 0;
for (const r of rows) {
  const fg = hexOf(r.fg), bg = hexOf(r.bg);
  if (!fg || !bg) { console.error(`contrast gate: colour ${!fg ? r.fg : r.bg} not found`); failed++; continue }
  const got = ratio(fg, bg);
  const ok = got >= r.min;
  if (!ok) failed++;
  console.log(
    `${ok ? 'ok  ' : 'FAIL'}  ${got.toFixed(2).padStart(6)}:1  (min ${r.min})  ${r.fg} on ${r.bg}  ${r.note}`
  );
}

if (failed) {
  console.error(`\ncontrast gate: ${failed} pair(s) below the minimum. Build stopped.`);
  process.exit(1);
}
console.log(`\ncontrast gate: ${rows.length} pairs, all pass.`);
