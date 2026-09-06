'use client';

import * as Dialog from '@radix-ui/react-dialog';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import {
  useCart, countOf, subtotalOf, vatInside, freeShippingGap,
} from '@/lib/cart/store';
import { formatCents } from '@/components/primitives/Price';
import { tokens } from '@/design/tokens';

/**
 * Radix handles what is easy to get wrong by hand: the focus trap, Escape,
 * aria-modal, and returning focus to whatever opened it. The drawer never opens
 * by itself; only adding something or pressing the cart button opens it.
 */
export function CartDrawer() {
  const t = useTranslations('cart');
  const locale = useLocale();
  const { lines, open, setOpen, setQty, remove, undoRemove, lastRemoved, clearUndo } = useCart();
  const [mounted, setMounted] = useState(false);

  // the cart lives in localStorage, so nothing about it is rendered on the
  // server: this avoids a hydration mismatch instead of suppressing it
  useEffect(() => setMounted(true), []);

  const count = countOf(lines);
  const subtotal = subtotalOf(lines);
  const gap = freeShippingGap(subtotal);
  const pct = Math.min(100, Math.round((subtotal / tokens.commerce.freeShippingThreshold) * 100));

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        {/* Solo la borsa, a ogni larghezza: accanto all'account e alla lingua,
            che sono già due segni, una parola incorniciata pesava il doppio di
            tutto il resto. Chi non vede legge l'etichetta qui sotto, che dice
            anche quanti capi ci sono dentro. */}
        <button type="button" className="tool cartbtn" aria-label={t('open', { n: count })}>
          <svg
            className="cartbtn__ico" width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"
          >
            <path d="M4 8h16l-1.3 12H5.3L4 8Z" strokeLinejoin="round" />
            <path d="M9 8V6a3 3 0 0 1 6 0v2" strokeLinecap="round" />
          </svg>
          {mounted && count > 0 && <span className="cartbtn__badge">{count}</span>}
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="drawer__scrim" />
        {/* Radix traps focus, closes on Escape, returns focus to the trigger and
            hides the rest of the page. It does not write aria-modal, and the
            brief asks for it, so it is stated explicitly. */}
        <Dialog.Content className="drawer" aria-modal="true" aria-describedby={undefined}>
          <div className="drawer__head">
            <Dialog.Title className="drawer__title">{t('title')}</Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" className="tool" aria-label={t('close')}>×</button>
            </Dialog.Close>
          </div>

          {/* Undo lives outside the empty test on purpose: removing the LAST
              line is exactly when undo matters most, and it used to vanish with
              the list it was inside. */}
          {mounted && lastRemoved && (
            <div className="undo" role="status">
              <span>{t('removed', { name: lastRemoved.line.name })}</span>
              <button type="button" onClick={undoRemove}>{t('undo')}</button>
              <button type="button" className="undo__x" onClick={clearUndo} aria-label={t('close')}>×</button>
            </div>
          )}

          {!mounted ? null : lines.length === 0 ? (
            <div className="drawer__empty">
              <p className="drawer__emptyTitle">{t('emptyTitle')}</p>
              <p className="lede">{t('emptyBody')}</p>
              <Dialog.Close asChild>
                <Link className="btn btn--ghost" href="/collezioni">{t('emptyCta')}</Link>
              </Dialog.Close>
            </div>
          ) : (
            <>
              {/* free shipping progress: a fact about the order, not a nudge */}
              <div className="ship">
                <p className="mono">
                  {gap > 0
                    ? t('shipGap', { amount: formatCents(gap, locale) })
                    : t('shipFree')}
                </p>
                <span className="ship__track" aria-hidden="true">
                  <span style={{ width: `${pct}%` }} />
                </span>
              </div>

              <ul className="lines">
                {lines.map((l) => (
                  <li className="line" key={l.key}>
                    <Image
                      src={l.image} alt="" width={160} height={200}
                      className="line__img" aria-hidden="true"
                    />
                    <div className="line__body">
                      <p className="line__name">{l.name}</p>
                      <p className="line__meta mono">{l.colour} · {l.size}</p>

                      <div className="line__row">
                        <div className="stepper">
                          <button
                            type="button"
                            onClick={() => setQty(l.key, l.qty - 1)}
                            disabled={l.qty <= 1}
                            aria-label={t('less')}
                          >−</button>
                          <span className="stepper__n mono" aria-live="polite">{l.qty}</span>
                          <button
                            type="button"
                            onClick={() => setQty(l.key, l.qty + 1)}
                            disabled={l.qty >= l.maxQty}
                            /* a disabled control always says why */
                            title={l.qty >= l.maxQty ? t('maxReason', { n: l.maxQty }) : undefined}
                            aria-label={t('more')}
                          >+</button>
                        </div>
                        <span className="line__price mono">
                          {formatCents(l.unitCents * l.qty, locale)}
                        </span>
                      </div>

                      {l.qty >= l.maxQty && (
                        <p className="line__reason">{t('maxReason', { n: l.maxQty })}</p>
                      )}

                      {/* remove sits away from the buy actions, never next to them */}
                      <button type="button" className="line__remove" onClick={() => remove(l.key)}>
                        {t('remove')}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="drawer__foot">
                <p className="drawer__total">
                  <span>{t('subtotal')}</span>
                  <span className="mono">{formatCents(subtotal, locale)}</span>
                </p>
                {/* VAT is inside the price and is stated, never a surprise later */}
                <p className="drawer__vat mono">
                  {t('vatInside', { amount: formatCents(vatInside(subtotal), locale) })}
                </p>
                <p className="drawer__ship mono">{t('shippingAtCheckout')}</p>

                <Link className="btn btn--primary drawer__cta" href="/checkout">
                  {t('checkout')}
                </Link>
                <Dialog.Close asChild>
                  <Link className="btn btn--ghost drawer__cta" href="/carrello">
                    {t('viewCart')}
                  </Link>
                </Dialog.Close>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default CartDrawer;
