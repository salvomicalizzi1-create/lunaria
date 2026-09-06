import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { ClearAfterPayment } from '@/components/sections/checkout/ThankYou';
import { OrderView } from '@/components/sections/orders/OrderView';
import { orderByPaymentIntent } from '@/lib/orders/store';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'thanks' });
  return { title: `${t('title')} · LUNARIA`, robots: { index: false, follow: false } };
}

/**
 * The order, straight after paying.
 *
 * It is read back from Stripe by the payment's own id rather than assembled from
 * whatever the browser still remembers. That matters for one specific reason:
 * this page is where somebody checks that what they were charged is what they
 * agreed to, and the only version of that worth showing is the one the payment
 * processor holds.
 *
 * The id arrives in the address. It is unguessable and it is the customer's own,
 * the same way a receipt link is; looking an order up from cold instead needs
 * both the number and the email, which is what /ordini asks for.
 */
export default async function Grazie({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ pi?: string; payment_intent?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations('thanks');

  // ?pi is ours; ?payment_intent is what Stripe appends coming back from a
  // redirect payment method, and both mean the same thing
  const id = sp.pi ?? sp.payment_intent ?? '';
  const order = id ? await orderByPaymentIntent(id) : null;

  return (
    <div className="wrap" style={{ paddingBlock: 'var(--spacing-9)', maxWidth: '860px' }}>
      <ClearAfterPayment />

      <p className="eyebrow">{t('eyebrow')}</p>
      <h1 style={{ fontSize: 'var(--text-h1)', marginBlock: 'var(--spacing-3)' }}>{t('title')}</h1>

      {order ? (
        <>
          <p className="lede" style={{ marginBottom: 'var(--spacing-7)' }}>
            {order.email ? t('bodyWithEmail', { email: order.email }) : t('body')}
          </p>
          <OrderView order={order} />
          <p style={{ marginTop: 'var(--spacing-7)', display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
            <Link className="btn btn--ghost" href="/collezioni">{t('keepLooking')}</Link>
            <Link className="btn btn--ghost" href="/account">{t('toAccount')}</Link>
          </p>
        </>
      ) : (
        /* No id, or an id this shop does not know. Saying so beats printing a
           reassuring reference number that leads nowhere. */
        <>
          <p className="lede">{t('noRecordBody')}</p>
          <p style={{ marginTop: 'var(--spacing-6)', display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
            <Link className="btn btn--primary" href="/ordini">{t('findOrder')}</Link>
            <Link className="btn btn--ghost" href="/collezioni">{t('keepLooking')}</Link>
          </p>
        </>
      )}
    </div>
  );
}
