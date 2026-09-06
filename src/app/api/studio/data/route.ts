import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import { DEV_ONLY, paths, readJson, flatten, listImages, APP } from '@/lib/studio/server';
import { chiaviMorte } from '@/lib/studio/chiavi-morte';
import { collections, categories } from '@/data/collections';
import { moons } from '@/data/moons';
import { axes, deck } from '@/data/oracle';

/** Everything the panel needs, in one request. */
export async function GET() {
  if (!DEV_ONLY) return NextResponse.json({ error: 'solo in sviluppo' }, { status: 404 });

  const [it, en, products, tokensSource, images] = await Promise.all([
    readJson<Record<string, unknown>>(paths.content('it')),
    readJson<Record<string, unknown>>(paths.content('en')),
    readJson<unknown[]>(paths.products),
    readFile(paths.tokens, 'utf8'),
    listImages(),
  ]);

  /* the colours and the type scale, read straight out of the source so the
     panel shows what is actually there and not a copy that could drift */
  const block = (name: string) => {
    const start = tokensSource.indexOf(`export const ${name} = {`);
    const end = tokensSource.indexOf('} as const;', start);
    return start < 0 || end < 0 ? '' : tokensSource.slice(start, end);
  };
  const pairs = (name: string) => {
    const out: { key: string; value: string }[] = [];
    for (const m of block(name).matchAll(/'?([\w-]+)'?\s*:\s*'([^']*)'/g)) {
      out.push({ key: m[1], value: m[2] });
    }
    return out;
  };

  const flatIt = flatten(it);

  /* Le stesse parole vivono spesso sotto chiavi diverse: "Collezioni" è la voce
     del menu, il titolo nel piè di pagina e un'etichetta nella scheda prodotto,
     e sono tre testi indipendenti. Chi ne cambia uno e guarda il sito pensa che
     il salvataggio non abbia funzionato. Il pannello deve dirlo prima, non dopo. */
  const sameText: Record<string, string[]> = {};
  const groups = new Map<string, string[]>();
  for (const [key, value] of Object.entries(flatIt)) {
    const norm = value.trim();
    if (!norm) continue;
    const list = groups.get(norm) ?? [];
    list.push(key);
    groups.set(norm, list);
  }
  for (const keys of groups.values()) {
    if (keys.length > 1) for (const k of keys) sameText[k] = keys.filter((x) => x !== k);
  }

  return NextResponse.json({
    content: { it: flatIt, en: flatten(en) },
    sameText,
    morte: [...chiaviMorte(APP)],
    products,
    collections,
    categories,
    moons,
    oracle: { axes, deck },
    colour: pairs('colour'),
    type: pairs('type'),
    images,
  });
}
