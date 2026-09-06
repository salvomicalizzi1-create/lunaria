import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { DocPage, type DocSection } from '@/components/sections/doc/DocPage';
import { routing } from '@/lib/i18n/routing';

const SLUGS = ['privacy', 'termini', 'recesso', 'cookie'] as const;
type Slug = (typeof SLUGS)[number];

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => SLUGS.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!SLUGS.includes(slug as Slug)) return {};
  const t = await getTranslations({ locale, namespace: `legal.${slug}` });
  return { title: `${t('title')} · LUNARIA`, description: t('lede') };
}

export default async function Legale({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!SLUGS.includes(slug as Slug)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations(`legal.${slug}`);
  const legal = await getTranslations('legal');

  return (
    <DocPage
      eyebrow={legal('eyebrow')}
      title={t('title')}
      lede={t('lede')}
      sections={t.raw('sections') as DocSection[]}
      tagLabel={legal('tag')}
      backHref="/aiuto"
      backLabel={legal('backToHelp')}
    />
  );
}
