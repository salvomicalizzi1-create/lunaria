import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { collections } from '@/data/collections';
import { products } from '@/data/products';
import { formatCents } from '@/components/primitives/Price';
import { Sigil } from './Sigil';
import type { CSSProperties } from 'react';
import type { Locale } from '@/lib/i18n/routing';

/**
 * The five collections, staggered rather than gridded: image and text swap sides
 * down the page so no two neighbouring rows share a skeleton.
 *
 * The price range under each one is read off the catalogue, never typed. On the
 * standalone page these were five captions with hand-written ranges that could
 * drift from the truth the moment a price changed; here each row is a link into
 * the real listing and the range is whatever the garments actually cost.
 */
export async function CollectionsRows({ locale }: { locale: Locale }) {
  const t = await getTranslations('collectionsHome');

  return (
    <section className="sec" id="collezioni" aria-labelledby="collT">
      <div className="wrap">
        <div className="sechead rise">
          <p className="eyebrow">{t('eyebrow')}</p>
          <h2 id="collT">{t('heading')}</h2>
          <p className="lede">{t('lede')}</p>
        </div>

        <div className="coll">
          {collections.map((c, i) => {
            const inCollection = products.filter((p) => p.collection === c.id);
            const prices = inCollection.map((p) => p.priceCents);
            const low = Math.min(...prices);
            const high = Math.max(...prices);
            const range =
              low === high
                ? formatCents(low, locale)
                : `${formatCents(low, locale)} – ${formatCents(high, locale)}`;

            return (
              <article className="coll__row rise" key={c.id} style={{ '--acc': c.accent } as CSSProperties}>
                <figure className="coll__fig wipe">
                  <Image
                    src={c.image}
                    alt={c.alt[locale]}
                    width={1000}
                    height={1250}
                    sizes="(min-width: 768px) 45vw, 100vw"
                    priority={i === 0}
                  />
                </figure>

                <div className="coll__body">
                  <div className="coll__head">
                    <Sigil id={c.id} />
                    <div className="coll__t">
                      <h3>
                        {/* the heading carries the link, so the accessible name of
                            the target is the collection's own name */}
                        <Link href={`/collezioni/${c.id}`}>{c.name[locale]}</Link>
                      </h3>
                      <span className="en">{c.tag}</span>
                    </div>
                  </div>

                  <p className="coll__m">{c.meaning[locale]}</p>

                  <div className="coll__meta">
                    <span className="eyebrow">
                      {t('count', { n: inCollection.length })} · {c.family[locale]}
                    </span>
                    <span className="coll__price">{range}</span>
                  </div>

                  <Link className="btn btn--ghost" href={`/collezioni/${c.id}`}>
                    {t('see', { name: c.name[locale] })}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default CollectionsRows;
