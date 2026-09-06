'use client';

import { useEffect, useState } from 'react';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/lib/i18n/navigation';
import { useCart } from '@/lib/cart/store';
import { useCheckout } from '@/lib/checkout/store';
import { useAccount } from '@/lib/account/store';
import { formatCents } from '@/components/primitives/Price';

let stripePromise: Promise<Stripe | null> | null = null;
function getStripe() {
  const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!pk) return null;
  stripePromise ??= loadStripe(pk);
  return stripePromise;
}

type Totals = { subtotalCents: number; shippingCents: number; totalCents: number; vatCents: number };

/* --------------------------------------------------------------- the form */
function PayForm({ totals, paymentIntentId }: { totals: Totals; paymentIntentId: string }) {
  const t = useTranslations('checkout');
  const locale = useLocale();
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setError(null);

    /* Both endings land on the same address. A card confirms in place and we
       navigate; a wallet or a bank redirect leaves the site and comes back, and
       Stripe appends its own parameters to whatever return_url says — so the
       payment id has to already be in it. */
    const done = `/checkout/grazie?pi=${encodeURIComponent(paymentIntentId)}`;

    const { error: err } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/${locale}${done}` },
      redirect: 'if_required',
    });

    if (err) {
      setError(err.message ?? t('payFailed'));
      setBusy(false);
      return;
    }
    router.push(done);
  }

  return (
    <form onSubmit={submit} className="pay">
      <PaymentElement options={{ layout: 'tabs' }} />

      {error && (
        <p className="pay__err" role="alert">{error}</p>
      )}

      <button className="btn btn--primary pay__cta" type="submit" disabled={busy || !stripe}>
        {busy ? t('paying') : t('payNow', { amount: formatCents(totals.totalCents, locale) })}
      </button>

      {/* the test card, said out loud: this shop cannot take real money */}
      <p className="pay__test mono">{t('testCard')}</p>
    </form>
  );
}

/* ------------------------------------------------------------- the wrapper */
export function PaymentStep() {
  const t = useTranslations('checkout');
  const locale = useLocale();
  const lines = useCart((s) => s.lines);
  const { contact, shipping } = useCheckout();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const remember = useAccount((s) => s.rememberOrder);

  useEffect(() => {
    if (lines.length === 0) return;
    let cancelled = false;

    /* Read the contact and the address as they are now rather than depending on
       them: they are settled by the time this step is reachable, and depending
       on every field would build a new payment intent on every keystroke.
       Going back to edit unmounts this step, so returning re-runs it. */
    const s = useCheckout.getState();

    fetch('/api/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        // only what was chosen. The price is decided on the server.
        cart: lines.map((l) => ({ slug: l.slug, variantId: l.variantId, size: l.size, qty: l.qty })),
        country: s.shipping.country,
        email: s.contact.email,
        name: `${s.contact.firstName} ${s.contact.lastName}`.trim(),
        address: {
          line1: s.shipping.line1,
          line2: s.shipping.line2,
          postcode: s.shipping.postcode,
          city: s.shipping.city,
          province: s.shipping.province,
        },
        locale,
      }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? 'error');
        return data;
      })
      .then((d) => {
        if (cancelled) return;
        setClientSecret(d.clientSecret);
        setPaymentIntentId(d.paymentIntentId);
        setTotals(d.totals);
        // the browser keeps the number so this person can find the order again
        // without an account; nothing about it leaves the device
        remember({ number: d.order, paymentIntentId: d.paymentIntentId, email: s.contact.email });
      })
      .catch((e) => { if (!cancelled) setFailed(String(e.message)) });

    return () => { cancelled = true };
  }, [lines, shipping.country, contact.email, locale, remember]);

  const stripe = getStripe();

  if (!stripe) return <p className="pay__err">{t('noKey')}</p>;
  if (failed) return <p className="pay__err" role="alert">{t('setupFailed', { reason: failed })}</p>;
  if (!clientSecret || !totals || !paymentIntentId) return <p className="mono">{t('preparing')}</p>;

  return (
    <Elements
      stripe={stripe}
      options={{
        clientSecret,
        appearance: {
          theme: 'night',
          variables: {
            colorPrimary: '#8FA5D8',
            colorBackground: '#131A2E',
            colorText: '#C9CEDC',
            colorDanger: '#C4726A',
            fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
            borderRadius: '0px',
            spacingUnit: '4px',
          },
        },
      }}
    >
      <PayForm totals={totals} paymentIntentId={paymentIntentId} />
    </Elements>
  );
}

export default PaymentStep;
