'use client';

import { useEffect } from 'react';

/**
 * The entrance observer for the whole page.
 *
 * One observer for every .rise, .draw and .wipe on the page rather than a hook
 * per section: they all want the same threshold, and thirty observers doing the
 * same arithmetic is thirty times the work for an identical result.
 *
 * Elements are unobserved the moment they arrive, so nothing re-animates when a
 * reader scrolls back up, and the stagger delay is removed shortly after so a
 * later hover on the same element does not wait for an animation that is over.
 */
export function Reveal() {
  useEffect(() => {
    const targets = () =>
      Array.from(document.querySelectorAll<HTMLElement>('.rise, .draw, .wipe'));

    const rm = matchMedia('(prefers-reduced-motion: reduce)');

    const pin = () => {
      document.documentElement.classList.add('rm');
      targets().forEach((el) => {
        el.classList.add('in');
        if (el.classList.contains('rise')) el.classList.add('done');
      });
    };

    if (rm.matches) {
      pin();
      const onChange = () => { if (!rm.matches) window.location.reload(); };
      rm.addEventListener('change', onChange);
      return () => rm.removeEventListener('change', onChange);
    }

    if (!('IntersectionObserver' in window)) {
      targets().forEach((el) => el.classList.add('in'));
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        el.classList.add('in');
        if (el.classList.contains('rise')) {
          timers.push(setTimeout(() => el.classList.add('done'), 900));
        }
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

    targets().forEach((el) => io.observe(el));

    const onChange = () => { if (rm.matches) { io.disconnect(); pin(); } };
    rm.addEventListener('change', onChange);

    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
      rm.removeEventListener('change', onChange);
    };
  }, []);

  return null;
}

export default Reveal;
