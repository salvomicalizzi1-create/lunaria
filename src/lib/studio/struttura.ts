/**
 * Aggiungere, duplicare e togliere una cosa intera.
 *
 * Fino a qui il pannello poteva solo sostituire un valore che esisteva già —
 * regola prudente, e per un po' giusta: impediva di inventare un campo, di
 * scollegare le due lingue, di cambiare la forma di un capo. Ma impediva anche
 * di fare la cosa più ovvia che si chiede a un catalogo, cioè metterci dentro
 * un capo nuovo.
 *
 * Qui la regola cambia, e ne prende il posto una più difficile da rispettare:
 * **si può creare e si può togliere, ma non si può lasciare il sito in uno
 * stato che non sta in piedi.** I dati di LUNARIA si tengono per mano in punti
 * che non si vedono guardando un file solo:
 *
 *  · ogni capo deve avere un'etichetta nell'oracolo, altrimenti la
 *    compilazione si ferma — è un controllo che abbiamo messo apposta;
 *  · una collezione tolta mentre dei capi la nominano è una pagina che non
 *    esiste, raggiunta da schede prodotto che continuano a rimandarci;
 *  · `liveMoonAt` ripiega sulla prima luna: togliendo l'ultima, la home resta
 *    senza uscita in corso e si rompe;
 *  · un capo senza varianti, o una variante senza taglie, è un pulsante
 *    «aggiungi al carrello» che non può funzionare.
 *
 * Ognuno di questi è un guasto silenzioso: non dà errore dove lo hai causato,
 * lo dà tre pagine più in là. Perciò stanno tutti qui, controllati **prima** di
 * scrivere, con un messaggio che dice cosa si romperebbe e perché.
 */

/* I dati sono più vari di quanto un tipo stretto ammetterebbe: certi capi hanno
   `edition`, `fitNote`, `compareAtCents`, altri no. Si lavora sulla forma vera. */
type Rec = Record<string, unknown>;

export type Dati = {
  products: Rec[];
  collections: { collections: Rec[]; categories: Rec[] };
  moons: Rec[];
  oracle: { axes: Rec[]; deck: Record<string, Rec[]>; tagsBySlug: Record<string, string[]> };
};

export type Tipo = 'capo' | 'collezione' | 'luna' | 'carta' | 'variante' | 'taglia';

export type Richiesta = {
  azione: 'aggiungi' | 'duplica' | 'rimuovi';
  tipo: Tipo;
  /** quale cosa: dipende dal tipo */
  slug?: string;
  id?: string;
  numeral?: string;
  asse?: string;
  indice?: number;
  variante?: string;
  taglia?: string;
};

export type Esito = {
  errore?: string;
  avvisi: string[];
  /** quali file vanno riscritti */
  tocca: ('products' | 'collections' | 'moons' | 'oracle')[];
  messaggio: string;
  /** dove deve andare il pannello dopo l'operazione */
  vaiA?: { tipo: Tipo; slug?: string; id?: string; numeral?: string; asse?: string; indice?: number };
};

const copia = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
const loc = (v: unknown): { it: string; en: string } =>
  v && typeof v === 'object'
    ? { it: String((v as Rec).it ?? ''), en: String((v as Rec).en ?? '') }
    : { it: '', en: '' };

/** Un identificativo che non è già in uso, provando `base`, `base-2`, `base-3`… */
function libero(base: string, presi: Set<string>): string {
  if (!presi.has(base)) return base;
  for (let n = 2; n < 200; n++) if (!presi.has(`${base}-${n}`)) return `${base}-${n}`;
  return `${base}-${Date.now()}`;
}

/** `p07` dopo `p06`: la stessa forma che il catalogo usa già. */
function prossimoId(presi: Set<string>): string {
  let max = 0;
  for (const id of presi) {
    const m = /^p(\d+)$/.exec(id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `p${String(max + 1).padStart(2, '0')}`;
}

const SIGLE = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

/* ------------------------------------------------------------------ capi */

function capoNuovo(dati: Dati, modello: Rec | null, collezione?: string): Rec {
  const slugPresi = new Set(dati.products.map((p) => String(p.slug)));
  const idPresi = new Set(dati.products.map((p) => String(p.id)));

  if (modello) {
    const c = copia(modello);
    c.id = prossimoId(idPresi);
    c.slug = libero(`${modello.slug}-copia`, slugPresi);
    const n = loc(modello.name);
    c.name = { it: `${n.it} (copia)`, en: `${n.en} (copy)` };
    return c;
  }

  const coll = collezione ?? String(dati.collections.collections[0]?.id ?? 'fasi');
  const scheda = dati.collections.collections.find((x) => x.id === coll);
  return {
    id: prossimoId(idPresi),
    slug: libero('capo-nuovo', slugPresi),
    collection: coll,
    category: 't-shirt',
    name: { it: 'Capo nuovo', en: 'New piece' },
    priceCents: 5800,
    gsm: 240,
    /* la data dell'ultima uscita: un capo nuovo appartiene alla luna corrente */
    releasedOn: String(dati.moons[dati.moons.length - 1]?.at ?? '').slice(0, 10) || '2026-01-18',
    variants: [
      {
        id: 'osso',
        colour: { it: 'Bianco osso', en: 'Bone white' },
        hex: '#F2F0EA',
        sizes: SIGLE.map((size) => ({ size, availability: { state: 'in-stock' } })),
      },
    ],
    composition: { it: '100% cotone organico', en: '100% organic cotton' },
    origin: { it: 'Filato Portogallo, confezione Portogallo', en: 'Yarn Portugal, made in Portugal' },
    care: { it: 'A rovescio, 30°C, niente asciugatrice', en: 'Inside out, 30°C, no tumble dryer' },
    meaning: { it: '', en: '' },
    image: String(scheda?.image ?? '/images/collections/fasi.jpg'),
  };
}

/* --------------------------------------------------------------- il motore */

export function esegui(dati: Dati, r: Richiesta): Esito {
  const avvisi: string[] = [];
  const no = (errore: string): Esito => ({ errore, avvisi: [], tocca: [], messaggio: '' });
  const possibili = () =>
    dati.oracle.axes.reduce((n, a) => n * (dati.oracle.deck[String(a.id)]?.length ?? 1), 1);

  /* ---------------------------------------------------------------- capo */
  if (r.tipo === 'capo') {
    if (r.azione === 'rimuovi') {
      const i = dati.products.findIndex((p) => p.slug === r.slug);
      if (i < 0) return no(`Il capo «${r.slug}» non esiste.`);
      if (dati.products.length <= 1) {
        return no('È l’ultimo capo del catalogo: il negozio resterebbe senza niente da vendere.');
      }

      const capo = dati.products[i];
      dati.products.splice(i, 1);
      /* l'etichetta dell'oracolo se ne va insieme al capo, o la compilazione si
         ferma su uno slug che non esiste più */
      delete dati.oracle.tagsBySlug[String(capo.slug)];

      const rimasti = dati.products.filter((p) => p.collection === capo.collection).length;
      if (rimasti === 0) {
        avvisi.push(`La collezione «${capo.collection}» ora non ha più capi: la sua pagina si vede vuota.`);
      }
      return {
        avvisi,
        tocca: ['products', 'oracle'],
        messaggio: `Capo «${loc(capo.name).it}» tolto, con la sua etichetta dell’oracolo.`,
      };
    }

    const modello = r.azione === 'duplica' ? dati.products.find((p) => p.slug === r.slug) ?? null : null;
    if (r.azione === 'duplica' && !modello) return no(`Il capo «${r.slug}» non esiste.`);

    const nuovo = capoNuovo(dati, modello, r.id);
    /* subito dopo il modello, non in fondo: la posizione nel catalogo decide
       l'ordine sulla pagina della collezione */
    const dove = modello ? dati.products.indexOf(modello) + 1 : dati.products.length;
    dati.products.splice(dove, 0, nuovo);

    dati.oracle.tagsBySlug[String(nuovo.slug)] = modello
      ? copia(dati.oracle.tagsBySlug[String(modello.slug)] ?? [])
      : ['quotidiano', 'cotone', 'mezza'];

    if (!modello) {
      avvisi.push('Il capo nuovo usa la fotografia della sua collezione: sostituiscila dalla scheda Immagini.');
    }
    return {
      avvisi,
      tocca: ['products', 'oracle'],
      messaggio: modello ? `Copia di «${loc(modello.name).it}» creata.` : 'Capo nuovo creato.',
      vaiA: { tipo: 'capo', slug: String(nuovo.slug) },
    };
  }

  /* --------------------------------------------------------- collezione */
  if (r.tipo === 'collezione') {
    const elenco = dati.collections.collections;
    if (r.azione === 'rimuovi') {
      const i = elenco.findIndex((c) => c.id === r.id);
      if (i < 0) return no(`La collezione «${r.id}» non esiste.`);

      const capi = dati.products.filter((p) => p.collection === r.id);
      if (capi.length) {
        return no(
          `Non si può togliere: ${capi.length} capi la nominano e resterebbero senza collezione — ` +
            `${capi.slice(0, 3).map((p) => loc(p.name).it).join(', ')}${capi.length > 3 ? '…' : ''}. ` +
            'Spostali prima in un’altra collezione, o toglili.',
        );
      }
      const lune = dati.moons.filter((m) => m.collection === r.id);
      if (lune.length) {
        return no(
          `Non si può togliere: ${lune.length} uscite la nominano (${lune.map((m) => m.numeral).join(', ')}).`,
        );
      }
      if (elenco.length <= 1) return no('È l’ultima collezione.');

      const via = elenco[i];
      elenco.splice(i, 1);
      return { avvisi, tocca: ['collections'], messaggio: `Collezione «${loc(via.name).it}» tolta.` };
    }

    const modello = r.azione === 'duplica' ? elenco.find((c) => c.id === r.id) ?? null : null;
    if (r.azione === 'duplica' && !modello) return no(`La collezione «${r.id}» non esiste.`);

    const presi = new Set(elenco.map((c) => String(c.id)));
    const base = copia(modello ?? elenco[0]);
    base.id = libero(modello ? `${modello.id}-copia` : 'collezione-nuova', presi);
    const n = loc(base.name);
    base.name = modello
      ? { it: `${n.it} (copia)`, en: `${n.en} (copy)` }
      : { it: 'Collezione nuova', en: 'New collection' };
    base.tag = String(base.id).toUpperCase();
    if (!modello) base.meaning = { it: '', en: '' };

    elenco.splice(modello ? elenco.indexOf(modello) + 1 : elenco.length, 0, base);
    avvisi.push('Una collezione senza capi si vede vuota: assegnale un capo dalla scheda Capi.');
    return {
      avvisi,
      tocca: ['collections'],
      messaggio: modello ? `Copia di «${n.it}» creata.` : 'Collezione nuova creata.',
      vaiA: { tipo: 'collezione', id: String(base.id) },
    };
  }

  /* --------------------------------------------------------------- luna */
  if (r.tipo === 'luna') {
    if (r.azione === 'rimuovi') {
      const i = dati.moons.findIndex((m) => m.numeral === r.numeral);
      if (i < 0) return no(`L’uscita «${r.numeral}» non esiste.`);
      if (dati.moons.length <= 1) {
        return no('È l’ultima uscita: la home cerca sempre l’uscita in corso e resterebbe senza.');
      }
      const via = dati.moons[i];
      const capi = dati.products.filter((p) => p.releasedOn === String(via.at).slice(0, 10)).length;
      dati.moons.splice(i, 1);
      if (capi) {
        avvisi.push(
          `${capi} capi erano usciti con questa luna: restano nel catalogo, ma nessuna uscita li conta più.`,
        );
      }
      return { avvisi, tocca: ['moons'], messaggio: `Uscita «${loc(via.name).it}» tolta.` };
    }

    const modello = r.azione === 'duplica' ? dati.moons.find((m) => m.numeral === r.numeral) ?? null : null;
    if (r.azione === 'duplica' && !modello) return no(`L’uscita «${r.numeral}» non esiste.`);

    const presi = new Set(dati.moons.map((m) => String(m.numeral)));
    const base = copia(modello ?? dati.moons[dati.moons.length - 1]);
    base.numeral = libero(modello ? `${modello.numeral}-bis` : 'XIV', presi);
    const n = loc(base.name);
    base.name = modello
      ? { it: `${n.it} (copia)`, en: `${n.en} (copy)` }
      : { it: 'Uscita nuova', en: 'New release' };

    /* una luna in più, un mese lunare più tardi: una data plausibile è più utile
       di una casella vuota, e resta da correggere a mano */
    const quando = new Date(String(base.at));
    if (!Number.isNaN(quando.getTime())) {
      quando.setUTCDate(quando.getUTCDate() + 29);
      base.at = `${quando.toISOString().slice(0, 16)}Z`;
    }

    dati.moons.splice(modello ? dati.moons.indexOf(modello) + 1 : dati.moons.length, 0, base);
    avvisi.push('Controlla la data: è stata messa un mese lunare dopo la precedente, non è un novilunio vero.');
    return {
      avvisi,
      tocca: ['moons'],
      messaggio: modello ? `Copia dell’uscita «${n.it}» creata.` : 'Uscita nuova creata.',
      vaiA: { tipo: 'luna', numeral: String(base.numeral) },
    };
  }

  /* -------------------------------------------------------------- carta */
  if (r.tipo === 'carta') {
    const asse = String(r.asse ?? '');
    const mazzo = dati.oracle.deck[asse];
    if (!mazzo) return no(`L’asse «${asse}» non esiste.`);

    if (r.azione === 'rimuovi') {
      const i = Number(r.indice);
      if (!Number.isInteger(i) || i < 0 || i >= mazzo.length) return no('Quella carta non esiste.');
      if (mazzo.length <= 1) {
        return no('È l’ultima carta di questo asse: l’oracolo ne pesca sempre una per asse.');
      }
      const via = mazzo[i];
      mazzo.splice(i, 1);
      if (mazzo.length === 1) avvisi.push('Questo asse è rimasto con una carta sola: uscirà sempre quella.');
      avvisi.push(`Le letture possibili ora sono ${possibili()}.`);
      return { avvisi, tocca: ['oracle'], messaggio: `Carta «${loc(via.key).it}» tolta.` };
    }

    const i = Number(r.indice);
    const modello = r.azione === 'duplica' ? mazzo[i] ?? null : null;
    if (r.azione === 'duplica' && !modello) return no('Quella carta non esiste.');

    const base = copia(modello ?? mazzo[0]);
    const n = loc(base.key);
    base.key = modello
      ? { it: `${n.it} (copia)`, en: `${n.en} (copy)` }
      : { it: 'Carta nuova', en: 'New card' };
    if (!modello) {
      base.value = { it: '', en: '' };
      base.reading = { it: '', en: '' };
    }

    const dove = modello ? i + 1 : mazzo.length;
    mazzo.splice(dove, 0, base);
    avvisi.push(
      `La carta usa l’incisione «${String(base.image).split('/').pop()}»: sostituiscila dalla scheda Immagini se ne vuoi una sua.`,
    );
    avvisi.push(`Le letture possibili ora sono ${possibili()}.`);
    return {
      avvisi,
      tocca: ['oracle'],
      messaggio: modello ? `Copia della carta «${n.it}» creata.` : 'Carta nuova creata.',
      vaiA: { tipo: 'carta', asse, indice: dove },
    };
  }

  /* ------------------------------------------------------ variante e taglia */
  const capo = dati.products.find((p) => p.slug === r.slug);
  if (!capo) return no(`Il capo «${r.slug}» non esiste.`);
  const varianti = capo.variants as Rec[];

  if (r.tipo === 'variante') {
    if (r.azione === 'rimuovi') {
      const i = varianti.findIndex((v) => v.id === r.variante);
      if (i < 0) return no('Quel colore non esiste.');
      if (varianti.length <= 1) return no('È l’ultimo colore: un capo senza colori non si può comprare.');
      const via = varianti[i];
      varianti.splice(i, 1);
      return {
        avvisi,
        tocca: ['products'],
        messaggio: `Colore «${loc(via.colour).it}» tolto.`,
        vaiA: { tipo: 'capo', slug: String(capo.slug) },
      };
    }

    const modello = r.azione === 'duplica' ? varianti.find((v) => v.id === r.variante) ?? null : null;
    if (r.azione === 'duplica' && !modello) return no('Quel colore non esiste.');

    const presi = new Set(varianti.map((v) => String(v.id)));
    const base = copia(modello ?? varianti[0]);
    base.id = libero(modello ? `${modello.id}-copia` : 'colore-nuovo', presi);
    const n = loc(base.colour);
    base.colour = modello
      ? { it: `${n.it} (copia)`, en: `${n.en} (copy)` }
      : { it: 'Colore nuovo', en: 'New colour' };

    varianti.splice(modello ? varianti.indexOf(modello) + 1 : varianti.length, 0, base);
    return {
      avvisi,
      tocca: ['products'],
      messaggio: modello ? `Copia del colore «${n.it}» creata.` : 'Colore nuovo creato.',
      vaiA: { tipo: 'capo', slug: String(capo.slug) },
    };
  }

  if (r.tipo === 'taglia') {
    const v = varianti.find((x) => x.id === r.variante);
    if (!v) return no('Quel colore non esiste.');
    const taglie = v.sizes as Rec[];

    if (r.azione === 'rimuovi') {
      const i = taglie.findIndex((t) => t.size === r.taglia);
      if (i < 0) return no('Quella taglia non esiste.');
      if (taglie.length <= 1) {
        return no('È l’ultima taglia di questo colore: non resterebbe niente da scegliere.');
      }
      taglie.splice(i, 1);
      return {
        avvisi,
        tocca: ['products'],
        messaggio: `Taglia ${r.taglia} tolta da «${loc(v.colour).it}».`,
        vaiA: { tipo: 'capo', slug: String(capo.slug) },
      };
    }

    const presi = new Set(taglie.map((t) => String(t.size)));
    const manca = SIGLE.find((s) => !presi.has(s));
    const sigla = r.taglia && !presi.has(r.taglia) ? r.taglia : manca ?? libero('TU', presi);
    /* nell'ordine giusto, non in fondo: XS dopo XXL sarebbe illeggibile */
    const ordine = (s: string) => {
      const k = SIGLE.indexOf(s);
      return k < 0 ? 99 : k;
    };
    const dove = taglie.findIndex((t) => ordine(String(t.size)) > ordine(sigla));
    taglie.splice(dove < 0 ? taglie.length : dove, 0, { size: sigla, availability: { state: 'in-stock' } });
    return {
      avvisi,
      tocca: ['products'],
      messaggio: `Taglia ${sigla} aggiunta a «${loc(v.colour).it}».`,
      vaiA: { tipo: 'capo', slug: String(capo.slug) },
    };
  }

  return no('Tipo sconosciuto.');
}
