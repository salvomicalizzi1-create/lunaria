'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { Field } from '@/components/sections/checkout/Field';
import { useAccount } from '@/lib/account/store';
import { useCheckout, contactErrors, shippingErrors } from '@/lib/checkout/store';

const COUNTRIES = ['IT', 'FR', 'DE', 'ES', 'NL', 'BE', 'AT', 'PT', 'IE', 'GB', 'CH', 'US'];

/**
 * The account, and what it honestly is.
 *
 * No password, no server, no session — because there is no service behind this
 * shop that could hold one, and a login form implying otherwise would be a lie
 * people only discover on a second device. What this page really offers is what
 * a browser can actually do: remember your details so the checkout can fill
 * itself in, and keep the numbers of the orders placed here so you can open them
 * again. The page says that in the first paragraph rather than in a footnote.
 *
 * The orders themselves are not here. Opening one asks Stripe, where it lives.
 */
export function AccountPanel() {
  const t = useTranslations('account');
  // the field errors are the checkout's own words; there is no reason to write
  // a second set that says the same thing slightly differently
  const te = useTranslations('checkout');
  const { contact, address, orders, save, forgetOrder, forgetEverything } = useAccount();
  const checkout = useCheckout();

  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => setMounted(true), []);

  /* The form edits the checkout store directly, so "save" means: keep what is
     already there. Anything typed here is what the next checkout starts from. */
  useEffect(() => {
    if (!mounted) return;
    const s = useCheckout.getState();
    const empty = !s.contact.email && !s.shipping.line1;
    if (empty && contact && address) useCheckout.setState({ contact, shipping: address });
  }, [mounted, contact, address]);

  if (!mounted) return <div style={{ minHeight: '50vh' }} />;

  const tr = (k: string) => te(k as 'errEmailRequired');

  function onSave() {
    const s = useCheckout.getState();
    const e = { ...contactErrors(s.contact, tr), ...shippingErrors(s.shipping, tr) };
    setErrors(e);
    if (Object.keys(e).length > 0) { setSaved(false); return; }
    save(s.contact, s.shipping);
    setSaved(true);
  }

  const err = (k: string) => errors[k] || undefined;

  return (
    <>
      <section className="acct__block" aria-labelledby="acct-you">
        <h2 id="acct-you" style={{ fontSize: 'var(--text-h3)' }}>{t('yourDetails')}</h2>
        <p className="lede">{t('yourDetailsBody')}</p>

        <Field
          id="a-email" label={t('email')} value={checkout.contact.email} required
          type="email" autoComplete="email" inputMode="email" error={err('email')}
          onChange={(v) => { setSaved(false); checkout.setContact({ email: v }); }}
        />
        <div className="co__row">
          <Field
            id="a-first" label={t('firstName')} value={checkout.contact.firstName} required
            autoComplete="given-name" error={err('firstName')}
            onChange={(v) => { setSaved(false); checkout.setContact({ firstName: v }); }}
          />
          <Field
            id="a-last" label={t('lastName')} value={checkout.contact.lastName} required
            autoComplete="family-name" error={err('lastName')}
            onChange={(v) => { setSaved(false); checkout.setContact({ lastName: v }); }}
          />
        </div>
        <Field
          id="a-line1" label={t('address')} value={checkout.shipping.line1} required
          autoComplete="address-line1" error={err('line1')}
          onChange={(v) => { setSaved(false); checkout.setShipping({ line1: v }); }}
        />
        <div className="co__row">
          <Field
            id="a-postcode" label={t('postcode')} value={checkout.shipping.postcode} required
            autoComplete="postal-code" inputMode="numeric" maxLength={10} error={err('postcode')}
            onChange={(v) => { setSaved(false); checkout.setShipping({ postcode: v }); }}
          />
          <Field
            id="a-city" label={t('city')} value={checkout.shipping.city} required
            autoComplete="address-level2" error={err('city')}
            onChange={(v) => { setSaved(false); checkout.setShipping({ city: v }); }}
          />
        </div>
        <div className="fld">
          <label className="fld__label" htmlFor="a-country">{t('country')}</label>
          <select
            id="a-country" className="fld__input" value={checkout.shipping.country}
            autoComplete="country"
            onChange={(e) => { setSaved(false); checkout.setShipping({ country: e.target.value }); }}
          >
            {COUNTRIES.map((c) => <option key={c} value={c}>{t(`country_${c}` as 'country_IT')}</option>)}
          </select>
          <i className="fld__line" aria-hidden="true" />
        </div>

        <div className="acct__actions">
          <button className="btn btn--primary" type="button" onClick={onSave}>{t('save')}</button>
          <p className="acct__saved" role="status">{saved ? t('savedHere') : ''}</p>
        </div>
      </section>

      <section className="acct__block" aria-labelledby="acct-orders">
        <h2 id="acct-orders" style={{ fontSize: 'var(--text-h3)' }}>{t('yourOrders')}</h2>
        {orders.length === 0 ? (
          <>
            <p className="lede">{t('noOrders')}</p>
            <Link className="btn btn--ghost" href="/collezioni">{t('toCollections')}</Link>
          </>
        ) : (
          <>
            <p className="lede">{t('ordersBody')}</p>
            <ul className="acct__orders">
              {orders.map((o) => (
                <li key={o.number}>
                  <span className="mono">{o.number}</span>
                  <span className="acct__when mono">
                    {new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
                      .format(new Date(o.seenAt))}
                  </span>
                  <Link className="btn btn--ghost" href="/ordini">{t('open')}</Link>
                  <button className="acct__forget" type="button" onClick={() => forgetOrder(o.number)}>
                    {t('forget')}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="acct__block" aria-labelledby="acct-data">
        <h2 id="acct-data" style={{ fontSize: 'var(--text-h3)' }}>{t('yourData')}</h2>
        <p className="lede">{t('yourDataBody')}</p>
        <button
          className="btn btn--ghost"
          type="button"
          onClick={() => {
            forgetEverything();
            useCheckout.getState().reset();
            setSaved(false);
          }}
        >
          {t('forgetAll')}
        </button>
      </section>
    </>
  );
}

export default AccountPanel;
