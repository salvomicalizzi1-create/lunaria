import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { commerce } from '@/lib/commerce';
import { categories } from '@/data/collections';
import { ProductListing } from '@/components/patterns/ProductListing';
import { routing, type Locale } from '@/lib/i18n/routing';

type Params = { locale: string; slug: string };
type Search = Record<string, string | string[] | undefined>;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    categories.map((c) => ({ locale, slug: c.id }))
  );
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const category = await commerce.getCategory(slug);
  if (!category) return {};
  const l = locale as Locale;
  const t = await getTranslations({ locale, namespace: 'plp' });

  return {
    title: `${category.name[l]} · LUNARIA`,
    description: t('categoryDescription', { name: category.name[l].toLowerCase() }),
    alternates: { canonical: `/${locale}/categoria/${slug}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;

  const category = await commerce.getCategory(slug);
  if (!category) notFound();
  const l = locale as Locale;

  return (
    <ProductListing
      base={`/categoria/${slug}`}
      params={sp}
      fixed={{ category: category.id }}
      locale={l}
      title={category.name[l]}
    />
  );
}
