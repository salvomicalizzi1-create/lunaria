'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Link, useRouter } from '@/lib/i18n/navigation';
import { useCart, subtotalOf } from '@/lib/cart/store';
import { useCheckout, contactErrors, shippingErrors } from '@/lib/checkout/store';
import { useAccount } from '@/lib/account/store';
import { shippingFor } from '@/lib/checkout/pricing';
import { formatCents } from '@/components/primitives/Price';
import { tokens } from '@/design/tokens';
import { Field } from './Field';
import { PaymentStep } from './PaymentStep';

type Step = 'contatto' | 'spedizione' | 'pagamento';
const STEPS: Step[] = ['contatto', 'spedizione', 'pagamento'];

const COUNTRIES = ['IT', 'FR', 'DE', 'ES', 'NL', 'BE', 'AT', 'PT', 'IE', 'GB', 'CH', 'US'];

export function CheckoutFlow() {
  const t = useTranslations('checkout');
  const locale = useLocale();
  const router = useRouter();
  const search = useSearchParams();
  const lines = useCart((s) => s.lines);
  const { contact, shipping, billingSameAsShipping, setContact, setShipping, setBillingSame } = useCheckout();

  const [mounted, setMounted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSummaryErrors, setShowSummaryErrors] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  useEffect(() => setMounted(true), []);

  /* If this browser was told to remember somebody, the checkout starts filled
     in. It has to happen here and not only on the account page: the details are
     kept for the length of a visit, the account is kept for good, and somebody
     who saved them last month and opens the checkout directly would otherwise
     find the empty form they thought they had got rid of. Anything already
     typed in this visit wins — a remembered address must never overwrite the
     one being entered right now. */
  useEffect(() => {
    const a = useAccount.getState();
    const s = useCheckout.getState();
    if (s.contact.email || s.shipping.line1) return;
    if (a.contact && a.address) useCheckout.setState({ contact: a.contact, shipping: a.address });
  }, []);

  const param = search.get('passo');
  const step: Step = STEPS.includes(param as Step) ? (param as Step) : 'contatto';

  const subtotal = subtotalOf(lines);
  const shippingCents = shippingFor(shipping.country, subtotal);
  const total = subtotal + shippingCents;
  const vat = Math.round(total - total / (1 + tokens.commerce.vatRate));

  // the back button must work between steps, so the step lives in the address
  const goto = (s: Step) => router.push(`/checkout?passo=${s}`);

  const tr = useMemo(() => (k: string) => t(k as 'errEmailRequired'), [t]);

  /* Read the store as it is NOW, not as it was when this handler was created.
     Typing and blurring in the same tick used to validate the previous value,
     so pasting an address and tabbing straight out showed an error that was
     already fixed. */
  const currentErrors = (which: Step) => {
    const s = useCheckout.getState();
    return which === 'contatto' ? contactErrors(s.contact, tr) : shippingErrors(s.shipping, tr);
  };

  function validateAndAdvance(next: Step) {
    const e = currentErrors(step);
    setErrors(e);
    if (Object.keys(e).length > 0) {
      setShowSummaryErrors(true);
      // move the reader to the list of problems instead of leaving them lost
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    setShowSummaryErrors(false);
    goto(next);
  }

  /* validation runs on blur, never while someone is still typing */
  const blurCheck = (field: string) => () => {
    const e = currentErrors(step);
    setErrors((prev) => ({ ...prev, [field]: e[field] ?? '' }));
  };
  const err = (k: string) => (errors[k] ? errors[k] : undefined);

  if (!mounted) return <div className="wrap" style={{ minHeight: '60vh' }} />;

  if (lines.length === 0) {
    return (
      <div className="wrap" style={{ paddingBlock: 'var(--spacing-9)' }}>
        <h1 style={{ fontSize: 'var(--text-h1)' }}>{t('emptyTitle')}</h1>
        <p className="lede" style={{ marginBlock: 'var(--spacing-4)' }}>{t('emptyBody')}</p>
        <Link className="btn btn--ghost" href="/collezioni">{t('emptyCta')}</Link>
      </div>
    );
  }

  const errorList = Object.entries(errors).filter(([, v]) => v);

  return (
    <div className="wrap co">
      <div className="co__main">
        <h1 className="co__title">{t('title')}</h1>

        <ol className="steps" aria-label={t('stepsLabel')}>
          {STEPS.map((s, i) => (
            <li key={s} className="steps__i" aria-current={s === step ? 'step' : undefined}>
              <span className="mono">{i + 1}</span> {t(`step_${s}` as 'step_contatto')}
            </li>
          ))}
        </ol>

        {/* Errors appear both here at the top and beside their field, and each
            one is a link that moves focus to the field it is about. */}
        {showSummaryErrors && errorList.length > 0 && (
          <div className="errsum" role="alert" tabIndex={-1} ref={summaryRef}>
            <p className="errsum__t">{t('errSummary', { n: errorList.length })}</p>
            <ul>
              {errorList.map(([k, v]) => (
                <li key={k}><a href={`#f-${k}`}>{v}</a></li>
              ))}
            </ul>
          </div>
        )}

        {step === 'contatto' && (
          <section className="co__step" aria-labelledby="s1">
            <h2 id="s1" className="eyebrow">{t('step_contatto')}</h2>
            <p className="co__guest">{t('guestNote')}</p>
            <Field
              id="f-email" label={t('email')} value={contact.email} required
              type="email" autoComplete="email" inputMode="email"
              onChange={(v) => setContact({ email: v })} onBlur={blurCheck('email')}
              error={err('email')} hint={t('emailHint')}
            />
            <div className="co__row">
              <Field
                id="f-firstName" label={t('firstName')} value={contact.firstName} required
                autoComplete="given-name"
                onChange={(v) => setContact({ firstName: v })} onBlur={blurCheck('firstName')}
                error={err('firstName')}
              />
              <Field
                id="f-lastName" label={t('lastName')} value={contact.lastName} required
                autoComplete="family-name"
                onChange={(v) => setContact({ lastName: v })} onBlur={blurCheck('lastName')}
                error={err('lastName')}
              />
            </div>
            <div className="co__nav">
              <button className="btn btn--primary" type="button" onClick={() => validateAndAdvance('spedizione')}>
                {t('toShipping')}
              </button>
            </div>
          </section>
        )}

        {step === 'spedizione' && (
          <section className="co__step" aria-labelledby="s2">
            <h2 id="s2" className="eyebrow">{t('step_spedizione')}</h2>
            <Field
              id="f-line1" label={t('address')} value={shipping.line1} required
              autoComplete="address-line1"
              onChange={(v) => setShipping({ line1: v })} onBlur={blurCheck('line1')}
              error={err('line1')}
            />
            <Field
              id="f-line2" label={t('address2')} value={shipping.line2}
              autoComplete="address-line2"
              onChange={(v) => setShipping({ line2: v })}
            />
            <div className="co__row">
              <Field
                id="f-postcode" label={t('postcode')} value={shipping.postcode} required
                autoComplete="postal-code" inputMode="numeric" maxLength={10}
                onChange={(v) => setShipping({ postcode: v })} onBlur={blurCheck('postcode')}
                error={err('postcode')}
              />
              <Field
                id="f-city" label={t('city')} value={shipping.city} required
                autoComplete="address-level2"
                onChange={(v) => setShipping({ city: v })} onBlur={blurCheck('city')}
                error={err('city')}
              />
            </div>
            <div className="co__row">
              <Field
                id="f-province" label={t('province')} value={shipping.province}
                autoComplete="address-level1"
                onChange={(v) => setShipping({ province: v })}
              />
              <div className="fld">
                <label className="fld__label" htmlFor="f-country">{t('country')} <span aria-hidden="true">*</span></label>
                <select
                  id="f-country" className="fld__input"
                  value={shipping.country} autoComplete="country"
                  onChange={(e) => setShipping({ country: e.target.value })}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{t(`country_${c}` as 'country_IT')}</option>
                  ))}
                </select>
                <i className="fld__line" aria-hidden="true" />
              </div>
            </div>
            <Field
              id="f-phone" label={t('phone')} value={shipping.phone}
              type="tel" autoComplete="tel" inputMode="tel"
              onChange={(v) => setShipping({ phone: v })} hint={t('phoneHint')}
            />

            {/* redundant entry, SC 3.3.7: never ask for the same data twice */}
            <label className="co__same">
              <input
                type="checkbox" checked={billingSameAsShipping}
                onChange={(e) => setBillingSame(e.target.checked)}
              />
              <span>{t('billingSame')}</span>
            </label>

            <div className="co__nav">
              <button className="btn btn--ghost" type="button" onClick={() => goto('contatto')}>{t('back')}</button>
              <button className="btn btn--primary" type="button" onClick={() => validateAndAdvance('pagamento')}>
                {t('toPayment')}
              </button>
            </div>
          </section>
        )}

        {step === 'pagamento' && (
          <section className="co__step" aria-labelledby="s3">
            <h2 id="s3" className="eyebrow">{t('step_pagamento')}</h2>
            <p className="co__ship mono">
              {t('shippingTo', {
                name: `${contact.firstName} ${contact.lastName}`.trim(),
                address: [shipping.line1, shipping.postcode, shipping.city].filter(Boolean).join(', '),
              })}
              {' '}
              <button className="co__edit" type="button" onClick={() => goto('spedizione')}>{t('edit')}</button>
            </p>
            <PaymentStep />
            <div className="co__nav">
              <button className="btn btn--ghost" type="button" onClick={() => goto('spedizione')}>{t('back')}</button>
            </div>
          </section>
        )}
      </div>

      {/* the summary never leaves the screen, and the shipping cost is in it
          from the first step, so nothing appears at the end as a surprise */}
      <aside className="co__summary" aria-label={t('summary')}>
        <h2 className="eyebrow">{t('summary')}</h2>
        <ul className="co__lines">
          {lines.map((l) => (
            <li key={l.key}>
              <Image src={l.image} alt="" width={80} height={100} aria-hidden="true" />
              <span>
                <strong>{l.name}</strong>
                <span className="mono"> {l.colour} · {l.size} · ×{l.qty}</span>
              </span>
              <span className="mono">{formatCents(l.unitCents * l.qty, locale)}</span>
            </li>
          ))}
        </ul>
        <dl className="co__totals">
          <div><dt>{t('subtotal')}</dt><dd className="mono">{formatCents(subtotal, locale)}</dd></div>
          <div>
            <dt>{t('shipping')}</dt>
            <dd className="mono">{shippingCents === 0 ? t('free') : formatCents(shippingCents, locale)}</dd>
          </div>
          <div className="co__grand"><dt>{t('total')}</dt><dd className="mono">{formatCents(total, locale)}</dd></div>
          <div><dt>{t('ofWhichVat')}</dt><dd className="mono">{formatCents(vat, locale)}</dd></div>
        </dl>

        {/* the trust row: what is true, where the money goes, who to call */}
        <ul className="trust">
          <li>{t('trustSecure')}</li>
          <li>{t('trustWithdrawal')}</li>
          <li>{t('trustContact')}</li>
        </ul>
        <p className="co__demo">{t('demoNote')}</p>
      </aside>
    </div>
  );
}

export default CheckoutFlow;
