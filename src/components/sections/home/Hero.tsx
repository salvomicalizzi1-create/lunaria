'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { moonNow, MONTHS_LONG, italianDay } from '@/lib/moon';
import { nextMoonAt, liveMoonAt, moons, moonName } from '@/data/moons';

/** CSS custom properties are legal in a style prop; TypeScript needs telling. */
type Vars = CSSProperties & Record<`--${string}`, string | number>;

/* A seeded generator, so the same word always scatters the same way: a headline
   that lands differently on every reload reads as a glitch, not as design. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * The split engine. Every character carries its own threshold and its own
 * scatter vector as CSS variables, and the CSS does the animating against one
 * number — the band's --k — so scrolling drives type without any per-frame
 * JavaScript touching a single letter.
 */
function Split({
  text, seed, spread = 0.42, emphasiseLast = false, silent = false,
}: {
  text: string; seed: number; spread?: number; emphasiseLast?: boolean; silent?: boolean;
}) {
  const nodes = useMemo(() => {
    const words = text.split(' ');
    const r = rng(seed);
    const total = text.replace(/ /g, '').length;
    let chars = 0;
    const out: ReactNode[] = [];

    words.forEach((word, wi) => {
      const em = emphasiseLast && wi === words.length - 1;
      const th = (wi / Math.max(1, words.length - 1)) * spread;
      const letters = Array.from(word).map((ch, i) => {
        const cth = (chars / Math.max(1, total)) * spread + r() * 0.06;
        const style: Vars = {
          '--th': cth.toFixed(3),
          '--jx': `${((r() * 2 - 1) * 34).toFixed(1)}px`,
          '--jy': `${((r() * 2 - 1) * 30).toFixed(1)}px`,
          '--jr': `${((r() * 2 - 1) * 16).toFixed(1)}deg`,
        };
        chars += 1;
        return <span className="c" style={style} key={i}>{ch}</span>;
      });

      out.push(
        <span className={em ? 'w em' : 'w'} style={{ '--th': th.toFixed(3) } as Vars} key={`w${wi}`}>
          {letters}
        </span>,
      );
      if (wi < words.length - 1) {
        out.push(<span className="w" style={{ '--th': 0 } as Vars} key={`s${wi}`}> </span>);
      }
    });
    return out;
  }, [text, seed, spread, emphasiseLast]);

  return (
    <>
      {/* Band one's words are already carried by the page's single h1, so it
          skips the spoken copy rather than saying the sentence twice. */}
      {silent ? null : <span className="vh">{text}</span>}
      <span aria-hidden="true">{nodes}</span>
    </>
  );
}

/* Where each band lives on the screen, when it appears, and how hard its own
   scrim has to work. The alphas were measured against each band's worst frame,
   not its average: band one sits in the moon's light column and needs 0.94. */
const BANDS = [
  { pos: 'bl', a: 0,    b: 0.22, sx: '20%', sy: '80%', sa: 0.94, sw: '104%', sh: '88%', ramp: 0.03 },
  { pos: 'br', a: 0.25, b: 0.45, sx: '76%', sy: '78%', sa: 0.5 },
  { pos: 'lc', a: 0.48, b: 0.68, sx: '22%', sy: '50%', sa: 0.84, sw: '88%', sh: '76%', spread: 0.55 },
  { pos: 'bl', a: 0.72, b: 1,    sx: '24%', sy: '72%', sa: 0.46 },
] as const;

/* The five gates. These must match the media query block in home.css exactly:
   a device that gets the tall scroll section but no bands sees a blank screen. */
const GATES = [
  '(max-width: 720px)',
  '(orientation: portrait) and (max-width: 1024px)',
  '(orientation: portrait) and (pointer: coarse)',
  '(orientation: landscape) and (pointer: coarse) and (max-height: 560px)',
  '(prefers-reduced-motion: reduce)',
];

const VIDEO_URL = '/video/hero-scrub.mp4';
/* the real size, used when the host omits Content-Length and the ring would
   otherwise have nothing to count against */
const VIDEO_BYTES = 5583127;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smoothstep = (p: number, e0: number, e1: number) => {
  const t = clamp((p - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};

export function Hero() {
  const t = useTranslations('hero');
  const locale = useLocale() as 'it' | 'en';

  const heroRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGSVGElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const bandsRef = useRef<HTMLDivElement>(null);

  /* The next release and the moon it falls on are read from the clock, so they
     are computed after mount: the server has no business guessing what day it
     is for a reader in another timezone, and a mismatch would be a hydration
     error rather than a stale sentence. */
  const [nextLine, setNextLine] = useState<string | null>(null);
  const [eyebrow, setEyebrow] = useState<string | null>(null);

  useEffect(() => {
    const now = Date.now();
    const drop = nextMoonAt(now) ?? moons[0];
    const at = new Date(drop.at);
    const day = at.getUTCDate();
    const NB = ' ';
    setNextLine(
      t('nextLine', {
        day: locale === 'it' ? italianDay(day) : String(day),
        month: NB + MONTHS_LONG[locale][at.getUTCMonth()],
        moon: moonName(drop, locale).toUpperCase(),
      }),
    );
    const live = liveMoonAt(now);
    setEyebrow(`LUNARIA · ${t('moonWord')} ${moonName(live, locale).toUpperCase()} · ${live.numeral} / XIII`);
  }, [t, locale]);

  /* ------------------------------------------------------------- the engine
     Everything below writes to the DOM directly and never asks React to render.
     A scrub loop that went through state would queue a reconciliation on every
     frame, and the video would fall behind the finger. */
  useEffect(() => {
    const heroSec = heroRef.current;
    const stage = stageRef.current;
    const video = videoRef.current;
    const poster = posterRef.current;
    const ring = ringRef.current;
    const cue = cueRef.current;
    if (!heroSec || !stage || !video || !poster) return;

    const bandEls = Array.from(bandsRef.current?.querySelectorAll<HTMLElement>('.band') ?? []);
    const bands = bandEls.map((el, i) => ({
      el,
      inner: el.querySelector<HTMLElement>('.band__in'),
      a: BANDS[i].a,
      b: BANDS[i].b,
      ramp: 'ramp' in BANDS[i] ? (BANDS[i] as { ramp: number }).ramp : 0,
      op: -1,
      k: -1,
      vis: undefined as boolean | undefined,
    }));

    let target = 0;
    let shown = 0;
    let rafId: number | null = null;
    let lastTick = 0;
    let seekBusy = false;
    let pendingTime: number | null = null;
    let scrubOn = false;
    let started = false;
    let loadT0 = 0;
    let cueOpacity = 0;
    let abort: AbortController | null = null;
    let watchdog: ReturnType<typeof setTimeout> | null = null;
    let kickoff: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    const heroProgress = () => {
      const r = heroSec.getBoundingClientRect();
      const range = heroSec.offsetHeight - window.innerHeight;
      if (range <= 0) return 0;
      return clamp(-r.top / range, 0, 1);
    };

    function requestSeek(time: number) {
      if (!video!.duration || !isFinite(time)) return;
      if (seekBusy) { pendingTime = time; return; }
      seekBusy = true;
      video!.currentTime = time;
    }
    const onSeeked = () => {
      seekBusy = false;
      if (pendingTime !== null) {
        const next = pendingTime;
        pendingTime = null;
        requestSeek(next);
      }
    };

    function updateCaptions(p: number, force = false) {
      const loadK = loadT0 ? clamp((performance.now() - loadT0) / 900, 0, 1) : 1;
      bands.forEach((b, i) => {
        const f = Math.min(0.02, (b.b - b.a) / 3);
        let op =
          (i === 0 ? 1 : smoothstep(p, b.a, b.a + f)) *
          (i === bands.length - 1 ? 1 : 1 - smoothstep(p, b.b - f, b.b));
        if (i === 0) op = 1 - smoothstep(p, b.b - f, b.b);

        const ramp = b.ramp || Math.min(0.025, (b.b - b.a) * 0.35);
        let k = clamp((p - b.a) / ramp, 0, 1);
        if (i === 0) k = Math.max(k, loadK);

        if (force || Math.abs(op - b.op) > 0.004) {
          b.el.style.opacity = op.toFixed(3);
          b.op = op;
        }
        /* a band you cannot see must not be reachable with the Tab key either */
        const vis = op > 0.06;
        if (force || vis !== b.vis) {
          b.el.inert = !vis;
          b.el.setAttribute('aria-hidden', vis ? 'false' : 'true');
          b.vis = vis;
        }
        if (i === 0 && cue) {
          const co = 1 - smoothstep(p, 0.02, 0.1);
          if (force || Math.abs(co - cueOpacity) > 0.02) {
            cue.style.opacity = (co * 0.62).toFixed(2);
            cueOpacity = co;
          }
        }
        if (force || Math.abs(k - b.k) > 0.008) {
          b.el.style.setProperty('--k', k.toFixed(3));
          if (b.inner?.classList.contains('e-settle')) {
            b.inner.style.setProperty('--ks2', clamp((k - 0.5) * 2.6, 0, 1).toFixed(3));
            b.inner.style.setProperty('--kb', clamp((k - 0.68) * 3.2, 0, 1).toFixed(3));
          }
          b.k = k;
        }
      });
    }

    function tick(now: number) {
      const dt = Math.min(100, now - (lastTick || now));
      lastTick = now;
      /* normalised against dt, so the easing feels the same at 60Hz and 120Hz */
      shown += (target - shown) * (1 - Math.pow(1 - 0.16, dt / 16.667));
      const settled = Math.abs(target - shown) < 0.0005;
      const loading = loadT0 && now - loadT0 < 960;
      if (settled && !loading) {
        shown = target;
        rafId = null;
        lastTick = 0;
      } else {
        rafId = requestAnimationFrame(tick);
      }
      if (video!.duration) requestSeek(shown * video!.duration);
      updateCaptions(shown);
    }

    /* One rect read drives both the progress and the on-screen test, so the loop
       can never be left asleep by a stale observer entry. */
    const onScroll = () => {
      const r = heroSec.getBoundingClientRect();
      const vh = window.innerHeight;
      const range = heroSec.offsetHeight - vh;
      target = range > 0 ? clamp(-r.top / range, 0, 1) : 0;
      const onScreen = r.bottom > -vh * 0.1 && r.top < vh * 1.1;
      if (rafId === null && onScreen) rafId = requestAnimationFrame(tick);
    };

    function failVideo() {
      if (ring) ring.style.display = 'none';
      if (cue) cue.hidden = false;
      stage!.classList.add('is-failed');
    }

    /* The video is fetched as a blob rather than streamed. Seeking a streaming
       mp4 makes the browser re-request byte ranges, and a scrub becomes a series
       of stalls; from a blob every frame is already local. */
    function loadHeroBlob() {
      abort = new AbortController();
      const arm = () => {
        if (watchdog) clearTimeout(watchdog);
        watchdog = setTimeout(() => abort?.abort(), 20000);
      };
      arm();

      return fetch(VIDEO_URL, { signal: abort.signal }).then((res) => {
        if (!res.ok || !res.body) throw new Error('no body');
        const total = Number(res.headers.get('Content-Length')) || VIDEO_BYTES;
        const reader = res.body.getReader();
        const chunks: Uint8Array[] = [];
        let got = 0;
        let lastRing = 0;

        const pump = (): Promise<void> =>
          reader.read().then((r) => {
            if (r.done || disposed) return;
            arm();
            chunks.push(r.value);
            got += r.value.length;
            const frac = Math.min(1, got / total);
            const now = performance.now();
            if (now - lastRing > 100 || frac === 1) {
              lastRing = now;
              ring?.style.setProperty('--ld', String(Math.round(126 * (1 - frac))));
            }
            return pump();
          });

        return pump().then(() => {
          if (watchdog) clearTimeout(watchdog);
          if (disposed) return;
          ring?.style.setProperty('--ld', '0');
          video!.src = URL.createObjectURL(new Blob(chunks as BlobPart[], { type: 'video/mp4' }));
          video!.load();
          video!.addEventListener('canplay', () => {
            stage!.classList.add('is-ready');
            if (cue) cue.hidden = false;
            if (scrubOn) onScroll();   // land on the position the reader is already at
          }, { once: true });
        });
      });
    }

    function startFetch() {
      if (started || disposed) return;
      started = true;
      loadHeroBlob().catch(() => { if (!disposed) failVideo(); });
    }

    let heroInit = false;
    function initHeroOnce() {
      poster!.style.backgroundImage = "url('/images/hero-poster.jpg')";
      poster!.style.backgroundPosition = 'center';
      if (heroInit) return;
      heroInit = true;
      const img = new Image();
      img.onload = startFetch;
      img.onerror = startFetch;
      img.src = '/images/hero-poster.jpg';
      // the poster may be cached and fire neither handler; this is the floor
      kickoff = setTimeout(startFetch, 4000);
    }

    /* The static hero is a composed layout, so it gets the resting frame and the
       five megabytes are never requested behind it. */
    function initStatic() {
      poster!.style.backgroundImage = "url('/images/hero-ending.jpg')";
      poster!.style.backgroundPosition = '64% 40%';
    }

    function enableScrub() {
      if (scrubOn) return;
      scrubOn = true;
      loadT0 = performance.now();
      initHeroOnce();
      window.addEventListener('scroll', onScroll, { passive: true });
      bands.forEach((b) => { b.op = -1; b.k = -1; });
      updateCaptions(heroProgress(), true);
      onScroll();
    }
    function disableScrub() {
      if (!scrubOn) return;
      scrubOn = false;
      window.removeEventListener('scroll', onScroll);
      if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
    }
    function applyHeroMode() {
      const off = GATES.some((q) => matchMedia(q).matches);
      if (off) { initStatic(); disableScrub(); } else { enableScrub(); }
    }

    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', () => { seekBusy = false; pendingTime = null; failVideo(); });

    const mqls = GATES.map((q) => matchMedia(q));
    mqls.forEach((m) => m.addEventListener('change', applyHeroMode));

    const io = new IntersectionObserver((entries) => {
      // the last entry is the current one; entries[0] can be stale
      if (!entries[entries.length - 1].isIntersecting || !scrubOn) return;
      onScroll();                       // re-reads the rect and re-arms the loop
    }, { rootMargin: '10% 0px' });
    io.observe(heroSec);

    /**
     * Quanto dell'eroe cade fuori dallo schermo, in basso.
     *
     * L'eroe è alto una schermata intera ma comincia sotto il nastro e
     * l'intestazione: il suo fondo finisce oltre il bordo visibile esattamente
     * di quel tanto, e si porta via quello che ci sta ancorato — i due
     * pulsanti. Il CSS non sa misurare un fratello, quindi glielo diciamo.
     *
     * Era un 94px scritto a mano, ed è scivolato appena l'ho toccato: col
     * movimento ridotto il nastro va a capo e diventa alto 182, il vero
     * scostamento sale a 239, e i pulsanti tornavano tagliati. Misurato non
     * scivola più.
     */
    const misuraSopra = () => {
      document.documentElement.style.setProperty('--sopra-eroe', `${Math.round(heroSec.offsetTop)}px`);
    };
    misuraSopra();
    /* il nastro cambia altezza quando le voci vanno a capo, non solo quando
       cambia la finestra */
    const ro = new ResizeObserver(misuraSopra);
    const nastro = document.querySelector('.ticker');
    if (nastro) ro.observe(nastro);

    const onResize = () => { misuraSopra(); if (scrubOn) onScroll(); };
    window.addEventListener('resize', onResize);

    applyHeroMode();

    return () => {
      disposed = true;
      disableScrub();
      io.disconnect();
      window.removeEventListener('resize', onResize);
      ro.disconnect();
      mqls.forEach((m) => m.removeEventListener('change', applyHeroMode));
      video.removeEventListener('seeked', onSeeked);
      if (watchdog) clearTimeout(watchdog);
      if (kickoff) clearTimeout(kickoff);
      abort?.abort();
      if (video.src.startsWith('blob:')) URL.revokeObjectURL(video.src);
    };
  }, []);

  const bandStyles = useMemo(
    () => BANDS.map((b) => {
      const s: Vars = { '--sx': b.sx, '--sy': b.sy, '--sa': b.sa };
      if ('sw' in b) s['--sw'] = b.sw as string;
      if ('sh' in b) s['--sh'] = b.sh as string;
      return s;
    }),
    [],
  );

  const cta = (
    <div className="band__cta">
      <a className="btn btn--primary" href="#luna">{t('ctaMoon')}</a>
      <Link className="btn btn--ghost" href="/collezioni">{t('ctaCollections')}</Link>
    </div>
  );

  return (
    <section className="hero" id="hero" ref={heroRef} aria-label="LUNARIA">
      <div className="stage" ref={stageRef}>
        <div className="stage__media">
          <div className="poster" ref={posterRef} />
          {/* eslint-disable-next-line jsx-a11y/media-has-caption -- silent footage, no speech */}
          <video className="stage__video" ref={videoRef} preload="none" muted playsInline aria-hidden="true" tabIndex={-1} />
        </div>
        <div className="scrim" aria-hidden="true" />
        <div className="vign" aria-hidden="true" />

        <div className="bands" ref={bandsRef}>
          <div className="band" data-band={1} data-pos={BANDS[0].pos} data-a={BANDS[0].a} data-b={BANDS[0].b} style={bandStyles[0]}>
            <div className="band__in">
              <p className="h e-drift">
                <Split text={t('band1H')} seed={2004} silent />
              </p>
              <p>{t('band1P')}</p>
            </div>
          </div>

          <div className="band" data-band={2} data-pos={BANDS[1].pos} data-a={BANDS[1].a} data-b={BANDS[1].b} style={bandStyles[1]}>
            <div className="band__in">
              <h2 className="e-punch"><Split text={t('band2H')} seed={2101} emphasiseLast /></h2>
              <p>{t('band2P')}</p>
            </div>
          </div>

          <div className="band" data-band={3} data-pos={BANDS[2].pos} data-a={BANDS[2].a} data-b={BANDS[2].b} style={bandStyles[2]}>
            <div className="band__in">
              <h2 className="e-scatter"><Split text={t('band3H')} seed={2198} spread={0.55} /></h2>
              <p>{t('band3P')}</p>
            </div>
          </div>

          <div className="band" data-band={4} data-pos={BANDS[3].pos} data-a={BANDS[3].a} data-b={BANDS[3].b} style={bandStyles[3]}>
            <div className="band__in e-settle">
              <h2><Split text={t('band4H')} seed={2295} /></h2>
              <p className="sub">{nextLine ?? t('band4Fallback')}</p>
              {cta}
            </div>
          </div>
        </div>

        <div className="statichero">
          {/* la spaziatura fra le lettere sta nel foglio, non qui: in linea
              vinceva su qualunque regola e su un telefono mandava la riga a capo */}
          <p className="mono statichero__eyebrow">
            {eyebrow ?? 'LUNARIA'}
          </p>
          <p className="h" aria-hidden="true">{t('band4H')}</p>
          <p>{t('staticBody')}</p>
          {cta}
        </div>

        <svg className="ring" ref={ringRef} viewBox="0 0 48 48" aria-hidden="true">
          <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.22" />
          <circle
            cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="2"
            strokeDasharray="126" style={{ strokeDashoffset: 'var(--ld, 126)' }}
          />
        </svg>
        <div className="cue" ref={cueRef} hidden>
          <span />
          <em style={{ fontStyle: 'normal' }}>{t('scroll')}</em>
        </div>
      </div>
    </section>
  );
}

export default Hero;
