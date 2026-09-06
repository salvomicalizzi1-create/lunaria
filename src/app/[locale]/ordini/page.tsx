import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { OrderLookup } from '@/components/sections/orders/OrderLookup';
import { routing } from '@/lib/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'orders' });
  return {
    title: `${t('title')} · LUNARIA`,
    description: t('lede'),
    // somebody's order is not a search result
    robots: { index: false, follow: true },
  };
}

export default async function Ordini({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('orders');

  return (
    <div className="wrap" style={{ paddingBlock: 'var(--spacing-9)', maxWidth: '860px' }}>
      <p className="eyebrow">{t('eyebrow')}</p>
      <h1 style={{ fontSize: 'var(--text-h1)', marginBlock: 'var(--spacing-3)' }}>{t('title')}</h1>
      <p className="lede">{t('lede')}</p>

      <OrderLookup />

      <p style={{ marginTop: 'var(--spacing-8)' }}>
        <Link className="btn btn--ghost" href="/aiuto">{t('needHelp')}</Link>
      </p>
    </div>
  );
}
