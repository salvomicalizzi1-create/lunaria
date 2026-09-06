/**
 * Da una frase cliccata sul sito al campo che la scrive.
 *
 * La prima versione confrontava il testo cliccato con i testi salvati, e basta.
 * Funzionava solo sulle frasi fisse, cioè su meno di quello che sembrava:
 *
 *  · trentatré testi contengono un segnaposto — «Vedi {name}», «ne restano {n}»,
 *    e i plurali con dentro tre versioni diverse. A schermo diventano «Vedi
 *    Fasi» e «ne restano 4», che non somigliano a niente di salvato.
 *  · i nomi dei capi, i colori e i prezzi non stanno nei testi: stanno nel
 *    catalogo, e vanno cercati là.
 *  · le immagini non hanno testo affatto.
 *  · l'anteprima in inglese mostrava frasi inglesi, e io cercavo solo fra le
 *    italiane: cliccare non trovava mai niente.
 *  · e quando la stessa frase esiste in più punti — «Collezioni» sta nel menu,
 *    nel piè di pagina e nella scheda prodotto — sceglievo a caso.
 *
 * Qui c'è il rimedio a tutti e cinque.
 */

export type Trovato =
  | { tipo: 'testo'; chiave: string; certezza: number }
  | { tipo: 'capo'; slug: string; perche: string }
  | { tipo: 'collezione'; id: string; perche: string }
  | { tipo: 'luna'; numeral: string; perche: string }
  | { tipo: 'carta'; asse: string; indice: number; perche: string }
  | { tipo: 'immagine'; file: string }
  | { tipo: 'niente'; testo: string };

export type Contesto = {
  /** it o en: quello che l'anteprima sta mostrando */
  lingua: 'it' | 'en';
  testi: Record<string, string>;
  capi: { slug: string; name: { it: string; en: string }; image: string;
          variants: { colour: { it: string; en: string } }[] }[];
  collezioni: { id: string; name: { it: string; en: string }; meaning: { it: string; en: string };
                family: { it: string; en: string } }[];
  lune: { numeral: string; name: { it: string; en: string } }[];
  oracolo: { axes: { id: string }[]; deck: Record<string, { key: { it: string; en: string };
             value: { it: string; en: string }; reading: { it: string; en: string } }[]> };
  /** in quale parte della pagina si è cliccato: aiuta a sciogliere i pari merito */
  zona: 'header' | 'footer' | 'main' | null;
  /** la pagina in anteprima, per preferire i testi che ci vivono */
  pagina: string;
  /** namespace -> pagina dove si vede */
  paginaDi: Record<string, string>;
};

export const norm = (s: string) => s.replace(/\s+/g, ' ').trim();

/**
 * Un testo con i segnaposto diventa un'espressione che accetta qualunque cosa
 * al loro posto.
 *
 * I plurali richiedono una cura in più. In `{n, plural, =0 {Nessun capo} one
 * {Un capo} other {# capi}}` le frasi vere stanno dentro, e sono proprio quelle
 * che si leggono a schermo: «5 capi» viene da `other {# capi}`. La prima
 * versione buttava via l'intero blocco, e nessuno dei trentatré testi con un
 * numero dentro si trovava cliccandolo: «5 capi» finiva su «Prezzo
 * decrescente», che è il genere di errore che fa smettere di fidarsi.
 */
export function espressioni(valore: string): RegExp[] {
  if (!valore.includes('{')) return [];

  const gruppi: { inizio: number; fine: number; corpo: string }[] = [];
  let prof = 0;
  let apre = -1;
  for (let i = 0; i < valore.length; i++) {
    if (valore[i] === '{') { if (prof === 0) apre = i; prof += 1; }
    else if (valore[i] === '}') {
      prof -= 1;
      if (prof === 0 && apre >= 0) gruppi.push({ inizio: apre, fine: i + 1, corpo: valore.slice(apre + 1, i) });
    }
  }
  if (!gruppi.length) return [];

  const VUOTO = '\u0001';
  const alternative = (corpo: string): string[] => {
    if (!/^\s*\w+\s*,\s*(plural|select|selectordinal)\s*,/.test(corpo)) return [VUOTO];
    const out: string[] = [];
    let p = 0;
    let da = -1;
    for (let i = 0; i < corpo.length; i++) {
      if (corpo[i] === '{') { if (p === 0) da = i; p += 1; }
      else if (corpo[i] === '}') { p -= 1; if (p === 0 && da >= 0) out.push(corpo.slice(da + 1, i)); }
    }
    return out.length ? out : [VUOTO];
  };

  const primoPlurale = gruppi.find((g) => alternative(g.corpo)[0] !== VUOTO);
  const scelte = primoPlurale ? alternative(primoPlurale.corpo) : [VUOTO];

  const fatte: RegExp[] = [];
  for (const scelta of scelte) {
    let s = '';
    let cursore = 0;
    for (const g of gruppi) {
      s += valore.slice(cursore, g.inizio);
      s += g === primoPlurale ? scelta : VUOTO;
      cursore = g.fine;
    }
    s += valore.slice(cursore);

    // dentro un plurale, # è il numero
    const pezzi = s.split(VUOTO).map((p) =>
      p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/#/g, '\\d+'));
    if (pezzi.every((p) => !p.trim())) continue;   // tutto segnaposto: accetterebbe qualsiasi cosa
    try {
      fatte.push(new RegExp(`^\\s*${pezzi.join('[\\s\\S]{0,120}?')}\\s*$`, 'i'));
    } catch { /* espressione impossibile: si salta */ }
  }
  return fatte;
}


/** Quanto vale un candidato: più alto, meglio è. */
function punteggio(chiave: string, valore: string, testo: string, ctx: Contesto): number {
  const n = norm(valore);
  let p = 0;

  if (n === testo) p = 100;
  else if (n && (testo === `${n} ${n}` || testo === n + n)) p = 95;   // la copia nascosta delle fasce
  else {
    const re = espressioni(valore);
    if (re.some((r) => r.test(testo))) p = 85;
    else if (n.length > 3 && testo.includes(n)) p = 40 + Math.min(30, n.length / 4);
    else return -1;
  }

  const ns = chiave.split('.')[0];

  /* Dove si è cliccato scioglie i pari merito meglio di qualsiasi euristica sul
     testo: «Collezioni» nel menu in alto è nav, in fondo è footer. */
  if (ctx.zona === 'header' && ns === 'nav') p += 12;
  if (ctx.zona === 'footer' && ns === 'footer') p += 12;
  if (ctx.zona === 'header' && ns === 'footer') p -= 12;
  if (ctx.zona === 'footer' && ns === 'nav') p -= 12;

  /* e un testo che vive sulla pagina in anteprima batte il suo gemello altrove */
  if (ctx.paginaDi[ns] === ctx.pagina) p += 8;

  return p;
}

export function trova(raw: string, ctx: Contesto): Trovato {
  const testo = norm(raw);
  if (testo.length < 2) return { tipo: 'niente', testo };

  let migliore: { chiave: string; p: number } | null = null;
  for (const [chiave, valore] of Object.entries(ctx.testi)) {
    const p = punteggio(chiave, valore, testo, ctx);
    if (p > 0 && (!migliore || p > migliore.p)) migliore = { chiave, p };
  }
  if (migliore && migliore.p >= 80) {
    return { tipo: 'testo', chiave: migliore.chiave, certezza: migliore.p };
  }

  /* L'oracolo prima dei capi: le sue frasi sono esatte, mentre il confronto sui
     nomi dei capi è più largo e gliele portava via. */
  for (const asse of ctx.oracolo.axes) {
    const carte = ctx.oracolo.deck[asse.id] ?? [];
    for (let i = 0; i < carte.length; i++) {
      const c = carte[i];
      for (const [campo, etichetta] of [[c.key, 'il titolo della carta'], [c.value, 'la riga sotto il titolo'], [c.reading, 'la lettura']] as const) {
        if (norm(campo[ctx.lingua]) === testo) {
          return { tipo: 'carta', asse: asse.id, indice: i, perche: etichetta };
        }
      }
    }
  }

  /* Non è una frase del sito: forse è un capo. Nome, o colore di una variante. */
  for (const capo of ctx.capi) {
    const nome = norm(capo.name[ctx.lingua]);
    if (nome && testo === nome) {
      return { tipo: 'capo', slug: capo.slug, perche: 'il nome del capo' };
    }
    for (const v of capo.variants) {
      const col = norm(v.colour[ctx.lingua]);
      if (col && testo === col) return { tipo: 'capo', slug: capo.slug, perche: 'il colore di una variante' };
    }
  }

  for (const c of ctx.collezioni) {
    const nome = norm(c.name[ctx.lingua]);
    const motto = norm(c.meaning[ctx.lingua]);
    const fam = norm(c.family[ctx.lingua]);
    if (nome && testo === nome) return { tipo: 'collezione', id: c.id, perche: 'il nome della collezione' };
    if (motto && testo === motto) return { tipo: 'collezione', id: c.id, perche: 'il motto della collezione' };
    if (fam && testo.includes(fam)) return { tipo: 'collezione', id: c.id, perche: 'la famiglia di capi' };
  }

  for (const l of ctx.lune) {
    const nome = norm(l.name[ctx.lingua]);
    /* nel binario le uscite sono scritte tutte maiuscole */
    if (nome && (testo === nome || testo === nome.toUpperCase() || testo.toUpperCase() === nome.toUpperCase())) {
      return { tipo: 'luna', numeral: l.numeral, perche: 'il nome di un uscita' };
    }
  }

  /* un candidato debole vale comunque più di niente */
  if (migliore) return { tipo: 'testo', chiave: migliore.chiave, certezza: migliore.p };

  return { tipo: 'niente', testo };
}

/** Il file di un'immagine, dal suo indirizzo — anche passando dall'ottimizzatore. */
export function immagineDa(src: string): string | null {
  try {
    const u = new URL(src, 'http://x');
    const diretto = u.pathname.startsWith('/images/') ? u.pathname : null;
    const ottimizzata = u.searchParams.get('url');
    const path = diretto ?? (ottimizzata && decodeURIComponent(ottimizzata));
    if (!path || !path.startsWith('/images/')) return null;
    return path.slice('/images/'.length);
  } catch {
    return null;
  }
}
