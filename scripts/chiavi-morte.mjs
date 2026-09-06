/**
 * Quali testi non compaiono da nessuna parte nel sito.
 *
 * Nasce da un caso vero: `brand.premise` si poteva modificare dal pannello, il
 * salvataggio funzionava, e sul sito non cambiava niente — perché nessun
 * componente lo legge. Dal punto di vista di chi scrive è indistinguibile da un
 * difetto, e ci si perde mezz'ora.
 *
 * Non è una prova matematica: le chiavi costruite al volo (`t(\`step_${x}\`)`)
 * non si possono seguire, quindi i gruppi che ne contengono vengono lasciati
 * stare. Preferisce tacere che accusare a torto.
 *
 * usage: node scripts/chiavi-morte.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const SRC = 'src';
const files = [];
(function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) { if (!/node_modules|\.next/.test(f)) walk(f); }
    else if (/\.(tsx|ts)$/.test(e.name) && !f.includes(path.join('src', 'content'))) files.push(f);
  }
})(SRC);

const code = files.map((f) => readFileSync(f, 'utf8')).join('\n');

/* i gruppi che qualcuno chiede davvero */
const namespaces = new Set(
  [...code.matchAll(/(?:use|get)Translations\s*(?:<[^>]*>)?\s*\(\s*[^)]*?['"`]([\w.]+)['"`]/g)]
    .map((m) => m[1].split('.')[0]),
);

/* le foglie citate come stringa: t('qualcosa') */
/* La funzione può chiamarsi in qualunque modo: t(), te(), brand(), nav().
   Restringerla a due o tre lettere accusava brand('name'), che è usatissimo. */
const leaves = new Set([...code.matchAll(/\b[A-Za-z_$][\w$]*\(\s*'([\w-]+)'/g)].map((m) => m[1]));

/* I gruppi in cui una chiave viene costruita al volo — t(`sort_${x}`) — non si
   possono seguire, quindi si tacciono per intero. Va guardato file per file: un
   uso dinamico a fondo pagina riguarda il gruppo chiesto in cima. */
const dynamic = new Set();
for (const f of files) {
  const t = readFileSync(f, 'utf8');
  if (!/\w+\(\s*`[^`]*\$\{/.test(t)) continue;
  for (const m of t.matchAll(/(?:use|get)Translations\s*(?:<[^>]*>)?\s*\(\s*[^)]*?['"`]([\w.]+)['"`]/g)) {
    dynamic.add(m[1].split('.')[0]);
  }
}

const it = JSON.parse(readFileSync(path.join(SRC, 'content', 'it.json'), 'utf8'));
const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => {
  const key = p ? `${p}.${k}` : k;
  if (v && typeof v === 'object' && !Array.isArray(v)) return flat(v, key);
  if (Array.isArray(v)) return [];
  return typeof v === 'string' ? [key] : [];
});

const dead = [];
for (const key of flat(it)) {
  const [ns, ...rest] = key.split('.');
  const leaf = rest[rest.length - 1];
  if (!namespaces.has(ns)) { dead.push([key, 'nessun componente chiede questo gruppo']); continue; }
  if (dynamic.has(ns)) continue;                      // chiavi al volo: non si può dire
  if (!leaves.has(leaf)) dead.push([key, 'nessun componente usa questa voce']);
}

console.log(`gruppi richiesti dal codice (${namespaces.size}): ${[...namespaces].sort().join(', ')}`);
if (dynamic.size) console.log(`gruppi con chiavi costruite al volo, lasciati stare: ${[...dynamic].sort().join(', ')}`);
console.log(`\ntesti che non compaiono da nessuna parte (${dead.length}):`);
for (const [k, why] of dead) console.log(`  ${k.padEnd(36)} ${why}`);
if (!dead.length) console.log('  nessuno.');

export const deadKeys = dead.map(([k]) => k);
