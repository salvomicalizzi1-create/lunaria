import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { commerce } from '@/lib/commerce';
import { collections } from '@/data/collections';
import { ProductListing } from '@/components/patterns/ProductListing';
import { routing, type Locale } from '@/lib/i18n/routing';

type Params = { locale: string; slug: string };
type Search = Record<string, string | string[] | undefined>;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    collections.map((c) => ({ locale, slug: c.id }))
  );
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const collection = await commerce.getCollection(slug);
  if (!collection) return {};
  const l = locale as Locale;

  return {
    title: `${collection.name[l]} · LUNARIA`,
    description: collection.meaning[l],
    alternates: {
      // filtered listings point back at the clean collection page, so search
      // engines index one address instead of a hundred permutations
      canonical: `/${locale}/collezioni/${slug}`,
    },
  };
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;

  const collection = await commerce.getCollection(slug);
  if (!collection) notFound();
  const l = locale as Locale;

  return (
    <ProductListing
      base={`/collezioni/${slug}`}
      params={sp}
      fixed={{ collection: collection.id }}
      locale={l}
      title={collection.name[l]}
      intro={collection.meaning[l]}
    />
  );
}
