'use client';

import { useEffect, useRef } from 'react';

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * The fixed environment and the terminator rail.
 *
 * One layer for the whole page rather than a decorated background per section:
 * the sections scroll over a sky that does not move with them, which is what
 * makes the page feel like one place instead of a stack of blocks.
 *
 * The star field is capped, paused when the tab is hidden, and switched off
 * entirely on a weak processor or when reduced motion is asked for. A background
 * animation is never worth a stuttering scroll.
 */
export function Atmosphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const doc = document.documentElement;
    const onPageScroll = () => {
      const y = window.scrollY;
      const p = Math.min(1, Math.max(0, y / Math.max(1, doc.scrollHeight - window.innerHeight)));
      doc.style.setProperty('--railY', `${p * (window.innerHeight * 0.78)}px`);
    };
    onPageScroll();
    window.addEventListener('scroll', onPageScroll, { passive: true });
    window.addEventListener('resize', onPageScroll);
    return () => {
      window.removeEventListener('scroll', onPageScroll);
      window.removeEventListener('resize', onPageScroll);
    };
  }, []);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const weak = (navigator.hardwareConcurrency ?? 8) <= 4;
    if (reduced || weak) { cv.style.display = 'none'; return; }

    const ctx = cv.getContext('2d', { alpha: true });
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    let pts: { x: number; y: number; r: number; a: number; s: number; ph: number }[] = [];
    let W = 0;
    let H = 0;
    let raf: number | null = null;
    let visible = true;

    function size() {
      W = cv!.clientWidth;
      H = cv!.clientHeight;
      cv!.width = Math.round(W * dpr);
      cv!.height = Math.round(H * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(120, Math.round((W * H) / 16000));
      const r = rng(4242);
      pts = Array.from({ length: n }, () => ({
        x: r() * W, y: r() * H,
        r: 0.4 + r() * 1.1,
        a: 0.18 + r() * 0.5,
        s: 0.0018 + r() * 0.006,
        ph: r() * 6.28,
      }));
    }

    function frame(time: number) {
      ctx!.clearRect(0, 0, W, H);
      for (const p of pts) {
        const twinkle = 0.62 + 0.38 * Math.sin(time * p.s + p.ph);
        ctx!.globalAlpha = p.a * twinkle;
        ctx!.fillStyle = '#C9CEDC';
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, 6.283);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
      raf = visible ? requestAnimationFrame(frame) : null;
    }

    size();
    raf = requestAnimationFrame(frame);

    const onResize = () => size();
    const onVisibility = () => {
      visible = !document.hidden;
      document.body.classList.toggle('paused', document.hidden);
      if (visible && raf === null) raf = requestAnimationFrame(frame);
    };
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      document.body.classList.remove('paused');
    };
  }, []);

  return (
    <>
      <div className="env" aria-hidden="true">
        <div className="env__glow" />
        <canvas className="env__stars" ref={canvasRef} />
        <div className="env__grain" />
      </div>
      <div className="rail" aria-hidden="true">
        <i className="rail__run" />
        <i className="rail__dot" />
      </div>
    </>
  );
}

export default Atmosphere;
