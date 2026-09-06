import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { CartPage } from '@/components/sections/cart/CartPage';
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
  const t = await getTranslations({ locale, namespace: 'cart' });
  return {
    title: `${t('title')} · LUNARIA`,
    // a cart is personal and has nothing to offer a search engine
    robots: { index: false, follow: true },
  };
}

/** The drawer is the primary experience; this page is the fallback, and the
 *  address someone can bookmark or send to themselves. */
export default async function Carrello({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CartPage />;
}
