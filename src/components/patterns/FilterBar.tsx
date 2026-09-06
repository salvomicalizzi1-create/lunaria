import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { toggleHref, setHref, type RawParams } from '@/lib/commerce/query';
import type { Facets, ProductQuery, SortKey } from '@/lib/commerce/types';
import type { Locale } from '@/lib/i18n/routing';

const SORTS: SortKey[] = ['novita', 'prezzo-su', 'prezzo-giu', 'venduti'];

/**
 * Every filter is a real link. Results are therefore shareable, bookmarkable,
 * crawlable, and they work with JavaScript switched off. No client component,
 * no state to lose.
 */
export async function FilterBar({
  base,
  params,
  facets,
  query,
  total,
  locale,
}: {
  base: string;
  params: RawParams;
  facets: Facets;
  query: ProductQuery;
  total: number;
  locale: Locale;
}) {
  const t = await getTranslations('plp');
  const active = (list: string[] | undefined, v: string) => Boolean(list?.includes(v));

  return (
    <div className="filters">
      <div className="filters__row">
        <span className="eyebrow">{t('size')}</span>
        <ul className="chips">
          {facets.sizes.map((s) => (
            <li key={s.value}>
              <Link
                href={toggleHref(base, params, 'taglia', s.value)}
                className="chip"
                aria-pressed={active(query.size, s.value)}
                data-on={active(query.size, s.value) ? 'true' : undefined}
              >
                {s.value} <span className="chip__n">{s.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="filters__row">
        <span className="eyebrow">{t('colour')}</span>
        <ul className="chips">
          {facets.colours.map((c) => (
            <li key={c.value}>
              <Link
                href={toggleHref(base, params, 'colore', c.value)}
                className="chip"
                aria-pressed={active(query.colour, c.value)}
                data-on={active(query.colour, c.value) ? 'true' : undefined}
              >
                <span className="chip__dot" style={{ background: c.hex }} aria-hidden="true" />
                {c.label[locale]} <span className="chip__n">{c.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="filters__row">
        <span className="eyebrow">{t('availability')}</span>
        <ul className="chips">
          <li>
            <Link
              href={setHref(base, params, 'disponibili', query.available ? undefined : '1')}
              className="chip"
              aria-pressed={Boolean(query.available)}
              data-on={query.available ? 'true' : undefined}
            >
              {t('onlyAvailable')}
            </Link>
          </li>
        </ul>
      </div>

      <div className="filters__row">
        <span className="eyebrow">{t('sort')}</span>
        <ul className="chips">
          {SORTS.map((s) => (
            <li key={s}>
              <Link
                href={setHref(base, params, 'sort', s === 'novita' ? undefined : s)}
                className="chip"
                aria-pressed={query.sort === s}
                data-on={query.sort === s ? 'true' : undefined}
              >
                {t(`sort_${s}` as 'sort_novita')}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* the count is announced, so a screen reader hears the result of a filter */}
      <p className="filters__count mono" role="status">
        {t('count', { n: total })}
      </p>
    </div>
  );
}

export default FilterBar;
