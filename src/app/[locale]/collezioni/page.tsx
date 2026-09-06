import type { Metadata } from 'next';
import Image from 'next/image';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { commerce } from '@/lib/commerce';
import { routing, type Locale } from '@/lib/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'collectionsIndex' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: { canonical: `/${locale}/collezioni` },
  };
}

export default async function CollectionsIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const l = locale as Locale;
  const t = await getTranslations('collectionsIndex');
  const collections = await commerce.listCollections();

  return (
    <div className="wrap" style={{ paddingBlock: 'var(--spacing-8)' }}>
      <header style={{ marginBottom: 'var(--spacing-7)' }}>
        <p className="eyebrow">{t('eyebrow')}</p>
        <h1 style={{ fontSize: 'var(--text-h1)', marginBlock: 'var(--spacing-3)' }}>
          {t('heading')}
        </h1>
        <p className="lede">{t('lede')}</p>
      </header>

      {/* a catalogue, not a list: image and text swap sides down the page, so no
          two neighbouring rows share a skeleton */}
      <div className="collrows">
        {collections.map((c) => (
          <article className="collrow" key={c.id} style={{ ['--acc' as string]: c.accent }}>
            <Link href={`/collezioni/${c.id}`} className="collrow__fig">
              <Image
                src={c.image}
                alt={`${c.name[l]}, ${c.family[l]}`}
                width={1000}
                height={1250}
                sizes="(min-width: 768px) 45vw, 100vw"
                className="collrow__img"
              />
            </Link>
            <div className="collrow__body">
              <h2 className="collrow__name">{c.name[l]}</h2>
              <span className="mono collrow__tag">{c.tag}</span>
              <p className="collrow__meaning">{c.meaning[l]}</p>
              <p className="eyebrow">{c.family[l]}</p>
              <Link className="btn btn--ghost" href={`/collezioni/${c.id}`}>
                {t('see', { name: c.name[l] })}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
