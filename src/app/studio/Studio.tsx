'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { STUDIO_CSS } from './studio-css';
import { DOVE, PAGINA } from './dove';
import { trova, immagineDa, type Contesto, type Trovato } from './trova';
import {
  Collezioni, Lune, OracoloScheda, CampiCapo, Azioni, Aggiungi,
  type Edits, type Collezione, type Luna, type Oracolo, type CapoPieno,
  type Richiesta, type Struttura,
} from './Schede';

/* ------------------------------------------------------------------- tipi */

type Pair = { key: string; value: string };
type Availability = { state: string; left?: number };
type Size = { size: string; availability: Availability };
type Variant = { id: string; colour: { it: string; en: string }; sizes: Size[] };
type Product = {
  slug: string;
  name: { it: string; en: string };
  collection: string;
  priceCents: number;
  image: string;
  variants: Variant[];
};
type Img = { url: string; file: string; bytes: number };
type Data = {
  content: { it: Record<string, string>; en: Record<string, string> };
  /** per ogni chiave, le altre chiavi che oggi hanno lo stesso identico testo */
  sameText: Record<string, string[]>;
  /** chiavi che nessun componente del sito legge */
  morte: string[];
  products: (Product & CapoPieno)[];
  collections: Collezione[];
  moons: Luna[];
  oracle: Oracolo;
  colour: Pair[];
  type: Pair[];
  images: Img[];
};

type Tab = 'testi' | 'capi' | 'collezioni' | 'lune' | 'oracolo' | 'colori' | 'immagini';

type Device = 'computer' | 'telefono';

/* Larghezze vere, non approssimazioni: 1440 e' dove il sito mostra le fasce
   sopra il video, 390 e' dove mostra l'eroe fermo. Con l'anteprima stretta si
   vedeva solo la seconda, e meta' dei testi erano invisibili. */
const DEVICES: Record<Device, { w: number; h: number; label: string }> = {
  computer: { w: 1440, h: 900, label: 'Computer' },
  telefono: { w: 390, h: 844, label: 'Telefono' },
};

const TABS: { id: Tab; label: string }[] = [
  { id: 'testi', label: 'Testi' },
  { id: 'capi', label: 'Capi' },
  { id: 'collezioni', label: 'Collezioni' },
  { id: 'lune', label: 'Lune' },
  { id: 'oracolo', label: 'Oracolo' },
  { id: 'colori', label: 'Colori e misure' },
  { id: 'immagini', label: 'Immagini' },
];

const STATI: { value: string; label: string }[] = [
  { value: 'in-stock', label: 'Disponibile' },
  { value: 'low-stock', label: 'Ne restano pochi' },
  { value: 'out-of-stock', label: 'Esaurita' },
];

/* i soldi si scrivono in euro e si salvano in centesimi: chiedere i centesimi
   a chi compila un modulo è come chiedergli di parlare in byte */
const toEuro = (cents: number) => (cents / 100).toFixed(2).replace('.', ',');
const fromEuro = (s: string): number | null => {
  const n = Number(s.replace(/\s/g, '').replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
};

/* ============================================================== il pannello */

export function Studio() {
  const [data, setData] = useState<Data | null>(null);
  const [tab, setTab] = useState<Tab>('testi');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'err'; lines: string[] } | null>(null);
  const [previewLocale, setPreviewLocale] = useState<'it' | 'en'>('it');
  const [frameKey, setFrameKey] = useState(0);
  const [previewPath, setPreviewPath] = useState('/');
  const [restored, setRestored] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [device, setDevice] = useState<Device>('computer');
  const [scale, setScale] = useState(1);
  const stageRef = useRef<HTMLDivElement>(null);

  /* Salvare cambia un file del progetto, e lo sviluppo ricarica la pagina non
     appena se ne accorge. È giusto che lo faccia — così l'anteprima mostra la
     verità — ma senza questo ti ributterebbe in cima alla prima scheda a ogni
     salvataggio, che dopo venti modifiche è insopportabile. Quindi dove eri
     sopravvive al ricaricamento. */
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('lunaria-studio-ui');
      if (saved) {
        const s = JSON.parse(saved) as { tab?: Tab; locale?: 'it' | 'en'; path?: string };
        if (s.tab) setTab(s.tab);
        if (s.locale) setPreviewLocale(s.locale);
        if (s.path) setPreviewPath(s.path);
      }
      const last = sessionStorage.getItem('lunaria-studio-msg');
      if (last) {
        const m = JSON.parse(last) as { tone: 'ok' | 'err'; lines: string[]; at: number };
        // solo se è appena successo: un esito di ieri non dice niente
        if (Date.now() - m.at < 8000) setMsg({ tone: m.tone, lines: m.lines });
        sessionStorage.removeItem('lunaria-studio-msg');
      }
    } catch { /* prima visita, o memoria non disponibile */ }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      sessionStorage.setItem(
        'lunaria-studio-ui',
        JSON.stringify({ tab, locale: previewLocale, path: previewPath }),
      );
    } catch { /* niente da fare, e non è grave */ }
  }, [restored, tab, previewLocale, previewPath]);

  /* le modifiche non ancora salvate, per scheda */
  const [textEdits, setTextEdits] = useState<Record<string, Record<string, string>>>({ it: {}, en: {} });
  const [prodEdits, setProdEdits] = useState<Record<string, Partial<Product>>>({});
  const [tokenEdits, setTokenEdits] = useState<Record<string, { block: 'colour' | 'type'; value: string }>>({});
  const [recEdits, setRecEdits] = useState<Edits>({});

  const load = useCallback(async () => {
    const r = await fetch('/api/studio/data');
    setData(await r.json());
  }, []);
  useEffect(() => { void load(); }, [load]);

  const dirty =
    Object.keys(textEdits.it).length + Object.keys(textEdits.en).length +
    Object.keys(prodEdits).length + Object.keys(tokenEdits).length + Object.keys(recEdits).length;

  /* quanto va rimpicciolita per stare nello spazio disponibile */
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const misura = () => {
      const r = el.getBoundingClientRect();
      const k = Math.min(r.width / DEVICES[device].w, r.height / DEVICES[device].h, 1);
      setScale(Number.isFinite(k) && k > 0 ? k : 1);
    };
    misura();
    const ro = new ResizeObserver(misura);
    ro.observe(el);
    return () => ro.disconnect();
  }, [device, data]);

  /* ------------------------------------------------------- punta e clicca
     Clicchi una frase sul sito e ti porto sul campo che la scrive.
     È la cosa che avrebbe evitato tutto il resto: finché si sceglie il campo da
     una lista si può sempre scegliere quello sbagliato — un residuo che nessuno
     legge, o il gemello che vive su un'altra pagina. Partendo dalla frase che
     hai davanti agli occhi, quell'errore non è più possibile. */
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [picking, setPicking] = useState(false);
  const [picked, setPicked] = useState<{ key: string; n: number } | null>(null);
  const [pickedCapo, setPickedCapo] = useState<{ slug: string; n: number } | null>(null);
  const [pickedImg, setPickedImg] = useState<{ file: string; n: number } | null>(null);
  const [pickedColl, setPickedColl] = useState<{ id: string; n: number } | null>(null);
  const [pickedLuna, setPickedLuna] = useState<{ n: string; k: number } | null>(null);
  const [pickedCarta, setPickedCarta] = useState<{ id: string; n: number } | null>(null);

  const cerca = useCallback((raw: string, zona: Contesto['zona']): Trovato => {
    if (!data) return { tipo: 'niente', testo: raw };
    return trova(raw, {
      lingua: previewLocale,
      testi: data.content[previewLocale],      // l'anteprima in inglese cerca fra gli inglesi
      capi: data.products,
      collezioni: data.collections,
      lune: data.moons,
      oracolo: data.oracle,
      zona,
      pagina: previewPath,
      paginaDi: PAGINA,
    });
  }, [data, previewLocale, previewPath]);

  useEffect(() => {
    const f = frameRef.current;
    if (!f) return;
    let doc: Document | null = null;
    let evidenziato: Element | null = null;
    let ritardo = 0;

    const spegni = () => {
      if (!doc) return;
      window.clearTimeout(ritardo);
      doc.querySelectorAll('a[data-href-sospeso]').forEach((a) => {
        a.setAttribute('href', a.getAttribute('data-href-sospeso') ?? '');
        a.removeAttribute('data-href-sospeso');
      });
      doc.getElementById('lunaria-picker')?.remove();
      doc.querySelectorAll('.lunaria-hi').forEach((e) => e.classList.remove('lunaria-hi'));
      doc.removeEventListener('mouseover', sopra, true);
      doc.removeEventListener('click', clic, true);
    };
    function sopra(e: Event) {
      evidenziato?.classList.remove('lunaria-hi');
      evidenziato = e.target as Element;
      evidenziato.classList.add('lunaria-hi');
    }
    function clic(e: Event) {
      e.preventDefault();
      e.stopPropagation();
      /* Next naviga da codice, non con il collegamento del browser: fermare
         l'azione predefinita non basta, va fermato l'evento prima che il suo
         gestore lo veda. Senza questo, cliccare «Collezioni» per modificarla
         portava l'anteprima altrove — e da lì in poi si guardava la pagina
         sbagliata senza accorgersene. */
      e.stopImmediatePropagation();
      const bersaglio = e.target as Element;

      /* un'immagine non ha testo: si riconosce dall'indirizzo, anche quando
         passa dall'ottimizzatore che ne cambia forma */
      const img = bersaglio.closest('img') as HTMLImageElement | null;
      if (img) {
        const file = immagineDa(img.currentSrc || img.src);
        if (file) { setTab('immagini'); setPickedImg({ file, n: Date.now() }); return; }
      }

      const zona: Contesto['zona'] =
        bersaglio.closest('header') ? 'header'
          : bersaglio.closest('footer') ? 'footer'
            : bersaglio.closest('main') ? 'main' : null;

      let el: Element | null = bersaglio;
      let ripiego: Trovato | null = null;
      for (let i = 0; i < 7 && el; i++) {
        const r = cerca(el.textContent ?? '', zona);
        if (r.tipo === 'testo' && r.certezza >= 80) {
          setTab('testi'); setPicked({ key: r.chiave, n: Date.now() }); return;
        }
        if (r.tipo === 'carta') {
          setTab('oracolo'); setPickedCarta({ id: r.asse + '-' + r.indice, n: Date.now() }); return;
        }
        if (r.tipo === 'collezione') {
          setTab('collezioni'); setPickedColl({ id: r.id, n: Date.now() }); return;
        }
        if (r.tipo === 'luna') {
          setTab('lune'); setPickedLuna({ n: r.numeral, k: Date.now() }); return;
        }
        if (r.tipo === 'capo') {
          setTab('capi'); setPickedCapo({ slug: r.slug, n: Date.now() }); return;
        }
        if (r.tipo === 'testo' && !ripiego) ripiego = r;   // il migliore dubbio incontrato
        el = el.parentElement;
      }

      /* meglio un campo probabile, detto come tale, che un rifiuto secco */
      if (ripiego && ripiego.tipo === 'testo') {
        setTab('testi');
        setPicked({ key: ripiego.chiave, n: Date.now() });
        setMsg({ tone: 'ok', lines: ['Non ne sono certo: ti ho aperto il campo più probabile.'] });
        return;
      }

      const testo = (bersaglio.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 60);
      setMsg({
        tone: 'err',
        lines: [
          testo
            ? `«${testo}» non viene da un testo modificabile.`
            : 'Qui non c\'è un testo modificabile.',
          'Di solito è un numero calcolato dal sito — una data, un conto alla rovescia, un prezzo — oppure una parte grafica. Prova a cliccare la parola accanto.',
        ],
      });
    }

    const attacca = () => {
      doc = f.contentDocument;
      if (!doc) return;
      spegni();
      if (!picking) return;
      const st = doc.createElement('style');
      st.id = 'lunaria-picker';
      st.textContent = `*{cursor:crosshair!important}
        .lunaria-hi{outline:2px solid #D9B26A!important;outline-offset:2px!important;
                    background:rgba(217,178,106,.14)!important}`;
      doc.head.appendChild(st);
      doc.addEventListener('mouseover', sopra, true);
      doc.addEventListener('click', clic, true);

      /* Fermare l'evento non basta: React registra il suo ascoltatore prima del
         mio, quindi il collegamento di Next naviga comunque, e il router non
         passa da history.pushState — l'ho provato. L'unica cosa che lo ferma
         davvero è togliere la destinazione ai collegamenti.
         Lo faccio mezzo secondo dopo il caricamento: farlo subito significa
         cambiare la pagina mentre React la sta idratando, e React se ne lamenta
         a ragione. */
      const sospendi = () => {
        doc?.querySelectorAll('a[href]').forEach((a) => {
          a.setAttribute('data-href-sospeso', a.getAttribute('href') ?? '');
          a.removeAttribute('href');
        });
      };
      ritardo = window.setTimeout(sospendi, 500)
    };

    f.addEventListener('load', attacca);
    attacca();                                   // il caricamento può essere già avvenuto
    return () => { f.removeEventListener('load', attacca); spegni(); };
  }, [picking, frameKey, cerca]);

  const refreshPreview = () => setFrameKey((k) => k + 1);

  /**
   * Ricarica l'anteprima quando il server ha davvero il testo nuovo.
   *
   * Prima aspettavo quattro decimi di secondo e ricaricavo. Sembrava
   * abbastanza e non lo era: in quel momento lo sviluppo sta ancora
   * ricompilando, l'anteprima si ricaricava sulla versione vecchia, e nessuno
   * riprovava più. Chi guardava vedeva «Salvato» e la pagina immutata.
   *
   * Adesso chiedo al server la pagina finché non contiene quello che ho appena
   * salvato — al massimo per otto secondi — e solo allora ricarico. Se il testo
   * non compare (un capo, un colore, una pagina diversa da quella in anteprima)
   * ricarico comunque: peggio di prima non può andare.
   */
  const attesaRef = useRef(false);
  async function refreshWhenReady(atteso?: string, pagina?: string) {
    if (attesaRef.current) return;
    attesaRef.current = true;
    setWaiting(true);
    const url = `/${previewLocale}${pagina ?? previewPath}`;
    try {
      for (let i = 0; i < 27; i++) {
        await new Promise((r) => setTimeout(r, 300));
        try {
          const r = await fetch(url, { cache: 'no-store' });
          if (!r.ok) continue;                    // sta ancora ricompilando
          if (!atteso) break;
          if ((await r.text()).includes(atteso)) break;
        } catch { /* il server e giu per un istante, riprovo */ }
      }
    } finally {
      attesaRef.current = false;
      setWaiting(false);
      refreshPreview();
    }
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      let saved = 0;
      const errors: string[] = [];

      if (Object.keys(textEdits.it).length || Object.keys(textEdits.en).length) {
        const r = await fetch('/api/studio/content', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify(textEdits),
        });
        const j = await r.json();
        saved += j.saved ?? 0;
        errors.push(...(j.rejected ?? []));
      }

      if (Object.keys(prodEdits).length) {
        const edits = Object.entries(prodEdits).map(([slug, p]) => ({
          slug,
          priceCents: p.priceCents,
          name: p.name,
          sizes: (p.variants ?? []).flatMap((v) =>
            v.sizes.map((s) => ({
              variantId: v.id, size: s.size,
              state: s.availability.state, left: s.availability.left,
            })),
          ),
        }));
        const r = await fetch('/api/studio/products', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ edits }),
        });
        const j = await r.json();
        saved += j.saved ?? 0;
        errors.push(...(j.errors ?? []));
      }

      if (Object.keys(recEdits).length) {
        const perFile: Record<string, { path: (string | number)[]; value: string | number }[]> = {};
        for (const e of Object.values(recEdits)) (perFile[e.file] ??= []).push({ path: e.path, value: e.value });
        for (const [file, lista] of Object.entries(perFile)) {
          const r = await fetch('/api/studio/record', {
            method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ file, edits: lista }),
          });
          const j = await r.json();
          saved += j.saved ?? 0;
          errors.push(...(j.errors ?? []));
        }
      }

      if (Object.keys(tokenEdits).length) {
        const edits = Object.entries(tokenEdits).map(([key, v]) => ({ block: v.block, key, value: v.value }));
        const r = await fetch('/api/studio/tokens', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ edits }),
        });
        const j = await r.json();
        saved += j.saved ?? 0;
        errors.push(...(j.errors ?? []));
      }

      const result: { tone: 'ok' | 'err'; lines: string[] } = errors.length
        ? { tone: 'err', lines: errors }
        : { tone: 'ok', lines: [`Salvato. ${saved} ${saved === 1 ? 'modifica' : 'modifiche'}.`] };
      setMsg(result);
      /* la pagina sta per ricaricarsi da sola: senza questo l'esito sparirebbe
         prima che tu faccia in tempo a leggerlo */
      try {
        sessionStorage.setItem('lunaria-studio-msg', JSON.stringify({ ...result, at: Date.now() }));
      } catch { /* pazienza */ }

      /* Una delle frasi appena salvate, da cercare nella pagina servita per
         sapere quando il server ha finito di ricompilare. E soprattutto: la
         pagina GIUSTA dove guardarla. Modificare il testo di un carrello
         tenendo la home in anteprima dà «salvato» e nessun cambiamento, ed è
         indistinguibile da un difetto. */
      const primaChiave = Object.keys(textEdits[previewLocale] ?? {})[0]
        ?? Object.keys(textEdits.it)[0];
      const atteso = primaChiave
        ? (textEdits[previewLocale]?.[primaChiave] ?? textEdits.it[primaChiave])
        : undefined;

      let dove = previewPath;
      if (primaChiave) {
        const pagina = PAGINA[primaChiave.split('.')[0]];
        if (pagina && pagina !== previewPath) {
          dove = pagina;
          setPreviewPath(pagina);
        }
      }

      if (!errors.length) {
        setTextEdits({ it: {}, en: {} });
        setProdEdits({});
        setTokenEdits({});
        setRecEdits({});
      }
      await load();
      void refreshWhenReady(errors.length ? undefined : atteso, dove);
    } catch (e) {
      setMsg({ tone: 'err', lines: [String((e as Error).message)] });
    } finally {
      setBusy(false);
    }
  }

  /**
   * Aggiungi, duplica, togli.
   *
   * A differenza di «Salva», che manda solo i campi cambiati, questa riscrive
   * un file intero: se ci fossero modifiche aperte nel pannello sparirebbero
   * senza dire niente, perché il ricaricamento subito dopo le sovrascrive con
   * quello che è appena finito su disco. Perciò si ferma prima e lo dice.
   *
   * C'è anche un motivo più sottile: i campi lunghi di un capo sono indirizzati
   * per posizione nell'elenco — `products[7].meaning` — e inserire un capo
   * sposta tutti quelli dopo di lui. Una modifica aperta finirebbe sul capo
   * sbagliato. Salvare prima toglie il problema alla radice.
   */
  const struttura = useCallback<Struttura>(
    (r: Richiesta) => {
      void (async () => {
        if (dirty > 0) {
          setMsg({
            tone: 'err',
            lines: [
              `Ci sono ${dirty} modifiche non salvate.`,
              'Aggiungere o togliere riscrive il file intero: salva prima, così non se ne perde nessuna.',
            ],
          });
          return;
        }
        setBusy(true);
        try {
          const res = await fetch('/api/studio/struttura', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(r),
          });
          const esito = await res.json();
          if (!res.ok) {
            setMsg({ tone: 'err', lines: [String(esito.error ?? 'non è riuscito')] });
            return;
          }
          setMsg({ tone: 'ok', lines: [String(esito.messaggio), ...(esito.avvisi ?? []).map(String)] });
          await load();

          /* porta il pannello sulla cosa appena creata, come fa il puntatore */
          const v = esito.vaiA as { tipo: string; slug?: string; id?: string; numeral?: string; asse?: string; indice?: number } | null;
          const n = Date.now();
          if (v?.tipo === 'capo' && v.slug) { setTab('capi'); setPickedCapo({ slug: v.slug, n }); }
          if (v?.tipo === 'collezione' && v.id) { setTab('collezioni'); setPickedColl({ id: v.id, n }); }
          if (v?.tipo === 'luna' && v.numeral) { setTab('lune'); setPickedLuna({ n: v.numeral, k: n }); }
          if (v?.tipo === 'carta' && v.asse !== undefined) {
            setTab('oracolo');
            setPickedCarta({ id: `${v.asse}-${v.indice}`, n });
          }

          void refreshWhenReady(undefined, previewPath);
        } catch (e) {
          setMsg({ tone: 'err', lines: [String((e as Error).message)] });
        } finally {
          setBusy(false);
        }
      })();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dirty, load, previewPath],
  );

  if (!data) {
    return (
      <>
        <style href="lunaria-studio" precedence="default" dangerouslySetInnerHTML={{ __html: STUDIO_CSS }} />
        <div className="st-loading">Apro il progetto…</div>
      </>
    );
  }

  return (
    <>
      {/* React 19 vuole sapere dove va e come si deduplica uno stile nell albero */}
      <style href="lunaria-studio" precedence="default" dangerouslySetInnerHTML={{ __html: STUDIO_CSS }} />
      <div className="st">
        <header className="st-bar">
          <span className="st-brand">LUNARIA <b>studio</b></span>
          <nav className="st-tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={t.id === tab ? 'st-tab st-tab--on' : 'st-tab'}
                onClick={() => setTab(t.id)}
                type="button"
              >
                {t.label}
              </button>
            ))}
          </nav>
          <span className="st-dirty">
            {waiting ? 'aggiorno l’anteprima…' : dirty > 0 ? `${dirty} da salvare` : 'tutto salvato'}
          </span>
          <button className="st-save" onClick={save} disabled={busy || dirty === 0} type="button">
            {busy ? 'Salvo…' : 'Salva'}
          </button>
        </header>

        {msg && (
          <div className={msg.tone === 'ok' ? 'st-msg st-msg--ok' : 'st-msg st-msg--err'} role="status">
            {msg.lines.map((l, i) => <p key={i}>{l}</p>)}
            <button type="button" onClick={() => setMsg(null)} aria-label="chiudi">✕</button>
          </div>
        )}

        <div className="st-body">
          <section className="st-editor">
            {tab === 'testi' && (
              <Testi data={data} edits={textEdits} setEdits={setTextEdits} vaiA={setPreviewPath} picked={picked} />
            )}
            {tab === 'capi' && (
              <Capi data={data} edits={prodEdits} setEdits={setProdEdits} onOpen={setPreviewPath}
                    recEdits={recEdits} setRecEdits={setRecEdits} puntato={pickedCapo?.slug}
                    struttura={struttura} />
            )}
            {tab === 'collezioni' && (
              <Collezioni dati={data.collections} edits={recEdits} setEdits={setRecEdits}
                          puntato={pickedColl?.id} struttura={struttura} />
            )}
            {tab === 'lune' && (
              <Lune dati={data.moons} edits={recEdits} setEdits={setRecEdits} puntato={pickedLuna?.n}
                    struttura={struttura} />
            )}
            {tab === 'oracolo' && (
              <OracoloScheda dati={data.oracle} edits={recEdits} setEdits={setRecEdits}
                             puntato={pickedCarta?.id} struttura={struttura} />
            )}
            {tab === 'colori' && (
              <Colori data={data} edits={tokenEdits} setEdits={setTokenEdits} />
            )}
            {tab === 'immagini' && (
              <Immagini data={data} reload={load} refresh={refreshPreview} setMsg={setMsg}
                        puntato={pickedImg?.file} />
            )}
          </section>

          <section className="st-preview">
            <div className="st-preview__bar">
              <div className="st-seg">
                {(['it', 'en'] as const).map((l) => (
                  <button
                    key={l} type="button"
                    className={l === previewLocale ? 'on' : ''}
                    onClick={() => setPreviewLocale(l)}
                  >{l.toUpperCase()}</button>
                ))}
              </div>
              <div className="st-seg">
                {(Object.keys(DEVICES) as Device[]).map((d) => (
                  <button
                    key={d} type="button"
                    className={d === device ? 'on' : ''}
                    onClick={() => setDevice(d)}
                  >{DEVICES[d].label}</button>
                ))}
              </div>
              <input
                className="st-path" value={previewPath}
                onChange={(e) => setPreviewPath(e.target.value)}
                aria-label="pagina da mostrare"
              />
              <button
                type="button"
                className={picking ? 'st-pick st-pick--on' : 'st-pick'}
                onClick={() => setPicking((p) => !p)}
                title="clicca una frase sul sito e ti porto sul campo che la scrive"
              >
                {picking ? '◉ Punta e clicca' : '◎ Punta e clicca'}
              </button>
              <button type="button" onClick={() => void refreshWhenReady()}>Ricarica</button>
              <a href={`/${previewLocale}${previewPath}`} target="_blank" rel="noreferrer">Apri ↗</a>
            </div>
            {picking && (
              <p className="st-pick__hint">
                Passa sopra il sito e clicca la frase che vuoi cambiare: apro il campo giusto.
              </p>
            )}
            {/* L'anteprima rende alla larghezza VERA del dispositivo scelto e
                viene rimpicciolita per stare nello spazio. Prima occupava e
                basta la metà destra — ottocento pixel in verticale — e il sito
                faceva la cosa giusta mostrando la versione da telefono: le
                fasce sopra il video sono nascoste lì, quindi modificarle non
                produceva alcun effetto visibile. Mai. */}
            <div className="st-stage" ref={stageRef}>
              <iframe
                key={frameKey}
                ref={frameRef}
                className="st-frame"
                src={`/${previewLocale}${previewPath}`}
                title="anteprima del sito"
                style={{
                  width: DEVICES[device].w,
                  height: DEVICES[device].h,
                  transform: `scale(${scale})`,
                }}
              />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

/* ================================================================== testi */

function Testi({
  data, edits, setEdits, vaiA, picked,
}: {
  data: Data;
  edits: Record<string, Record<string, string>>;
  setEdits: React.Dispatch<React.SetStateAction<Record<string, Record<string, string>>>>;
  vaiA: (p: string) => void;
  picked: { key: string; n: number } | null;
}) {
  const [filter, setFilter] = useState('');
  const [open, setOpen] = useState<string | null>('hero');

  /* Il puntatore ha scelto una frase sul sito: la porto sotto gli occhi e le do
     il fuoco, cosi si puo scrivere subito senza cercare altro. */
  useEffect(() => {
    if (!picked) return;
    const ns = picked.key.split('.')[0];
    setOpen(ns);
    setFilter(data.content.it[picked.key] ?? picked.key);
    const t = setTimeout(() => {
      const riga = document.querySelector<HTMLElement>('[data-chiave="' + picked.key + '"]');
      riga?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      riga?.querySelector('textarea')?.focus();
      riga?.classList.add('st-row--puntata');
      setTimeout(() => riga?.classList.remove('st-row--puntata'), 2200);
    }, 260);
    return () => clearTimeout(t);
  }, [picked, data]);

  /* anche la ricerca e il gruppo aperto sopravvivono al ricaricamento */
  useEffect(() => {
    try {
      const s = sessionStorage.getItem('lunaria-studio-testi');
      if (s) {
        const v = JSON.parse(s) as { filter?: string; open?: string | null };
        if (v.filter) setFilter(v.filter);
        if (v.open !== undefined) setOpen(v.open);
      }
    } catch { /* niente */ }
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem('lunaria-studio-testi', JSON.stringify({ filter, open }));
    } catch { /* niente */ }
  }, [filter, open]);

  const groups = useMemo(() => {
    const g: Record<string, string[]> = {};
    for (const key of Object.keys(data.content.it)) {
      const ns = key.split('.')[0];
      (g[ns] ??= []).push(key);
    }
    return g;
  }, [data]);

  const morte = useMemo(() => new Set(data.morte ?? []), [data]);
  const needle = filter.trim().toLowerCase();
  const matches = (key: string) =>
    !needle ||
    key.toLowerCase().includes(needle) ||
    (data.content.it[key] ?? '').toLowerCase().includes(needle) ||
    (data.content.en[key] ?? '').toLowerCase().includes(needle);

  const val = (loc: 'it' | 'en', key: string) => edits[loc][key] ?? data.content[loc][key] ?? '';
  const changed = (key: string) => edits.it[key] !== undefined || edits.en[key] !== undefined;

  const edit = (loc: 'it' | 'en', key: string, v: string) =>
    setEdits((prev) => {
      const next = { ...prev, [loc]: { ...prev[loc] } };
      if (v === data.content[loc][key]) delete next[loc][key];
      else next[loc][key] = v;
      return next;
    });

  /* La stessa frase in più punti è la ragione numero uno per cui un salvataggio
     sembra non aver funzionato: ne cambi uno, guardi il sito, e vedi ancora il
     vecchio testo perché quello che stavi guardando era un altro. */
  const editEverywhere = (loc: 'it' | 'en', key: string, v: string) => {
    const others = data.sameText[key] ?? [];
    setEdits((prev) => {
      const next = { ...prev, [loc]: { ...prev[loc] } };
      for (const k of [key, ...others]) {
        if (v === data.content[loc][k]) delete next[loc][k];
        else next[loc][k] = v;
      }
      return next;
    });
  };

  return (
    <>
      <div className="st-tools">
        <input
          className="st-search" placeholder="Cerca una frase o un nome…"
          value={filter} onChange={(e) => setFilter(e.target.value)}
        />
        <p className="st-hint">
          Scrivi qui una frase che vedi sul sito per trovarla. Le due lingue stanno
          affiancate: cambiane una sola e l&rsquo;altra resta com&rsquo;è.
        </p>
      </div>

      {Object.entries(groups).map(([ns, keys]) => {
        const visible = keys.filter(matches);
        if (visible.length === 0) return null;
        const isOpen = needle ? true : open === ns;
        return (
          <div className="st-group" key={ns}>
            <button
              className="st-group__h" type="button"
              onClick={() => setOpen(open === ns ? null : ns)}
              aria-expanded={isOpen}
            >
              <span>
                {ns}
                {DOVE[ns] && <em className="st-dove">{DOVE[ns]}</em>}
              </span>
              <span className="st-count">{visible.length}</span>
            </button>
            {isOpen && PAGINA[ns] && (
              <button
                className="st-vai" type="button"
                onClick={() => vaiA(PAGINA[ns])}
                title="porta l anteprima sulla pagina dove si vede questo gruppo"
              >
                Mostra questa pagina nell’anteprima <b>{PAGINA[ns]}</b>
              </button>
            )}
            {isOpen && (
              <div className="st-group__b">
                {visible.map((key) => {
                  const others = data.sameText[key] ?? [];
                  return (
                    <div className={changed(key) ? 'st-row st-row--dirty' : 'st-row'} key={key} data-chiave={key}>
                      <label className="st-key">{key.slice(ns.length + 1) || key}</label>
                      <div className="st-two">
                        <div>
                          <span className="st-loc">IT</span>
                          <textarea
                            value={val('it', key)} rows={Math.min(6, Math.ceil(val('it', key).length / 52) || 1)}
                            onChange={(e) => edit('it', key, e.target.value)}
                          />
                        </div>
                        <div>
                          <span className="st-loc">EN</span>
                          <textarea
                            value={val('en', key)} rows={Math.min(6, Math.ceil(val('en', key).length / 52) || 1)}
                            onChange={(e) => edit('en', key, e.target.value)}
                          />
                        </div>
                      </div>

                      {morte.has(key) && (
                        <div className="st-morta">
                          Questo testo <b>non compare da nessuna parte nel sito</b>: nessuna
                          pagina lo legge. Puoi cambiarlo, ma non vedrai niente.
                        </div>
                      )}

                      {others.length > 0 && (
                        <div className="st-dup">
                          <span>
                            Questa stessa frase compare in {others.length === 1 ? 'un altro punto' : `altri ${others.length} punti`}:{' '}
                            <b>{others.map((o) => o.split('.')[0]).join(', ')}</b>. Cambiando qui
                            cambi solo questo.
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              editEverywhere('it', key, val('it', key));
                              editEverywhere('en', key, val('en', key));
                            }}
                          >
                            Cambia in tutti i punti
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

/* =================================================================== capi */

function Capi({
  data, edits, setEdits, onOpen, recEdits, setRecEdits, puntato, struttura,
}: {
  data: Data;
  edits: Record<string, Partial<Product>>;
  setEdits: React.Dispatch<React.SetStateAction<Record<string, Partial<Product>>>>;
  onOpen: (path: string) => void;
  recEdits: Edits;
  setRecEdits: React.Dispatch<React.SetStateAction<Edits>>;
  puntato?: string;
  struttura: Struttura;
}) {
  const [filter, setFilter] = useState('');

  /* il puntatore ha scelto un capo: lo porto sotto gli occhi */
  useEffect(() => {
    if (!puntato) return;
    setFilter('');
    const t = setTimeout(() => {
      const el = document.querySelector<HTMLElement>(`[data-capo="${puntato}"]`);
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      el?.classList.add('st-row--puntata');
      setTimeout(() => el?.classList.remove('st-row--puntata'), 2200);
    }, 220);
    return () => clearTimeout(t);
  }, [puntato]);

  const needle = filter.trim().toLowerCase();

  const current = (p: Product): Product => ({ ...p, ...edits[p.slug] });

  const patch = (slug: string, change: Partial<Product>) =>
    setEdits((prev) => ({ ...prev, [slug]: { ...prev[slug], ...change } }));

  const setSize = (p: Product, variantId: string, size: string, availability: Availability) => {
    const c = current(p);
    const variants = c.variants.map((v) =>
      v.id !== variantId ? v : { ...v, sizes: v.sizes.map((s) => (s.size === size ? { ...s, availability } : s)) },
    );
    patch(p.slug, { variants });
  };

  return (
    <>
      <div className="st-tools">
        <input
          className="st-search" placeholder="Cerca un capo…"
          value={filter} onChange={(e) => setFilter(e.target.value)}
        />
        <Aggiungi onClick={() => struttura({ azione: 'aggiungi', tipo: 'capo' })}>Capo nuovo</Aggiungi>
        <p className="st-hint">
          Il prezzo si scrive in euro, come lo leggi sul sito. Le taglie esaurite
          spariscono dai pulsanti della scheda. <b>Duplica</b> è il modo più
          rapido di aggiungerne uno: parte da un capo che esiste, con le sue
          taglie e la sua etichetta dell&rsquo;oracolo già a posto.
        </p>
      </div>

      {data.products
        .filter((p) => !needle || p.name.it.toLowerCase().includes(needle) || p.slug.includes(needle))
        .map((p) => {
          const c = current(p);
          const isDirty = edits[p.slug] !== undefined;
          return (
            <div className={isDirty ? 'st-card st-card--dirty' : 'st-card'} key={p.slug} data-capo={p.slug}>
              <div className="st-card__h">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt="" width={44} height={55} />
                <div className="st-card__t">
                  <input
                    className="st-name" value={c.name.it}
                    onChange={(e) => patch(p.slug, { name: { ...c.name, it: e.target.value } })}
                  />
                  <input
                    className="st-name st-name--en" value={c.name.en}
                    onChange={(e) => patch(p.slug, { name: { ...c.name, en: e.target.value } })}
                  />
                </div>
                <label className="st-price">
                  <span>€</span>
                  <input
                    inputMode="decimal"
                    defaultValue={toEuro(c.priceCents)}
                    onBlur={(e) => {
                      const cents = fromEuro(e.target.value);
                      if (cents === null) { e.target.value = toEuro(c.priceCents); return; }
                      e.target.value = toEuro(cents);
                      if (cents !== p.priceCents) patch(p.slug, { priceCents: cents });
                    }}
                  />
                </label>
                <button className="st-see" type="button" onClick={() => onOpen(`/prodotto/${p.slug}`)}>
                  Vedi
                </button>
                <Azioni
                  nome={`il capo ${p.name.it}`}
                  onDuplica={() => struttura({ azione: 'duplica', tipo: 'capo', slug: p.slug })}
                  onRimuovi={() => struttura({ azione: 'rimuovi', tipo: 'capo', slug: p.slug })}
                />
              </div>

              <CampiCapo capo={p as unknown as CapoPieno} indice={data.products.indexOf(p)}
                         edits={recEdits} setEdits={setRecEdits} />

              {c.variants.map((v) => (
                <div className="st-variant" key={v.id}>
                  <span className="st-vname">{v.colour.it}</span>
                  <Azioni
                    piccolo
                    nome={`il colore ${v.colour.it} di ${p.name.it}`}
                    onDuplica={() => struttura({ azione: 'duplica', tipo: 'variante', slug: p.slug, variante: v.id })}
                    onRimuovi={() => struttura({ azione: 'rimuovi', tipo: 'variante', slug: p.slug, variante: v.id })}
                  />
                  <div className="st-sizes">
                    {v.sizes.map((s) => (
                      <div className="st-size" key={s.size}>
                        <span>{s.size}</span>
                        <select
                          value={s.availability.state}
                          onChange={(e) => setSize(p, v.id, s.size, e.target.value === 'low-stock'
                            ? { state: 'low-stock', left: s.availability.left ?? 3 }
                            : { state: e.target.value })}
                        >
                          {STATI.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        {s.availability.state === 'low-stock' && (
                          <input
                            className="st-left" type="number" min={1} max={99}
                            value={s.availability.left ?? 1}
                            onChange={(e) => setSize(p, v.id, s.size, {
                              state: 'low-stock', left: Math.max(1, Number(e.target.value) || 1),
                            })}
                          />
                        )}
                        <button
                          type="button" className="st-via" aria-label={`Togli la taglia ${s.size} da ${v.colour.it}`}
                          title={`Togli la taglia ${s.size}`}
                          onClick={() => struttura({
                            azione: 'rimuovi', tipo: 'taglia', slug: p.slug, variante: v.id, taglia: s.size,
                          })}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      type="button" className="st-piu-taglia"
                      onClick={() => struttura({ azione: 'aggiungi', tipo: 'taglia', slug: p.slug, variante: v.id })}
                    >
                      + taglia
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button" className="st-aggiungi st-aggiungi--dentro"
                onClick={() => struttura({ azione: 'aggiungi', tipo: 'variante', slug: p.slug })}
              >
                <span aria-hidden="true">+</span> Colore
              </button>
            </div>
          );
        })}
    </>
  );
}

/* ================================================================= colori */

function Colori({
  data, edits, setEdits,
}: {
  data: Data;
  edits: Record<string, { block: 'colour' | 'type'; value: string }>;
  setEdits: React.Dispatch<React.SetStateAction<Record<string, { block: 'colour' | 'type'; value: string }>>>;
}) {
  const val = (list: Pair[], key: string) => edits[key]?.value ?? list.find((p) => p.key === key)?.value ?? '';

  const edit = (block: 'colour' | 'type', key: string, value: string, original: string) =>
    setEdits((prev) => {
      const next = { ...prev };
      if (value === original) delete next[key];
      else next[key] = { block, value };
      return next;
    });

  return (
    <>
      <div className="st-tools">
        <p className="st-hint">
          <b>C&rsquo;è una rete sotto.</b> Se un colore rende illeggibile del testo,
          il salvataggio lo rifiuta, rimette il precedente e ti dice quale coppia
          non passa e di quanto. Non puoi rompere il sito da qui.
        </p>
      </div>

      <h2 className="st-h2">Colori</h2>
      <div className="st-swatches">
        {data.colour.map((p) => {
          const v = val(data.colour, p.key);
          const isDirty = edits[p.key] !== undefined;
          return (
            <div className={isDirty ? 'st-sw st-sw--dirty' : 'st-sw'} key={p.key}>
              <input
                type="color" value={v}
                onChange={(e) => edit('colour', p.key, e.target.value.toUpperCase(), p.value)}
                aria-label={p.key}
              />
              <div>
                <span className="st-sw__k">{p.key}</span>
                <input
                  className="st-sw__v" value={v}
                  onChange={(e) => edit('colour', p.key, e.target.value.toUpperCase(), p.value)}
                />
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="st-h2">Misure del testo</h2>
      <p className="st-hint">
        <code>clamp(minimo, preferito, massimo)</code>: il primo è quanto è grande
        sul telefono, l&rsquo;ultimo il tetto su uno schermo largo.
      </p>
      <div className="st-scale">
        {data.type.map((p) => {
          const v = val(data.type, p.key);
          const isDirty = edits[p.key] !== undefined;
          return (
            <div className={isDirty ? 'st-row st-row--dirty' : 'st-row'} key={p.key}>
              <label className="st-key">{p.key}</label>
              <input value={v} onChange={(e) => edit('type', p.key, e.target.value, p.value)} />
              <span className="st-sample" style={{ fontSize: v }}>Aa</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* =============================================================== immagini */

function Immagini({
  data, reload, refresh, setMsg, puntato,
}: {
  data: Data;
  puntato?: string;
  reload: () => Promise<void>;
  refresh: () => void;
  setMsg: (m: { tone: 'ok' | 'err'; lines: string[] } | null) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  /* il puntatore ha scelto un'immagine: la porto sotto gli occhi */
  useEffect(() => {
    if (!puntato) return;
    const t = setTimeout(() => {
      const el = document.querySelector<HTMLElement>(`[data-immagine="${puntato}"]`);
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      el?.classList.add('st-row--puntata');
      setTimeout(() => el?.classList.remove('st-row--puntata'), 2200);
    }, 220);
    return () => clearTimeout(t);
  }, [puntato]);

  async function upload(target: string, file: File) {
    setBusy(target);
    setMsg(null);
    const form = new FormData();
    form.append('file', file);
    form.append('target', target);
    const r = await fetch('/api/studio/image', { method: 'POST', body: form });
    const j = await r.json();
    setBusy(null);
    if (!r.ok) { setMsg({ tone: 'err', lines: [j.error] }); return; }
    setMsg({
      tone: 'ok',
      lines: [`Sostituita ${target}. La precedente è accanto, come ${j.backup}.`],
    });
    await reload();
    refresh();
  }

  return (
    <>
      <div className="st-tools">
        <p className="st-hint">
          Sostituisci un&rsquo;immagine tenendo il suo nome: cambia da sola ovunque
          compaia. La vecchia resta accanto con <code>.precedente</code> attaccato,
          nel caso.
        </p>
      </div>
      <div className="st-imgs">
        {data.images.map((im) => (
          <div className="st-img" key={im.file} data-immagine={im.file}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${im.url}?v=${im.bytes}`} alt="" />
            <span className="st-img__n">{im.file}</span>
            <span className="st-img__s">{Math.round(im.bytes / 1024)} KB</span>
            <input
              ref={(el) => { inputs.current[im.file] = el; }}
              type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(im.file, f); }}
            />
            <button
              type="button" disabled={busy === im.file}
              onClick={() => inputs.current[im.file]?.click()}
            >
              {busy === im.file ? 'Carico…' : 'Sostituisci'}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

export default Studio;
