import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { commerce } from '@/lib/commerce';
import { products } from '@/data/products';
import { collectionById, categoryById } from '@/data/collections';
import { formatCents } from '@/components/primitives/Price';
import { Gallery } from '@/components/sections/pdp/Gallery';
import { BuyBlock } from '@/components/sections/pdp/BuyBlock';
import { GpsrBlock } from '@/components/sections/pdp/GpsrBlock';
import { ProductCard } from '@/components/patterns/ProductCard';
import { ProductJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import { routing, type Locale } from '@/lib/i18n/routing';

type Params = { locale: string; slug: string };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => products.map((p) => ({ locale, slug: p.slug })));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const p = await commerce.getProduct(slug);
  if (!p) return {};
  const l = locale as Locale;
  return {
    title: `${p.name[l]} · LUNARIA`,
    // trimmed to the 140-160 the brief asks for
    description: p.meaning[l].slice(0, 155),
    alternates: { canonical: `/${locale}/prodotto/${slug}` },
    openGraph: { images: [p.image], type: 'website' },
  };
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const l = locale as Locale;

  const p = await commerce.getProduct(slug);
  if (!p) notFound();

  const t = await getTranslations('pdp');
  const collection = collectionById[p.collection];
  const category = categoryById[p.category];
  const images = p.images ?? [p.image];

  const buyable = p.variants.some((v) =>
    v.sizes.some((s) => s.availability.state !== 'out-of-stock')
  );
  const priceLabel = formatCents(p.priceCents, l);
  const discounted = typeof p.compareAtCents === 'number' && p.compareAtCents > p.priceCents;

  const sameCollection = (await commerce.listProducts({
    collection: p.collection, perPage: 5,
  })).items.filter((x) => x.id !== p.id).slice(0, 4);

  const completeTheRite = products
    .filter((x) => x.collection !== p.collection && x.category !== p.category)
    .slice(0, 3);

  const votes = p.fitVotes;
  const votesTotal = votes ? votes.small + votes.true + votes.large : 0;

  return (
    <>
      <ProductJsonLd
        name={p.name[l]}
        description={p.meaning[l]}
        image={p.image}
        sku={p.id.toUpperCase()}
        material={p.composition[l]}
        url={`/${locale}/prodotto/${p.slug}`}
        priceCents={p.priceCents}
        available={buyable}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'LUNARIA', url: `/${locale}` },
          { name: collection.name[l], url: `/${locale}/collezioni/${collection.id}` },
          { name: p.name[l], url: `/${locale}/prodotto/${p.slug}` },
        ]}
      />

      <div className="wrap">
        <nav className="crumbs" aria-label={t('breadcrumb')}>
          <Link href="/collezioni">{t('collections')}</Link>
          <span aria-hidden="true">·</span>
          <Link href={`/collezioni/${collection.id}`}>{collection.name[l]}</Link>
        </nav>

        <div className="pdp">
          {/* gallery sticks on desktop, the detail column scrolls past it */}
          <div className="pdp__media">
            <Gallery images={images} alt={`${p.name[l]}, ${collection.name[l]}`} />
          </div>

          <div className="pdp__detail">
            <p className="eyebrow">
              {collection.name[l]}
              {p.edition && <> · <span className="mono">{p.edition}</span></>}
            </p>
            <h1 className="pdp__name">{p.name[l]}</h1>

            <p className="pdp__price">
              <span className="price">{priceLabel}</span>
              {discounted && (
                <>
                  <span className="price__was">{formatCents(p.compareAtCents!, l)}</span>
                  {typeof p.lowest30Cents === 'number' && (
                    <span className="price__lowest">
                      {t('lowest30')}: {formatCents(p.lowest30Cents, l)}
                    </span>
                  )}
                </>
              )}
              <span className="pdp__vat">{t('vatIncluded')}</span>
            </p>

            <BuyBlock product={p} locale={l} priceLabel={priceLabel} />

            <p className="pdp__delivery mono">{t('delivery')}</p>

            {/* -------------------------------------------------- meaning */}
            {/* The brand's whole differentiation, so it is the most prominent
                block on the page after the price. */}
            <section className="meaning" aria-labelledby="meaning-h">
              <h2 id="meaning-h" className="eyebrow">{t('meaning')}</h2>
              <p className="meaning__body">{p.meaning[l]}</p>
            </section>

            {/* ------------------------------------------------- materials */}
            <section aria-labelledby="mat-h" className="pdp__section">
              <h2 id="mat-h" className="eyebrow">{t('materials')}</h2>
              <dl className="spec">
                <div><dt>{t('composition')}</dt><dd>{p.composition[l]}</dd></div>
                {p.gsm && <div><dt>{t('weight')}</dt><dd className="mono">{p.gsm} g/m²</dd></div>}
                <div><dt>{t('origin')}</dt><dd>{p.origin[l]}</dd></div>
                <div><dt>{t('care')}</dt><dd>{p.care[l]}</dd></div>
              </dl>
              <p className="pdp__note">{t('textileNote')}</p>
            </section>

            {/* ------------------------------------------------------- fit */}
            {(p.fitNote || votes) && (
              <section aria-labelledby="fit-h" className="pdp__section">
                <h2 id="fit-h" className="eyebrow">{t('fit')}</h2>
                {p.fitNote && <p>{p.fitNote[l]}</p>}
                {votes && votesTotal > 0 && (
                  <>
                    <ul className="fitbar" aria-label={t('fitRating')}>
                      {(['small', 'true', 'large'] as const).map((k) => (
                        <li key={k}>
                          <span className="fitbar__label">{t(`fit_${k}`)}</span>
                          <span className="fitbar__track" aria-hidden="true">
                            <span style={{ width: `${Math.round((votes[k] / votesTotal) * 100)}%` }} />
                          </span>
                          <span className="fitbar__pct mono">
                            {Math.round((votes[k] / votesTotal) * 100)}%
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="pdp__note">{t('fitSample', { n: votesTotal })}</p>
                  </>
                )}
              </section>
            )}

            {/* ------------------------------------------------------ GPSR */}
            <GpsrBlock sku={p.id.toUpperCase()} />
          </div>
        </div>

        {/* ------------------------------------------------------ related */}
        {completeTheRite.length > 0 && (
          <section className="pdp__rail" aria-labelledby="rite-h">
            <h2 id="rite-h" style={{ fontSize: 'var(--text-h2)' }}>{t('completeTheRite')}</h2>
            <ul className="grid">
              {completeTheRite.map((x) => (
                <li key={x.id} className="grid__cell">
                  <ProductCard
                    product={x} locale={l}
                    labels={{ soldOut: t('soldOut'), lowStock: t('lowStock'), colours: t('colour') }}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}

        {sameCollection.length > 0 && (
          <section className="pdp__rail" aria-labelledby="same-h">
            <h2 id="same-h" style={{ fontSize: 'var(--text-h2)' }}>
              {t('sameCollection', { name: collection.name[l] })}
            </h2>
            <ul className="grid">
              {sameCollection.map((x) => (
                <li key={x.id} className="grid__cell">
                  <ProductCard
                    product={x} locale={l}
                    labels={{ soldOut: t('soldOut'), lowStock: t('lowStock'), colours: t('colour') }}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="pdp__back">
          <Link href={`/categoria/${category.id}`} className="mono pdp__allcat" style={{ color: 'var(--accent)' }}>
            {t('allIn', { name: category.name[l].toLowerCase() })}
          </Link>
        </p>
      </div>
    </>
  );
}
