'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/lib/i18n/navigation';
import { LocaleSwitch } from './LocaleSwitch';

/**
 * The navigation on a phone.
 *
 * Below 1024px the main nav is hidden, and until now nothing replaced it: the
 * only way into the catalogue from a phone was a button in the hero, and from
 * any other page there was no way at all. This is that missing door.
 *
 * Radix handles the focus trap, Escape and returning focus to the button that
 * opened it. Every link closes the sheet, because a menu that stays open over
 * the page it just navigated to is a menu the reader has to dismiss twice.
 */
export function MobileNav() {
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const groups: { title: string; links: { href: string; label: string }[] }[] = [
    {
      title: t('shop'),
      links: [
        { href: '/collezioni', label: t('collections') },
        { href: '/categoria/t-shirt', label: t('categories') },
        { href: '/carrello', label: t('cart') },
      ],
    },
    {
      title: t('brandCol'),
      links: [
        { href: '/#luna', label: t('tonightsMoon') },
        { href: '/#lune', label: t('thirteenMoons') },
        { href: '/#materia', label: t('material') },
        { href: '/#oracolo', label: t('oracle') },
        { href: '/#cerchio', label: t('circle') },
      ],
    },
    {
      title: t('yours'),
      links: [
        { href: '/account', label: t('account') },
        { href: '/ordini', label: t('orders') },
        { href: '/aiuto', label: t('help') },
      ],
    },
  ];

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="tool navmob__btn" type="button" aria-label={t('menu')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
          </svg>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="drawer__scrim" />
        <Dialog.Content className="drawer navmob" aria-modal="true">
          <div className="drawer__head">
            <Dialog.Title className="eyebrow">{t('menu')}</Dialog.Title>
            <Dialog.Close className="tool" aria-label={t('close')}>✕</Dialog.Close>
          </div>
          <Dialog.Description className="vh">{t('main')}</Dialog.Description>

          <nav className="navmob__in" aria-label={t('main')}>
            {groups.map((g) => (
              <div key={g.title}>
                <p className="eyebrow navmob__g">{g.title}</p>
                <ul>
                  {g.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        onClick={() => setOpen(false)}
                        aria-current={pathname === l.href ? 'page' : undefined}
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* La lingua sta qui e non in cima, sul telefono: nell'intestazione
                era un quarto riquadro in una riga già piena fino al bordo.
                Dai 768px in su torna dov'era, che lo spazio c'è. */}
            <div>
              <p className="eyebrow navmob__g">{t('language')}</p>
              <ul>
                <li>
                  <LocaleSwitch className="navmob__lang" esteso onSwitch={() => setOpen(false)} />
                </li>
              </ul>
            </div>
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default MobileNav;
