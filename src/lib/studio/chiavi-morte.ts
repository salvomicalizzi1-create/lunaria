import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

/**
 * Quali testi non compaiono da nessuna parte nel sito.
 *
 * Nasce da un caso vero. `brand.premise` si poteva modificare dal pannello, il
 * salvataggio funzionava, il file cambiava — e sul sito non succedeva niente,
 * perché nessun componente legge quella voce. Dal punto di vista di chi scrive è
 * identico a un difetto, e ci si perde mezz'ora a cercarlo nel posto sbagliato.
 *
 * Non è una prova matematica: una chiave costruita al volo — `t(\`sort_${x}\`)`
 * — non si può seguire leggendo il codice. I gruppi che ne contengono vengono
 * quindi taciuti per intero. Preferisce non dire niente che accusare a torto:
 * un falso allarme qui farebbe cancellare un testo che serve.
 */
export function chiaviMorte(appDir: string): Set<string> {
  const SRC = path.join(appDir, 'src');
  const files: string[] = [];
  (function walk(dir: string) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const f = path.join(dir, e.name);
      if (e.isDirectory()) { if (!/node_modules|\.next/.test(f)) walk(f); }
      else if (/\.(tsx|ts)$/.test(e.name) && !f.includes(path.join('src', 'content'))) files.push(f);
    }
  })(SRC);

  const code = files.map((f) => readFileSync(f, 'utf8')).join('\n');

  const namespaces = new Set(
    [...code.matchAll(/(?:use|get)Translations\s*(?:<[^>]*>)?\s*\(\s*[^)]*?['"`]([\w.]+)['"`]/g)]
      .map((m) => m[1].split('.')[0]),
  );
  /* la funzione può chiamarsi in qualunque modo: t(), te(), brand(), nav() */
  const leaves = new Set([...code.matchAll(/\b[A-Za-z_$][\w$]*\(\s*'([\w-]+)'/g)].map((m) => m[1]));

  const dynamic = new Set<string>();
  for (const f of files) {
    const t = readFileSync(f, 'utf8');
    if (!/\w+\(\s*`[^`]*\$\{/.test(t)) continue;
    for (const m of t.matchAll(/(?:use|get)Translations\s*(?:<[^>]*>)?\s*\(\s*[^)]*?['"`]([\w.]+)['"`]/g)) {
      dynamic.add(m[1].split('.')[0]);
    }
  }

  const it = JSON.parse(readFileSync(path.join(SRC, 'content', 'it.json'), 'utf8'));
  const flat = (o: Record<string, unknown>, p = ''): string[] =>
    Object.entries(o).flatMap(([k, v]) => {
      const key = p ? `${p}.${k}` : k;
      if (v && typeof v === 'object' && !Array.isArray(v)) return flat(v as Record<string, unknown>, key);
      if (Array.isArray(v)) return [];
      return typeof v === 'string' ? [key] : [];
    });

  const dead = new Set<string>();
  for (const key of flat(it)) {
    const parts = key.split('.');
    const ns = parts[0];
    const leaf = parts[parts.length - 1];
    if (!namespaces.has(ns)) { dead.add(key); continue; }
    if (dynamic.has(ns)) continue;
    if (!leaves.has(leaf)) dead.add(key);
  }
  return dead;
}
