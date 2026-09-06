'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Field } from '@/components/sections/checkout/Field';
import { useAccount } from '@/lib/account/store';
import { lookupOrder, type LookupState } from '@/app/[locale]/ordini/actions';
import { OrderView } from './OrderView';

/**
 * Finding an order without an account.
 *
 * The number and the email together, which is the pattern every shop that does
 * not force a login uses: the number alone is not enough to open somebody else's
 * order, and neither is the address.
 *
 * Both fields are prefilled from whatever this browser remembers, so the common
 * case — you bought something here last week — is one click.
 */
export function OrderLookup() {
  const t = useTranslations('orders');
  const [state, action, pending] = useActionState<LookupState, FormData>(
    lookupOrder,
    { kind: 'idle' },
  );

  const orders = useAccount((s) => s.orders);
  const [mounted, setMounted] = useState(false);
  const [number, setNumber] = useState('');
  const [email, setEmail] = useState('');
  const resultRef = useRef<HTMLDivElement>(null);

  // the remembered list lives in this browser, so it is not rendered on the server
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!mounted || orders.length === 0 || number) return;
    setNumber(orders[0].number);
    setEmail(orders[0].email);
  }, [mounted, orders, number]);

  // an answer that appears below the fold is an answer nobody saw
  useEffect(() => {
    if (state.kind !== 'idle') resultRef.current?.focus();
  }, [state]);

  const message =
    state.kind === 'not_found' ? t('notFound')
      : state.kind === 'unavailable' ? t('unavailable')
        : state.kind === 'too_many' ? t('tooMany')
          : null;

  return (
    <>
      <form action={action} className="lookup">
        <Field
          id="f-number" label={t('numberLabel')} value={number} required
          hint={t('numberHint')}
          error={state.kind === 'invalid' && state.field === 'number' ? t('numberInvalid') : undefined}
          onChange={setNumber}
          name="number"
          autoComplete="off"
        />
        <Field
          id="f-email" label={t('emailLabel')} value={email} required
          type="email" inputMode="email" autoComplete="email"
          hint={t('emailHint')}
          error={state.kind === 'invalid' && state.field === 'email' ? t('emailInvalid') : undefined}
          onChange={setEmail}
          name="email"
        />
        <button className="btn btn--primary" type="submit" disabled={pending}>
          {pending ? t('searching') : t('search')}
        </button>
      </form>

      <div ref={resultRef} tabIndex={-1} className="lookup__out">
        {message && <p className="lookup__msg" role="alert">{message}</p>}
        {state.kind === 'found' && <OrderView order={state.order} />}
      </div>

      {mounted && orders.length > 1 && (
        <section className="lookup__known" aria-labelledby="known">
          <h2 id="known" className="eyebrow">{t('knownHere')}</h2>
          <ul>
            {orders.map((o) => (
              <li key={o.number}>
                <button
                  type="button"
                  className="lookup__chip mono"
                  onClick={() => { setNumber(o.number); setEmail(o.email); }}
                >
                  {o.number}
                </button>
              </li>
            ))}
          </ul>
          <p className="lookup__note">{t('knownNote')}</p>
        </section>
      )}
    </>
  );
}

export default OrderLookup;
