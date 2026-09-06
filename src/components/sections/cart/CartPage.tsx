'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import {
  useCart, countOf, subtotalOf, vatInside, freeShippingGap,
} from '@/lib/cart/store';
import { formatCents } from '@/components/primitives/Price';
import { tokens } from '@/design/tokens';

export function CartPage() {
  const t = useTranslations('cart');
  const locale = useLocale();
  const { lines, setQty, remove, undoRemove, lastRemoved, clearUndo } = useCart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const subtotal = subtotalOf(lines);
  const gap = freeShippingGap(subtotal);
  const pct = Math.min(100, Math.round((subtotal / tokens.commerce.freeShippingThreshold) * 100));

  if (!mounted) return <div className="wrap" style={{ minHeight: '50vh' }} />;

  return (
    <div className="wrap" style={{ paddingBlock: 'var(--spacing-8)' }}>
      <h1 style={{ fontSize: 'var(--text-h1)' }}>{t('title')}</h1>

      {/* outside the empty test: undoing the removal of the last line is the
          case that matters most */}
      {lastRemoved && (
        <div className="undo" role="status" style={{ marginTop: 'var(--spacing-5)' }}>
          <span>{t('removed', { name: lastRemoved.line.name })}</span>
          <button type="button" onClick={undoRemove}>{t('undo')}</button>
          <button type="button" className="undo__x" onClick={clearUndo} aria-label={t('close')}>×</button>
        </div>
      )}

      {lines.length === 0 ? (
        <div className="empty">
          <h2 style={{ fontSize: 'var(--text-h2)' }}>{t('emptyTitle')}</h2>
          <p className="lede">{t('emptyBody')}</p>
          <ul className="empty__links">
            <li><Link className="btn btn--ghost" href="/collezioni">{t('emptyCta')}</Link></li>
          </ul>
        </div>
      ) : (
        <div className="cartpage">
          <div>
            <div className="ship" style={{ marginTop: 'var(--spacing-5)' }}>
              <p className="mono">
                {gap > 0 ? t('shipGap', { amount: formatCents(gap, locale) }) : t('shipFree')}
              </p>
              <span className="ship__track" aria-hidden="true"><span style={{ width: `${pct}%` }} /></span>
            </div>

            <ul className="lines">
              {lines.map((l) => (
                <li className="line" key={l.key}>
                  <Image src={l.image} alt="" width={160} height={200} className="line__img" aria-hidden="true" />
                  <div className="line__body">
                    <p className="line__name">{l.name}</p>
                    <p className="line__meta mono">{l.colour} · {l.size}</p>
                    <div className="line__row">
                      <div className="stepper">
                        <button type="button" onClick={() => setQty(l.key, l.qty - 1)} disabled={l.qty <= 1} aria-label={t('less')}>−</button>
                        <span className="stepper__n mono" aria-live="polite">{l.qty}</span>
                        <button
                          type="button" onClick={() => setQty(l.key, l.qty + 1)}
                          disabled={l.qty >= l.maxQty}
                          title={l.qty >= l.maxQty ? t('maxReason', { n: l.maxQty }) : undefined}
                          aria-label={t('more')}
                        >+</button>
                      </div>
                      <span className="line__price mono">{formatCents(l.unitCents * l.qty, locale)}</span>
                    </div>
                    <button type="button" className="line__remove" onClick={() => remove(l.key)}>
                      {t('remove')}
                    </button>
                  </div>
                </li>
              ))}
            </ul>

          </div>

          {/* the summary stays in view while the list scrolls */}
          <aside className="summary" aria-label={t('summary')}>
            <p className="drawer__total">
              <span>{t('subtotal')}</span>
              <span className="mono">{formatCents(subtotal, locale)}</span>
            </p>
            <p className="drawer__vat mono">
              {t('vatInside', { amount: formatCents(vatInside(subtotal), locale) })}
            </p>
            <p className="drawer__ship mono">{t('shippingAtCheckout')}</p>
            <p className="mono" style={{ color: 'var(--fg-2)' }}>
              {t('items', { n: countOf(lines) })}
            </p>
            <Link className="btn btn--primary drawer__cta" href="/checkout">{t('checkout')}</Link>
          </aside>
        </div>
      )}
    </div>
  );
}

export default CartPage;
