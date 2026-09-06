'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Link } from '@/lib/i18n/navigation';
import { moonPath } from '@/lib/moon';

export type FlatAxis = { id: string; label: string; title: string };
export type FlatPlate = { image: string; key: string; value: string; reading: string; alt: string };
export type Pick = { slug: string; name: string; note: string; price: string };

type Props = {
  axes: FlatAxis[];
  deck: FlatPlate[][];
  readings: Record<string, Pick[]>;
  labels: {
    hold: string; shuffle: string; shuffled: string;
    count: string; yourReading: string; see: string;
  };
};

/**
 * Quanto dura la pressione, e come torna indietro.
 *
 * Erano un secondo e tre decimi, ed erano troppi: la carta è un invito, non una
 * prova di resistenza. Chi la tiene premuta la prima volta non sa quanto manca,
 * e un'attesa che non si sa quando finisce è sempre più lunga di quella che è.
 */
const PRESSIONE = 750;   // millisecondi per riempire la barra
const RITORNO = 320;     // e per svuotarla, se si è lasciato davvero
/* Oltre questa soglia manca meno di un sedicesimo di secondo: un dito che si
   stacca lì si è staccato per attrito, non per scelta. */
const PERDONO = 0.92;

/**
 * Three cards you hold down until the terminator finishes crossing them.
 *
 * The hold is the one interactive moment on the page, and it is deliberately not
 * a click: the reveal takes three quarters of a second of committed pressure,
 * which is the whole point — you are waiting for a line to pass, the way the
 * brand waits for a moon.
 */
export function OracleDeck({ axes, deck, readings, labels }: Props) {
  const [drawn, setDrawn] = useState<[number, number, number]>([0, 1, 1]);
  const [revealed, setRevealed] = useState(false);
  const [announce, setAnnounce] = useState<string | null>(null);

  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const readingRef = useRef<HTMLDivElement>(null);
  /* held outside React: sixty writes a second through state would re-render the
     whole section for a number only CSS ever reads */
  const hold = useRef<[number, number, number]>([0, 0, 0]);
  const holding = useRef<number | null>(null);
  const raf = useRef<number | null>(null);
  /* shuffle puo essere chiamato da un effetto montato una volta sola: senza
     questo leggerebbe per sempre il sorteggio iniziale */
  const drawnRef = useRef<[number, number, number]>(drawn);
  useEffect(() => { drawnRef.current = drawn; }, [drawn]);

  /* A draw travels in the address, so a reading can be sent to somebody and
     arrive as the same three cards rather than three new ones. */
  useEffect(() => {
    const read = () => {
      const m = /[#&]o=(\d)-(\d)-(\d)/.exec(window.location.hash);
      if (!m) return false;
      const d = [Number(m[1]), Number(m[2]), Number(m[3])];
      if (!d.every((v, i) => v >= 0 && v < deck[i].length)) return false;
      setDrawn(d as [number, number, number]);
      return true;
    };

    if (!read()) shuffle(true);

    /* Landing on a shared draw while already on this page is a same-document
       navigation: nothing remounts, so without this the address would say one
       reading and the cards would show another. */
    const onHash = () => { read(); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function shuffle(silent = false) {
    /* The new draw is worked out here rather than inside the state updater.
       An updater has to be pure — React may run it twice — and this one was
       changing the address bar from inside it, which reached the router while
       another component was still rendering. It only ever complained in
       development, which is exactly the kind of bug that ships. */
    const next = drawnRef.current.map((old, i) => {
      const n = deck[i].length;
      let v = old;
      // never redraw the same plate: a shuffle that changes nothing reads as broken
      do { v = Math.floor(Math.random() * n); } while (n > 1 && v === old);
      return v;
    }) as [number, number, number];

    setDrawn(next);
    try { history.replaceState(null, '', `#o=${next.join('-')}`); } catch { /* file:// */ }
    hold.current = [0, 0, 0];
    holding.current = null;
    setRevealed(false);
    cardRefs.current.forEach((c) => {
      c?.style.setProperty('--h', '0');
      c?.setAttribute('aria-pressed', 'false');
    });
    if (!silent) {
      setAnnounce(labels.shuffled);
      setTimeout(() => setAnnounce(null), 2600);
    }
  }

  useEffect(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    /* Nobody who has asked for less motion should have to hold a card down to
       find out what it says. The whole reading is simply open. */
    if (reduced.matches) {
      hold.current = [1, 1, 1];
      cardRefs.current.forEach((c) => {
        c?.style.setProperty('--h', '1');
        c?.setAttribute('aria-pressed', 'true');
      });
      readingRef.current?.classList.add('on');
      setRevealed(true);
      return;
    }

    let last = 0;
    const loop = (now: number) => {
      const dt = Math.min(100, now - (last || now));
      last = now;
      let busy = false;

      for (let i = 0; i < 3; i++) {
        const giu = holding.current === i;

        /* Lineare nel tempo, non esponenziale.
           Prima la barra si avvicinava all'uno di una frazione fissa a ogni
           fotogramma: partiva svelta e poi strisciava, e l'ultimo dieci per
           cento si prendeva un terzo dell'attesa. Da lì la sensazione che non
           finisse mai, più ancora che dalla durata. Adesso avanza sempre alla
           stessa velocità: guardandola si sa quando arriva.

           Una carta arrivata a uno resta a uno: si muove solo quello che non è
           ancora scoperto. */
        if (hold.current[i] < 1) {
          hold.current[i] = giu
            ? Math.min(1, hold.current[i] + dt / PRESSIONE)
            : Math.max(0, hold.current[i] - dt / RITORNO);
        }

        /* Il valore si riscrive comunque, anche quando non è cambiato. Saltare
           la scrittura per le carte ferme sembrava un risparmio: in realtà
           lasciava la carta perdonata al suo ultimo valore disegnato — dentro
           valeva uno, sullo schermo restava a 0,93, e il ritaglio non finiva
           mai di passare. */
        const c = cardRefs.current[i];
        c?.style.setProperty('--h', hold.current[i].toFixed(3));
        if (hold.current[i] === 1) c?.setAttribute('aria-pressed', 'true');

        /* ferma vuol dire: o scoperta, o a zero e nessuno la sta premendo */
        const fermo = hold.current[i] >= 1 || (!giu && hold.current[i] === 0);
        if (!fermo) busy = true;
      }

      const all = hold.current.every((v) => v === 1);
      readingRef.current?.classList.toggle('on', all);
      if (all) setRevealed(true);

      if (!busy && holding.current === null) { raf.current = null; last = 0; }
      else raf.current = requestAnimationFrame(loop);
    };

    const kick = () => { if (raf.current === null) raf.current = requestAnimationFrame(loop); };

    const cleanups: (() => void)[] = [];
    cardRefs.current.forEach((c, i) => {
      if (!c) return;
      const down = (e: PointerEvent) => {
        e.preventDefault();
        /* capture keeps every later pointer event on the card. That is also why
           there is no pointerleave handler: taking the capture fires one on the
           child image and would end the hold the instant it began. */
        try { c.setPointerCapture(e.pointerId); } catch { /* not supported */ }
        holding.current = i;
        kick();
      };
      /**
       * Il rilascio.
       *
       * Prima faceva una cosa sola: rimetti il dito a posto e la barra scende,
       * piano, con la stessa curva strisciante del riempimento — quasi nove
       * decimi di secondo per svuotarsi. Alzare il dito non sembrava una
       * risposta, sembrava un ripensamento lento.
       *
       * Adesso fa due cose. Se eri quasi arrivato, la carta si scopre lo
       * stesso: sotto i sessanta millisecondi dalla fine il dito si è staccato
       * per attrito, non per scelta, e rimandare indietro tutto è una punizione
       * per un errore che non hai commesso. Se invece hai lasciato davvero, la
       * barra torna a zero in un terzo del tempo di prima, così il gesto ha una
       * risposta netta invece di un ripensamento.
       */
      const up = () => {
        const i2 = holding.current;
        if (i2 !== null && hold.current[i2] >= PERDONO) hold.current[i2] = 1;
        holding.current = null;
        kick();
      };
      const keyDown = (e: KeyboardEvent) => {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); holding.current = i; kick(); }
      };
      const keyUp = (e: KeyboardEvent) => {
        // a keyboard cannot express "held down"; one press is enough
        if (e.key === ' ' || e.key === 'Enter') { hold.current[i] = 1; holding.current = null; kick(); }
      };

      c.addEventListener('pointerdown', down);
      c.addEventListener('pointerup', up);
      c.addEventListener('pointercancel', up);
      c.addEventListener('lostpointercapture', up);
      c.addEventListener('keydown', keyDown);
      c.addEventListener('keyup', keyUp);
      cleanups.push(() => {
        c.removeEventListener('pointerdown', down);
        c.removeEventListener('pointerup', up);
        c.removeEventListener('pointercancel', up);
        c.removeEventListener('lostpointercapture', up);
        c.removeEventListener('keydown', keyDown);
        c.removeEventListener('keyup', keyUp);
      });
    });

    return () => {
      cleanups.forEach((fn) => fn());
      if (raf.current !== null) cancelAnimationFrame(raf.current);
      raf.current = null;
    };
  }, [drawn]);

  const picks = readings[drawn.join('-')] ?? [];
  const sentence = axes.map((_, i) => deck[i][drawn[i]].reading).join(' ');

  return (
    <>
      <div className="cards">
        {axes.map((a, i) => {
          const plate = deck[i][drawn[i]];
          return (
            <button
              className="card"
              type="button"
              key={a.id}
              ref={(el) => { cardRefs.current[i] = el; }}
              aria-pressed="false"
              aria-label={`${a.label}, ${a.title}`}
            >
              <span className="card__edge" aria-hidden="true" />
              <span className="card__sweep" aria-hidden="true" />
              <span className="card__back">
                <svg className="card__moon" viewBox="0 0 60 60" aria-hidden="true">
                  <circle cx="30" cy="30" r="22" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
                  <path d={moonPath(30, 30, 22, (i + 2) / 9)} fill="currentColor" opacity="0.18" />
                </svg>
                <span className="card__n">{a.label}</span>
                <span className="card__hint">{labels.hold}</span>
              </span>
              <span className="card__face">
                <Image className="card__plate" src={plate.image} alt={plate.alt} width={700} height={1050} sizes="(min-width: 768px) 260px, 33vw" />
                <span className="card__cap">
                  <span className="card__k">{plate.key}</span>
                  <span className="card__v">{plate.value}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="deckbar">
        <button className="btn btn--ghost" type="button" onClick={() => shuffle()}>
          {labels.shuffle}
        </button>
        <span className="mono deckbar__n" role="status">
          {announce ?? labels.count}
        </span>
      </div>

      <div className="reading" ref={readingRef}>
        <p className="eyebrow">{labels.yourReading}</p>
        <p className="reading__t">{sentence}</p>
        <div className="picks">
          {picks.map((p) => (
            /* the reading ends on three real garments, each one a link to the
               page where it can actually be bought */
            <Link className="pick" href={`/prodotto/${p.slug}`} key={p.slug} tabIndex={revealed ? 0 : -1}>
              <span className="pick__n">{p.name}</span>
              <span className="eyebrow">{p.note}</span>
              <span className="pick__p">{p.price}</span>
              <span className="pick__go">{labels.see}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

export default OracleDeck;
