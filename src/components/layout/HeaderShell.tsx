'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname } from '@/lib/i18n/navigation';

/**
 * The header element itself.
 *
 * On the homepage the header sits over the film, where it has no ground of its
 * own and the footage behind it can be bright mist, so it carries its own scrim
 * and turns solid once the reader is past the hero. Everywhere else it is solid
 * from the first pixel, because everywhere else there is a page under it.
 *
 * Its children are still rendered on the server: this component is a client
 * boundary around them, not a client version of them.
 */
export function HeaderShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const overHero = pathname === '/';
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    if (!overHero) return;
    const onScroll = () => setSolid(window.scrollY > window.innerHeight * 0.7);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [overHero]);

  const cls = ['hdr', overHero ? 'hdr--over' : '', overHero && solid ? 'is-solid' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <header className={cls}>
      <div className="wrap hdr__in">{children}</div>
    </header>
  );
}

export default HeaderShell;
