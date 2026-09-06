import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { DocPage, type DocSection } from '@/components/sections/doc/DocPage';
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
  const t = await getTranslations({ locale, namespace: 'help' });
  return { title: `${t('title')} · LUNARIA`, description: t('lede') };
}

export default async function Aiuto({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('help');
  const legal = await getTranslations('legal');

  return (
    <DocPage
      eyebrow={t('eyebrow')}
      title={t('title')}
      lede={t('lede')}
      sections={t.raw('sections') as DocSection[]}
      tagLabel={legal('tag')}
      backHref="/ordini"
      backLabel={t('findOrder')}
    />
  );
}
