import { NextResponse } from 'next/server';
import path from 'node:path';
import { DEV_ONLY, APP, readJson, writeJson, validateProducts } from '@/lib/studio/server';

/**
 * Salva un valore dentro uno dei file di dati.
 *
 * Una sola regola, e regge tutto: **si sostituisce un valore che esiste già,
 * non si crea mai struttura**. Un percorso che non porta a un valore semplice
 * viene rifiutato. Così il pannello non può inventare un campo, non può
 * cambiare la forma di un capo, non può trasformare un testo in un elenco — e
 * il file resta sempre della forma che il sito si aspetta.
 *
 * È la stessa regola dei testi, dove impedisce di scollegare le due lingue.
 * Qui impedisce di rompere il catalogo.
 */

const FILE: Record<string, string> = {
  products: path.join(APP, 'src', 'data', 'products.json'),
  collections: path.join(APP, 'src', 'data', 'collections.json'),
  moons: path.join(APP, 'src', 'data', 'moons.json'),
  oracle: path.join(APP, 'src', 'data', 'oracle.json'),
};

type Edit = { path: (string | number)[]; value: string | number };

function sostituisci(root: unknown, percorso: (string | number)[], valore: string | number): string | null {
  let nodo: unknown = root;
  for (const passo of percorso.slice(0, -1)) {
    if (nodo === null || typeof nodo !== 'object') return `percorso inesistente: ${percorso.join('.')}`;
    nodo = (nodo as Record<string | number, unknown>)[passo];
  }
  if (nodo === null || typeof nodo !== 'object') return `percorso inesistente: ${percorso.join('.')}`;

  const ultimo = percorso[percorso.length - 1];
  const attuale = (nodo as Record<string | number, unknown>)[ultimo];

  if (attuale === undefined) return `il campo ${percorso.join('.')} non esiste`;
  if (typeof attuale === 'object') return `${percorso.join('.')} non è un valore semplice`;
  if (typeof attuale !== typeof valore) {
    return `${percorso.join('.')} è ${typeof attuale}, non ${typeof valore}`;
  }
  if (typeof valore === 'number' && !Number.isFinite(valore)) return `${percorso.join('.')}: numero non valido`;
  if (typeof valore === 'string' && valore.length > 4000) return `${percorso.join('.')}: testo troppo lungo`;

  (nodo as Record<string | number, unknown>)[ultimo] = valore;
  return null;
}

export async function POST(req: Request) {
  if (!DEV_ONLY) return NextResponse.json({ error: 'solo in sviluppo' }, { status: 404 });

  let body: { file?: string; edits?: Edit[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'richiesta illeggibile' }, { status: 400 });
  }

  const file = FILE[String(body.file)];
  if (!file) return NextResponse.json({ error: 'file sconosciuto' }, { status: 400 });

  const edits = Array.isArray(body.edits) ? body.edits : [];
  if (edits.length === 0) return NextResponse.json({ saved: 0, errors: [] });

  const dati = await readJson<unknown>(file);
  const errors: string[] = [];
  let saved = 0;

  for (const e of edits) {
    if (!Array.isArray(e?.path) || e.path.length === 0) { errors.push('percorso mancante'); continue; }
    const err = sostituisci(dati, e.path, e.value);
    if (err) errors.push(err);
    else saved += 1;
  }

  /* il catalogo ha regole sue, e vanno controllate prima di scrivere */
  if (body.file === 'products') {
    const problemi = validateProducts(dati);
    if (problemi.length) return NextResponse.json({ saved: 0, errors: problemi }, { status: 400 });
  }

  if (errors.length) return NextResponse.json({ saved: 0, errors }, { status: 400 });

  await writeJson(file, dati);
  return NextResponse.json({ saved, errors: [] });
}
