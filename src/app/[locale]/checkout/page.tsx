import type { Metadata } from 'next';
import { Suspense } from 'react';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { CheckoutFlow } from '@/components/sections/checkout/CheckoutFlow';
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
  const t = await getTranslations({ locale, namespace: 'checkout' });
  return {
    title: `${t('title')} · LUNARIA`,
    // a checkout is nobody's business but the buyer's
    robots: { index: false, follow: false },
  };
}

export default async function Checkout({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={<div className="wrap" style={{ minHeight: '60vh' }} />}>
      <CheckoutFlow />
    </Suspense>
  );
}
