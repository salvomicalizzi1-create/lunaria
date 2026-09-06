import { readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

/**
 * The machinery behind the editing panel.
 *
 * Everything here writes to the project's own source files, which is exactly
 * what makes the panel useful and exactly what makes it dangerous. Two rules
 * hold it together:
 *
 *  1. It exists only in development. In a built site every one of these routes
 *     is a 404, so a published LUNARIA can never be edited by whoever opens it.
 *  2. Nothing is written without being checked, and a write that breaks the
 *     build is undone rather than left behind.
 */

export const DEV_ONLY = process.env.NODE_ENV === 'development';

export const APP = process.cwd();
export const paths = {
  content: (locale: 'it' | 'en') => path.join(APP, 'src', 'content', `${locale}.json`),
  products: path.join(APP, 'src', 'data', 'products.json'),
  tokens: path.join(APP, 'src', 'design', 'tokens.ts'),
  images: path.join(APP, 'public', 'images'),
};

export const readJson = async <T>(p: string): Promise<T> =>
  JSON.parse(await readFile(p, 'utf8')) as T;

/** Two spaces and a trailing newline: the same shape the files already have,
 *  so a save never shows up as a thousand-line change. */
export const writeJson = (p: string, data: unknown) =>
  writeFile(p, `${JSON.stringify(data, null, 2)}\n`, 'utf8');

/* ------------------------------------------------------------------ testi */

type Tree = { [k: string]: unknown };

/** The message files are nested; the panel wants a flat list of paths. */
export function flatten(obj: Tree, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(out, flatten(v as Tree, key));
    else if (typeof v === 'string') out[key] = v;
    // arrays (the legal pages) are edited as their own leaves below
    else if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (item && typeof item === 'object') Object.assign(out, flatten(item as Tree, `${key}.${i}`));
      });
    }
  }
  return out;
}

/** Puts one edited value back where it came from, creating nothing new. */
export function setPath(obj: Tree, dotted: string, value: string): boolean {
  const parts = dotted.split('.');
  let node: unknown = obj;
  for (const part of parts.slice(0, -1)) {
    if (node === null || typeof node !== 'object') return false;
    node = Array.isArray(node) ? node[Number(part)] : (node as Tree)[part];
  }
  const last = parts[parts.length - 1];
  if (node === null || typeof node !== 'object') return false;
  const target = node as Tree;
  // only overwrite a string that is already there: a save must never invent keys
  if (typeof target[last] !== 'string') return false;
  target[last] = value;
  return true;
}

/* --------------------------------------------------------------- prodotti */

const STATES = new Set(['in-stock', 'low-stock', 'out-of-stock', 'pre-order']);

/** The same rules products.ts enforces on load, applied before the file is
 *  written rather than after, so a bad edit never reaches the disk. */
export function validateProducts(list: unknown): string[] {
  const errors: string[] = [];
  if (!Array.isArray(list)) return ['I dati dei capi non sono un elenco.'];
  list.forEach((p, i) => {
    const who = p?.slug ?? `capo ${i + 1}`;
    if (!Number.isInteger(p?.priceCents) || p.priceCents <= 0) {
      errors.push(`${who}: il prezzo deve essere un numero intero di centesimi maggiore di zero.`);
    }
    if (p?.compareAtCents != null && p?.lowest30Cents == null) {
      errors.push(`${who}: c'è uno sconto senza il prezzo più basso dei 30 giorni, che la legge europea richiede.`);
    }
    for (const v of p?.variants ?? []) {
      for (const s of v?.sizes ?? []) {
        const a = s?.availability;
        if (!a || !STATES.has(a.state)) {
          errors.push(`${who}, taglia ${s?.size}: stato "${a?.state}" non valido.`);
        }
        if (a?.state === 'low-stock' && (!Number.isInteger(a.left) || a.left < 1)) {
          errors.push(`${who}, taglia ${s?.size}: "ne restano" deve essere un numero intero di almeno 1.`);
        }
      }
    }
  });
  return errors;
}

/* ----------------------------------------------------------------- token */

const HEX = /^#[0-9A-Fa-f]{6}$/;

/**
 * Rewrites one value inside a token block, in place, leaving every comment and
 * every line break exactly where it was.
 *
 * The catalogue moved to JSON because a tool cannot safely rewrite structure in
 * a source file. A single colour is the opposite case: the target is one quoted
 * string with a name in front of it, and a narrow replacement here beats
 * refactoring a file the whole design depends on.
 */
export function replaceInBlock(
  source: string,
  block: 'colour' | 'type' | 'space',
  key: string,
  value: string,
): { ok: true; source: string } | { ok: false; error: string } {
  const start = source.indexOf(`export const ${block} = {`);
  if (start < 0) return { ok: false, error: `Blocco "${block}" non trovato in tokens.ts.` };
  const end = source.indexOf('} as const;', start);
  if (end < 0) return { ok: false, error: `Fine del blocco "${block}" non trovata.` };

  const body = source.slice(start, end);
  // the key can be bare or quoted, and two pairs can share a line
  const re = new RegExp(`(\\b'?${key.replace(/[^\w-]/g, '')}'?\\s*:\\s*)'[^']*'`);
  if (!re.test(body)) return { ok: false, error: `"${key}" non trovato dentro ${block}.` };

  const patched = body.replace(re, `$1'${value.replace(/'/g, '')}'`);
  return { ok: true, source: source.slice(0, start) + patched + source.slice(end) };
}

export const isHex = (v: string) => HEX.test(v);

/**
 * The contrast gate, run against a PROPOSED tokens.ts that is still only a
 * string in memory.
 *
 * This is the whole design. The first version wrote the file, ran the gate as a
 * subprocess, and put the old file back when the gate failed — and it worked
 * perfectly from the command line. In the browser it did not, for a reason worth
 * writing down: saving changes a source file, the development server reloads the
 * page, the browser cancels the request that is still running, and the handler
 * dies somewhere between the write and the check. The bad colour stayed, and the
 * undo never happened.
 *
 * Undoing damage is always more fragile than not causing it. So the check now
 * happens first, on a candidate nobody has written anywhere, and the file is
 * touched only once the answer is yes. There is no window to be interrupted in.
 *
 * The arithmetic is deliberately the same as scripts/check-contrast.mjs, which
 * also reads the file as text: two implementations that disagree would be worse
 * than one that is duplicated.
 */
export function checkContrastOn(source: string): { ok: boolean; failures: string[]; checked: number } {
  const hexOf = (name: string) => {
    const m = new RegExp(`\\b${name}:\\s*'(#[0-9A-Fa-f]{6})'`).exec(source);
    return m ? m[1] : null;
  };
  const rows = [...source.matchAll(
    /\{\s*fg:\s*colour\.(\w+),\s*bg:\s*colour\.(\w+),\s*min:\s*([\d.]+),\s*note:\s*'([^']+)'/g,
  )].map(([, fg, bg, min, note]) => ({ fg, bg, min: Number(min), note }));

  if (!rows.length) {
    return { ok: false, failures: ['Non trovo nessuna coppia da controllare in tokens.ts.'], checked: 0 };
  }

  const lin = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const lum = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  };
  const ratio = (a: string, b: string) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };

  const failures: string[] = [];
  for (const r of rows) {
    const fg = hexOf(r.fg);
    const bg = hexOf(r.bg);
    if (!fg || !bg) { failures.push(`Colore ${!fg ? r.fg : r.bg} non trovato.`); continue; }
    const got = ratio(fg, bg);
    if (got < r.min) {
      failures.push(`${r.fg} su ${r.bg} (${r.note}): ${got.toFixed(2)}:1, ne servono almeno ${r.min}.`);
    }
  }
  return { ok: failures.length === 0, failures, checked: rows.length };
}

/** Rigenera il tema dal file che è ora sul disco. Si chiama solo dopo che la
 *  versione proposta ha passato il controllo. */
export async function regenerateAndCheck(): Promise<{ ok: boolean; output: string }> {
  try {
    const gen = await run(process.execPath, ['scripts/tokens-to-css.mjs'], { cwd: APP });
    const gate = await run(process.execPath, ['scripts/check-contrast.mjs'], { cwd: APP });
    return { ok: true, output: `${gen.stdout}\n${gate.stdout}`.trim() };
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string; message?: string };
    return { ok: false, output: (err.stdout || '') + (err.stderr || '') || err.message || 'errore' };
  }
}

/* --------------------------------------------------------------- immagini */

export async function listImages(): Promise<{ url: string; file: string; bytes: number }[]> {
  const out: { url: string; file: string; bytes: number }[] = [];
  const { stat } = await import('node:fs/promises');

  async function walk(dir: string, rel: string) {
    if (!existsSync(dir)) return;
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const r = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) await walk(full, r);
      else if (/\.(jpe?g|png|webp|avif|svg)$/i.test(entry.name)) {
        out.push({ url: `/images/${r}`, file: r, bytes: (await stat(full)).size });
      }
    }
  }
  await walk(paths.images, '');
  return out.sort((a, b) => a.file.localeCompare(b.file));
}

/** A path from the browser must never be able to climb out of /public/images. */
export function safeImagePath(file: string): string | null {
  const target = path.resolve(paths.images, file);
  if (!target.startsWith(paths.images + path.sep)) return null;
  if (!/\.(jpe?g|png|webp|avif)$/i.test(target)) return null;
  return target;
}
