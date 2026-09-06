import { getTranslations } from 'next-intl/server';
import { axes, deck, pickProducts, readingCount, type Tag } from '@/data/oracle';
import { categoryById } from '@/data/collections';
import { formatCents } from '@/components/primitives/Price';
import { OracleDeck, type FlatAxis, type FlatPlate, type Pick } from './OracleDeck';
import type { Locale } from '@/lib/i18n/routing';

/**
 * The Oracle, split in two on purpose.
 *
 * This half runs on the server and does the only expensive thing: work out, for
 * all twenty-seven possible draws, which three garments they land on. The
 * interactive half then needs the answers and nothing else — importing the
 * catalogue into the browser to score it there would ship every product's
 * museum label to every visitor for three lines of output.
 */
export async function Oracle({ locale }: { locale: Locale }) {
  const t = await getTranslations('oracle');

  const flatAxes: FlatAxis[] = axes.map((a) => ({
    id: a.id,
    label: a.label[locale],
    title: a.title[locale],
  }));

  const flatDeck: FlatPlate[][] = axes.map((a) =>
    deck[a.id].map((p) => ({
      image: `/images/oracolo/${p.image}.jpg`,
      key: p.key[locale],
      value: p.value[locale],
      reading: p.reading[locale],
      alt: p.alt[locale],
    })),
  );

  /* every draw, resolved once at build time */
  const readings: Record<string, Pick[]> = {};
  deck.intenzione.forEach((i, ii) => {
    deck.materia.forEach((m, mi) => {
      deck.stagione.forEach((s, si) => {
        const tags: Tag[] = [i.tag, m.tag, s.tag];
        readings[`${ii}-${mi}-${si}`] = pickProducts(tags).map((p) => ({
          slug: p.slug,
          name: p.name[locale],
          note: [categoryById[p.category].name[locale], p.gsm ? `${p.gsm} g` : null]
            .filter(Boolean)
            .join(', '),
          price: formatCents(p.priceCents, locale),
        }));
      });
    });
  });

  return (
    <section className="sec" id="oracolo" aria-labelledby="oraT">
      <div className="wrap">
        <div className="sechead rise" style={{ textAlign: 'center', alignItems: 'center' }}>
          <p className="eyebrow">{t('eyebrow')}</p>
          <h2 id="oraT">{t('heading')}</h2>
          <p className="lede" style={{ textAlign: 'center' }}>{t('lede')}</p>
        </div>

        <OracleDeck
          axes={flatAxes}
          deck={flatDeck}
          readings={readings}
          labels={{
            hold: t('hold'),
            shuffle: t('shuffle'),
            shuffled: t('shuffled'),
            count: t('count', { n: readingCount }),
            yourReading: t('yourReading'),
            see: t('see'),
          }}
        />

        <p className="disclaim">{t('disclaimer')}</p>
      </div>
    </section>
  );
}

export default Oracle;
