'use client';

import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { productBySlug } from '@/data/products';
import { formatCents } from '@/components/primitives/Price';
import { tokens } from '@/design/tokens';
import { returnsCloseOn, returnWindowOpen, type Order } from '@/lib/orders/types';
import { ReturnRequest } from './ReturnRequest';
import type { Locale } from '@/lib/i18n/routing';

/**
 * One order, shown the same way wherever it is reached from: straight after
 * paying, or looked up weeks later with the number and the email.
 *
 * The money comes from the order record, not from the catalogue. A price that
 * changed since the purchase must not quietly rewrite what somebody was charged,
 * and recomputing the total from today's prices is exactly how that happens.
 *
 * It runs in the browser so that the lookup form can render its result without a
 * round trip through the address bar — an email does not belong in a query
 * string, in a log, or in somebody's browser history.
 */
export function OrderView({ order }: { order: Order }) {
  const t = useTranslations('orders');
  const locale = useLocale() as Locale;

  const created = new Date(order.createdAt);
  const dateFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en-IE' : 'it-IT', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const dayFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en-IE' : 'it-IT', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const lines = order.lines.map((l) => {
    const p = productBySlug[l.slug];
    const variant = p?.variants.find((v) => v.id === l.variantId);
    return {
      ...l,
      name: p ? p.name[locale] : l.slug,
      colour: variant ? variant.colour[locale] : l.variantId,
      image: p?.image ?? null,
      href: p ? `/prodotto/${p.slug}` : null,
    };
  });

  const canReturn = returnWindowOpen(order, tokens.commerce.returnDays);
  const closes = returnsCloseOn(order, tokens.commerce.returnDays);

  return (
    <article className="order">
      <header className="order__head">
        <div>
          <p className="eyebrow">{t('number')}</p>
          <p className="order__n mono">{order.number}</p>
        </div>
        <div>
          <p className="eyebrow">{t('placedOn')}</p>
          <p className="mono">{dateFmt.format(created)}</p>
        </div>
        <div>
          <p className="eyebrow">{t('status')}</p>
          {/* the state is a word and a mark, never a colour on its own */}
          <p className={`order__status order__status--${order.status}`}>
            <span aria-hidden="true">
              {order.status === 'paid' ? '●' : order.status === 'processing' ? '◐' : '○'}
            </span>{' '}
            {t(`status_${order.status}` as 'status_paid')}
          </p>
        </div>
      </header>

      <ul className="order__lines">
        {lines.map((l, i) => (
          <li key={`${l.slug}-${l.variantId}-${l.size}-${i}`}>
            {l.image && <Image src={l.image} alt="" aria-hidden="true" width={72} height={90} />}
            <span className="order__line">
              <strong>{l.href ? <Link href={l.href}>{l.name}</Link> : l.name}</strong>
              <span className="mono">{l.colour} · {l.size} · ×{l.qty}</span>
            </span>
            <span className="mono">{formatCents(l.unitCents * l.qty, locale)}</span>
          </li>
        ))}
      </ul>

      <dl className="order__totals">
        <div><dt>{t('subtotal')}</dt><dd className="mono">{formatCents(order.subtotalCents, locale)}</dd></div>
        <div>
          <dt>{t('shipping')}</dt>
          <dd className="mono">{order.shippingCents === 0 ? t('free') : formatCents(order.shippingCents, locale)}</dd>
        </div>
        <div className="order__grand">
          <dt>{t('total')}</dt><dd className="mono">{formatCents(order.totalCents, locale)}</dd>
        </div>
        <div><dt>{t('ofWhichVat')}</dt><dd className="mono">{formatCents(order.vatCents, locale)}</dd></div>
      </dl>

      <div className="order__cols">
        <section aria-labelledby={`sh-${order.number}`}>
          <h3 id={`sh-${order.number}`} className="eyebrow">{t('shippingTo')}</h3>
          <p className="order__addr">
            {order.name}<br />
            {order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ''}<br />
            {order.address.postcode} {order.address.city}
            {order.address.province ? ` (${order.address.province})` : ''}<br />
            {order.address.country}
          </p>
          <p className="order__email mono">{order.email}</p>
        </section>

        <section aria-labelledby={`nx-${order.number}`}>
          <h3 id={`nx-${order.number}`} className="eyebrow">{t('whatNext')}</h3>
          <p>{t('whatNextBody')}</p>
          <p className="order__withdrawal">
            {canReturn ? t('returnOpen', { date: dayFmt.format(closes) }) : t('returnClosed')}
          </p>
        </section>
      </div>

      {canReturn && (
        <ReturnRequest
          orderNumber={order.number}
          email={order.email}
          lines={lines.map((l) => ({
            key: `${l.slug}-${l.variantId}-${l.size}`,
            label: `${l.name} · ${l.colour} · ${l.size} · x${l.qty}`,
          }))}
        />
      )}

      <p className="co__demo">{t('demoNote')}</p>
    </article>
  );
}

export default OrderView;
