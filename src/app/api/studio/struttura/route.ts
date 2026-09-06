import { NextResponse } from 'next/server';
import path from 'node:path';
import { DEV_ONLY, APP, readJson, writeJson, validateProducts } from '@/lib/studio/server';
import { esegui, type Dati, type Richiesta } from '@/lib/studio/struttura';

/**
 * Aggiunge, duplica o toglie una cosa intera dal catalogo.
 *
 * Un'operazione sola può toccare due file — togliere un capo toglie anche la
 * sua etichetta dall'oracolo — e i due devono restare d'accordo. Quindi si
 * lavora **su una copia in memoria** di tutti e quattro i file, si controlla il
 * risultato, e solo se regge si scrive.
 *
 * Non è pignoleria. Salvare fa ricompilare il sito, e ricompilare mentre il
 * primo file è scritto e il secondo no significa fermare tutto su un errore che
 * non parla di quello che hai appena fatto. Lo avevamo già imparato coi colori:
 * si misura prima di scrivere, mai dopo.
 */

const FILE = {
  products: path.join(APP, 'src', 'data', 'products.json'),
  collections: path.join(APP, 'src', 'data', 'collections.json'),
  moons: path.join(APP, 'src', 'data', 'moons.json'),
  oracle: path.join(APP, 'src', 'data', 'oracle.json'),
} as const;

const AZIONI = new Set(['aggiungi', 'duplica', 'rimuovi']);
const TIPI = new Set(['capo', 'collezione', 'luna', 'carta', 'variante', 'taglia']);

/** Le regole che il resto del sito dà per scontate, misurate sul risultato. */
function coerente(d: Dati): string[] {
  const problemi = validateProducts(d.products);

  const slugs = new Set(d.products.map((p) => String(p.slug)));
  const etichettati = new Set(Object.keys(d.oracle.tagsBySlug));
  for (const s of slugs) if (!etichettati.has(s)) problemi.push(`Il capo «${s}» non ha un'etichetta nell'oracolo.`);
  for (const s of etichettati) if (!slugs.has(s)) problemi.push(`L'oracolo etichetta «${s}», che non è più un capo.`);

  const dupSlug = d.products.length - slugs.size;
  if (dupSlug > 0) problemi.push(`Ci sono ${dupSlug} capi con lo stesso indirizzo.`);
  const idUnici = new Set(d.products.map((p) => String(p.id)));
  if (idUnici.size !== d.products.length) problemi.push('Ci sono capi con lo stesso identificativo.');

  const collezioni = new Set(d.collections.collections.map((c) => String(c.id)));
  for (const p of d.products) {
    if (!collezioni.has(String(p.collection))) {
      problemi.push(`Il capo «${p.slug}» sta in una collezione che non esiste: «${p.collection}».`);
    }
  }
  for (const m of d.moons) {
    if (!collezioni.has(String(m.collection))) {
      problemi.push(`L'uscita «${m.numeral}» punta a una collezione che non esiste: «${m.collection}».`);
    }
  }

  if (d.moons.length < 1) problemi.push('Senza uscite la home non ha un\'uscita in corso da mostrare.');
  for (const a of d.oracle.axes) {
    if (!(d.oracle.deck[String(a.id)] ?? []).length) problemi.push(`L'asse «${a.id}» è rimasto senza carte.`);
  }
  return problemi;
}

export async function POST(req: Request) {
  if (!DEV_ONLY) return NextResponse.json({ error: 'solo in sviluppo' }, { status: 404 });

  let body: Richiesta;
  try {
    body = (await req.json()) as Richiesta;
  } catch {
    return NextResponse.json({ error: 'richiesta illeggibile' }, { status: 400 });
  }
  if (!AZIONI.has(String(body?.azione))) return NextResponse.json({ error: 'azione sconosciuta' }, { status: 400 });
  if (!TIPI.has(String(body?.tipo))) return NextResponse.json({ error: 'tipo sconosciuto' }, { status: 400 });

  const dati: Dati = {
    products: await readJson(FILE.products),
    collections: await readJson(FILE.collections),
    moons: await readJson(FILE.moons),
    oracle: await readJson(FILE.oracle),
  };

  const esito = esegui(dati, body);
  if (esito.errore) return NextResponse.json({ error: esito.errore }, { status: 400 });

  const problemi = coerente(dati);
  if (problemi.length) {
    return NextResponse.json(
      { error: `L'operazione lascerebbe il catalogo incoerente: ${problemi[0]}`, problemi },
      { status: 400 },
    );
  }

  /* tutto controllato: adesso si scrive, e si scrivono tutti i file toccati */
  for (const nome of esito.tocca) await writeJson(FILE[nome], dati[nome]);

  return NextResponse.json({
    ok: true,
    messaggio: esito.messaggio,
    avvisi: esito.avvisi,
    vaiA: esito.vaiA ?? null,
  });
}
