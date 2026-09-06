'use client';

import { useEffect, useState } from 'react';

/**
 * Gli editor per i contenuti che non stavano nei file dei testi.
 *
 * Sono quattro cose diverse — collezioni, lune, oracolo, e i campi lunghi dei
 * capi — ma la forma è sempre la stessa: un valore, in una o due lingue, dentro
 * un file di dati. Quindi c'è un mattone solo, e le quattro schede lo
 * compongono. Scriverne quattro versioni avrebbe voluto dire quattro posti dove
 * dimenticarsi l'inglese.
 */

export type RecEdit = { file: string; path: (string | number)[]; value: string | number };
export type Edits = Record<string, RecEdit>;
export const chiaveDi = (file: string, p: (string | number)[]) => `${file}:${p.join('.')}`;

export type Richiesta = {
  azione: 'aggiungi' | 'duplica' | 'rimuovi';
  tipo: 'capo' | 'collezione' | 'luna' | 'carta' | 'variante' | 'taglia';
  slug?: string; id?: string; numeral?: string; asse?: string; indice?: number;
  variante?: string; taglia?: string;
};
export type Struttura = (r: Richiesta) => void;

type Props = {
  edits: Edits;
  setEdits: React.Dispatch<React.SetStateAction<Edits>>;
};

/* ------------------------------------------------- aggiungi, copia, togli */

/**
 * Duplicare è innocuo, togliere no: quello che sparisce da qui sparisce da un
 * file del progetto, e non c'è un cestino.
 *
 * Quindi «Rimuovi» chiede conferma, ma senza una finestra che si piazza davanti
 * a tutto: il pulsante diventa «Confermi?» e torna com'era da solo dopo quattro
 * secondi. Chi lo ha premuto per sbaglio non deve fare niente per annullare —
 * gli basta non premerlo una seconda volta.
 */
export function Azioni({ onDuplica, onRimuovi, piccolo, nome }: {
  onDuplica?: () => void;
  onRimuovi?: () => void;
  piccolo?: boolean;
  /** di cosa si sta parlando, per chi naviga a orecchio */
  nome: string;
}) {
  const [conferma, setConferma] = useState(false);

  useEffect(() => {
    if (!conferma) return;
    const t = setTimeout(() => setConferma(false), 4000);
    return () => clearTimeout(t);
  }, [conferma]);

  return (
    <span className={piccolo ? 'st-az st-az--p' : 'st-az'}>
      {onDuplica && (
        <button type="button" className="st-az__b" onClick={onDuplica}
                aria-label={`Duplica ${nome}`} title="Fanne una copia da modificare">
          Duplica
        </button>
      )}
      {onRimuovi && (
        <button
          type="button"
          className={conferma ? 'st-az__b st-az__b--via' : 'st-az__b'}
          aria-label={conferma ? `Conferma: togli ${nome}` : `Togli ${nome}`}
          onClick={() => {
            if (!conferma) { setConferma(true); return; }
            setConferma(false);
            onRimuovi();
          }}
        >
          {conferma ? 'Confermi?' : 'Rimuovi'}
        </button>
      )}
    </span>
  );
}

/** Il pulsante che crea qualcosa di nuovo, in cima a un elenco. */
export function Aggiungi({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className="st-aggiungi" onClick={onClick}>
      <span aria-hidden="true">+</span> {children}
    </button>
  );
}

/* --------------------------------------------------------------- mattoni */

function Campo({
  etichetta, file, path, valore, edits, setEdits, lungo, numero, aiuto,
}: Props & {
  etichetta: string;
  file: string;
  path: (string | number)[];
  valore: string | number;
  lungo?: boolean;
  numero?: boolean;
  aiuto?: string;
}) {
  const k = chiaveDi(file, path);
  const attuale = edits[k]?.value ?? valore;
  const cambiato = edits[k] !== undefined;

  const scrivi = (v: string) => {
    const nuovo: string | number = numero ? Number(v.replace(',', '.')) : v;
    setEdits((prev) => {
      const next = { ...prev };
      if (nuovo === valore || (numero && !Number.isFinite(nuovo as number))) delete next[k];
      else next[k] = { file, path, value: nuovo };
      return next;
    });
  };

  return (
    <label className={cambiato ? 'st-campo st-campo--dirty' : 'st-campo'}>
      <span className="st-campo__l">{etichetta}</span>
      {lungo ? (
        <textarea value={String(attuale)} rows={4} onChange={(e) => scrivi(e.target.value)} />
      ) : (
        <input value={String(attuale)} inputMode={numero ? 'decimal' : undefined}
               onChange={(e) => scrivi(e.target.value)} />
      )}
      {aiuto && <span className="st-campo__a">{aiuto}</span>}
    </label>
  );
}

function Bilingue({
  etichetta, file, path, it, en, edits, setEdits, lungo, aiuto,
}: Props & {
  etichetta: string; file: string; path: (string | number)[];
  it: string; en: string; lungo?: boolean; aiuto?: string;
}) {
  return (
    <div className="st-bil">
      <span className="st-campo__l">{etichetta}</span>
      {aiuto && <span className="st-campo__a">{aiuto}</span>}
      <div className="st-two">
        <Campo etichetta="IT" file={file} path={[...path, 'it']} valore={it}
               edits={edits} setEdits={setEdits} lungo={lungo} />
        <Campo etichetta="EN" file={file} path={[...path, 'en']} valore={en}
               edits={edits} setEdits={setEdits} lungo={lungo} />
      </div>
    </div>
  );
}

/** porta sotto gli occhi la scheda scelta col puntatore */
function usaPuntato(id: string | undefined, attributo: string) {
  useEffect(() => {
    if (!id) return;
    const t = setTimeout(() => {
      const el = document.querySelector<HTMLElement>(`[${attributo}="${id}"]`);
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      el?.classList.add('st-row--puntata');
      setTimeout(() => el?.classList.remove('st-row--puntata'), 2200);
    }, 200);
    return () => clearTimeout(t);
  }, [id, attributo]);
}

/* ----------------------------------------------------------- collezioni */

type Loc = { it: string; en: string };
export type Collezione = {
  id: string; name: Loc; tag: string; meaning: Loc; family: Loc; image: string; alt: Loc;
};

export function Collezioni({ dati, edits, setEdits, puntato, struttura }: Props & {
  dati: Collezione[]; puntato?: string; struttura: Struttura;
}) {
  usaPuntato(puntato, 'data-collezione');
  return (
    <>
      <div className="st-tools">
        <Aggiungi onClick={() => struttura({ azione: 'aggiungi', tipo: 'collezione' })}>
          Collezione nuova
        </Aggiungi>
        <p className="st-hint">
          Le cinque collezioni. Il motto è la riga in corsivo che si legge sotto il
          nome nella home; la famiglia è l&rsquo;elenco dei tipi di capo accanto al prezzo.
          Una collezione si può togliere solo quando nessun capo e nessuna uscita la nomina.
        </p>
      </div>
      {dati.map((c, i) => (
        <div className="st-card" key={c.id} data-collezione={c.id}>
          <div className="st-card__h">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.image} alt="" width={44} height={55} />
            <strong className="st-card__n">{c.name.it}</strong>
            <span className="st-card__id mono">{c.id}</span>
            <Azioni
              nome={`la collezione ${c.name.it}`}
              onDuplica={() => struttura({ azione: 'duplica', tipo: 'collezione', id: c.id })}
              onRimuovi={() => struttura({ azione: 'rimuovi', tipo: 'collezione', id: c.id })}
            />
          </div>
          <Bilingue etichetta="Nome" file="collections" path={['collections', i, 'name']}
                    it={c.name.it} en={c.name.en} edits={edits} setEdits={setEdits} />
          <Bilingue etichetta="Il motto" file="collections" path={['collections', i, 'meaning']}
                    it={c.meaning.it} en={c.meaning.en} edits={edits} setEdits={setEdits} />
          <Bilingue etichetta="Famiglia di capi" file="collections" path={['collections', i, 'family']}
                    it={c.family.it} en={c.family.en} edits={edits} setEdits={setEdits} />
          <Bilingue etichetta="Descrizione dell'immagine" file="collections" path={['collections', i, 'alt']}
                    it={c.alt.it} en={c.alt.en} edits={edits} setEdits={setEdits} lungo
                    aiuto="La legge chi non vede la fotografia. Descrivi cosa si vede, non ripetere il nome." />
        </div>
      ))}
    </>
  );
}

/* ----------------------------------------------------------------- lune */

export type Luna = { numeral: string; name: Loc; at: string; collection: string };

export function Lune({ dati, edits, setEdits, puntato, struttura }: Props & {
  dati: Luna[]; puntato?: string; struttura: Struttura;
}) {
  usaPuntato(puntato, 'data-luna');
  return (
    <>
      <div className="st-tools">
        <Aggiungi onClick={() => struttura({ azione: 'aggiungi', tipo: 'luna' })}>Uscita nuova</Aggiungi>
        <p className="st-hint">
          Le uscite dell&rsquo;anno. <b>La data è l&rsquo;istante vero della luna
          nuova</b>, in UTC: cambiarla sposta l&rsquo;uscita e il conto alla rovescia in
          cima alla home, e la fa smettere di coincidere col cielo. Un&rsquo;uscita
          creata da qui prende una data plausibile, non un novilunio vero: correggila.
        </p>
      </div>
      {dati.map((m, i) => (
        <div className="st-card" key={m.numeral} data-luna={m.numeral}>
          <div className="st-card__h">
            <span className="st-card__id mono">{m.numeral} / {dati.length}</span>
            <strong className="st-card__n">{m.name.it}</strong>
            <span className="mono st-card__id">{m.collection}</span>
            <Azioni
              nome={`l'uscita ${m.name.it}`}
              onDuplica={() => struttura({ azione: 'duplica', tipo: 'luna', numeral: m.numeral })}
              onRimuovi={() => struttura({ azione: 'rimuovi', tipo: 'luna', numeral: m.numeral })}
            />
          </div>
          <Bilingue etichetta="Nome dell'uscita" file="moons" path={[i, 'name']}
                    it={m.name.it} en={m.name.en} edits={edits} setEdits={setEdits} />
          <Campo etichetta="Istante della luna nuova (UTC)" file="moons" path={[i, 'at']}
                 valore={m.at} edits={edits} setEdits={setEdits}
                 aiuto="Forma: 2026-09-11T03:26Z" />
        </div>
      ))}
    </>
  );
}

/* -------------------------------------------------------------- oracolo */

export type Carta = { image: string; key: Loc; value: Loc; reading: Loc; alt: Loc };
export type Oracolo = { axes: { id: string; label: Loc; title: Loc }[]; deck: Record<string, Carta[]> };

export function OracoloScheda({ dati, edits, setEdits, puntato, struttura }: Props & {
  dati: Oracolo; puntato?: string; struttura: Struttura;
}) {
  usaPuntato(puntato, 'data-carta');
  const letture = dati.axes.reduce((n, a) => n * (dati.deck[a.id]?.length ?? 1), 1);
  return (
    <>
      <div className="st-tools">
        <p className="st-hint">
          Tre assi, e una carta per asse a ogni pescata. <b>La lettura</b> è il
          pezzo di frase che la carta aggiunge quando esce: le tre si leggono di
          seguito, quindi devono stare in piedi insieme. Adesso le combinazioni
          possibili sono <b>{letture}</b> — aggiungere una carta le moltiplica.
        </p>
      </div>
      {dati.axes.map((asse) => (
        <div key={asse.id}>
          <h2 className="st-h2">{asse.title.it}</h2>
          <Bilingue etichetta="Come si chiama la carta" file="oracle"
                    path={['axes', dati.axes.indexOf(asse), 'label']}
                    it={asse.label.it} en={asse.label.en} edits={edits} setEdits={setEdits} />
          <Aggiungi onClick={() => struttura({ azione: 'aggiungi', tipo: 'carta', asse: asse.id })}>
            Carta in «{asse.title.it}»
          </Aggiungi>
          {(dati.deck[asse.id] ?? []).map((carta, i) => (
            /* la chiave è la posizione, non l'immagine: due carte copiate l'una
               dall'altra condividono l'incisione finché non la si cambia */
            <div className="st-card" key={`${asse.id}-${i}`} data-carta={`${asse.id}-${i}`}>
              <div className="st-card__h">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/images/oracolo/${carta.image}.jpg`} alt="" width={40} height={60} />
                <strong className="st-card__n">{carta.key.it}</strong>
                <Azioni
                  nome={`la carta ${carta.key.it}`}
                  onDuplica={() => struttura({ azione: 'duplica', tipo: 'carta', asse: asse.id, indice: i })}
                  onRimuovi={() => struttura({ azione: 'rimuovi', tipo: 'carta', asse: asse.id, indice: i })}
                />
              </div>
              <Bilingue etichetta="Titolo sulla carta" file="oracle" path={['deck', asse.id, i, 'key']}
                        it={carta.key.it} en={carta.key.en} edits={edits} setEdits={setEdits} />
              <Bilingue etichetta="Riga sotto il titolo" file="oracle" path={['deck', asse.id, i, 'value']}
                        it={carta.value.it} en={carta.value.en} edits={edits} setEdits={setEdits} lungo />
              <Bilingue etichetta="La lettura" file="oracle" path={['deck', asse.id, i, 'reading']}
                        it={carta.reading.it} en={carta.reading.en} edits={edits} setEdits={setEdits}
                        aiuto="Si legge di seguito alle altre due." />
              <Bilingue etichetta="Descrizione dell'incisione" file="oracle" path={['deck', asse.id, i, 'alt']}
                        it={carta.alt.it} en={carta.alt.en} edits={edits} setEdits={setEdits} lungo />
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

/* ------------------------------------------- i campi lunghi di un capo */

export type CapoPieno = {
  slug: string;
  gsm?: number;
  composition: Loc; origin: Loc; care: Loc; meaning: Loc;
  fitNote?: Loc;
};

export function CampiCapo({ capo, indice, edits, setEdits }: Props & {
  capo: CapoPieno; indice: number;
}) {
  const [aperto, setAperto] = useState(false);
  if (!aperto) {
    return (
      <button className="st-piu" type="button" onClick={() => setAperto(true)}>
        Significato, materiali, cura…
      </button>
    );
  }
  return (
    <div className="st-piu__b">
      <Bilingue etichetta="Il significato" file="products" path={[indice, 'meaning']}
                it={capo.meaning.it} en={capo.meaning.en} edits={edits} setEdits={setEdits} lungo
                aiuto="L'etichetta da museo: cosa è il simbolo e da dove viene. È la differenza del marchio." />
      <Bilingue etichetta="Composizione" file="products" path={[indice, 'composition']}
                it={capo.composition.it} en={capo.composition.en} edits={edits} setEdits={setEdits}
                aiuto="Obbligatoria per legge sui prodotti tessili." />
      <Bilingue etichetta="Origine" file="products" path={[indice, 'origin']}
                it={capo.origin.it} en={capo.origin.en} edits={edits} setEdits={setEdits} />
      <Bilingue etichetta="Cura" file="products" path={[indice, 'care']}
                it={capo.care.it} en={capo.care.en} edits={edits} setEdits={setEdits} />
      {capo.fitNote && (
        <Bilingue etichetta="Come veste" file="products" path={[indice, 'fitNote']}
                  it={capo.fitNote.it} en={capo.fitNote.en} edits={edits} setEdits={setEdits} lungo />
      )}
      {typeof capo.gsm === 'number' && (
        <Campo etichetta="Grammatura (g/m²)" file="products" path={[indice, 'gsm']}
               valore={capo.gsm} edits={edits} setEdits={setEdits} numero />
      )}
      <button className="st-piu" type="button" onClick={() => setAperto(false)}>Chiudi</button>
    </div>
  );
}
