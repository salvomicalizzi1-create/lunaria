import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { products } from '@/data/products';
import { formatCents } from '@/components/primitives/Price';
import type { Locale } from '@/lib/i18n/routing';

/** The garment this section is about. One slug, and everything else is read. */
const FEATURED = 'arcani-xvii-la-stella';

/**
 * The museum label. This is the brand's whole differentiation in one block: the
 * symbol, and a written account of where it comes from.
 *
 * Every word of it now comes from the catalogue rather than from copy typed into
 * a homepage. On the standalone page this label and the product page could drift
 * apart; here they cannot, because there is only one of them.
 */
export async function Meaning({ locale }: { locale: Locale }) {
  const t = await getTranslations('meaning');
  const p = products.find((x) => x.slug === FEATURED);
  if (!p) return null;

  return (
    <section className="sec" id="significato" aria-labelledby="signT">
      <div className="wrap">
        <div className="meaning">
          <figure className="figure wipe">
            <Image
              src={p.image}
              alt={t('imageAlt')}
              width={1536}
              height={1920}
              sizes="(min-width: 1024px) 55vw, 100vw"
            />
          </figure>

          <div className="label rise">
            <p className="eyebrow">
              ARCANI · {p.edition} · {t('edition', { n: 300 })}
            </p>
            <h2 id="signT">
              <Link href={`/prodotto/${p.slug}`}>{p.name[locale]}</Link>
            </h2>
            <p className="label__price">{formatCents(p.priceCents, locale)}</p>
            <p className="label__body">{p.meaning[locale]}</p>
            <p className="label__spec">{t('print')}</p>
            <Link className="btn btn--primary" href={`/prodotto/${p.slug}`}>
              {t('cta')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Meaning;
