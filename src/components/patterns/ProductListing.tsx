import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { commerce } from '@/lib/commerce';
import { parseQuery, pageHref, hasFilters, type RawParams } from '@/lib/commerce/query';
import { ProductCard } from './ProductCard';
import { FilterBar } from './FilterBar';
import { collections } from '@/data/collections';
import type { CategoryId, CollectionId } from '@/types/product';
import type { Locale } from '@/lib/i18n/routing';

export async function ProductListing({
  base,
  params,
  fixed,
  locale,
  title,
  intro,
}: {
  base: string;
  params: RawParams;
  fixed: { collection?: CollectionId; category?: CategoryId };
  locale: Locale;
  title: string;
  intro?: string;
}) {
  const t = await getTranslations('plp');
  const query = parseQuery(params, fixed);
  const [page, facets] = await Promise.all([
    commerce.listProducts(query),
    commerce.getFacets(query),
  ]);

  const labels = {
    soldOut: t('soldOut'),
    lowStock: t('lowStock'),
    colours: t('colour'),
  };

  return (
    <div className="wrap" style={{ paddingBlock: 'var(--spacing-8)' }}>
      <header style={{ marginBottom: 'var(--spacing-6)' }}>
        <h1 style={{ fontSize: 'var(--text-h1)' }}>{title}</h1>
        {intro && <p className="lede" style={{ marginTop: 'var(--spacing-3)' }}>{intro}</p>}
      </header>

      <FilterBar
        base={base}
        params={params}
        facets={facets}
        query={query}
        total={page.total}
        locale={locale}
      />

      {page.items.length === 0 ? (
        /* branded empty state with three ways out, never a dead end */
        <div className="empty">
          <h2 style={{ fontSize: 'var(--text-h2)' }}>{t('emptyTitle')}</h2>
          <p className="lede">{t('emptyBody')}</p>
          <ul className="empty__links">
            {collections.slice(0, 3).map((c) => (
              <li key={c.id}>
                <Link className="btn btn--ghost" href={`/collezioni/${c.id}`}>
                  {c.name[locale]}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          <ul className="grid">
            {page.items.map((p, i) => (
              <li key={p.id} className="grid__cell">
                <ProductCard
                  product={p}
                  locale={locale}
                  labels={labels}
                  priority={i < 2}
                />
              </li>
            ))}
          </ul>

          {page.pages > 1 && (
            <nav className="pager" aria-label={t('pagination')}>
              <p className="mono">{t('shown', { shown: page.items.length, total: page.total })}</p>
              <div className="pager__links">
                {page.page > 1 && (
                  <Link className="btn btn--ghost" href={pageHref(base, params, page.page - 1)} rel="prev">
                    {t('prev')}
                  </Link>
                )}
                {page.page < page.pages && (
                  /* a real link, not infinite scroll: the back button keeps
                     working and a crawler can follow it */
                  <Link className="btn btn--ghost" href={pageHref(base, params, page.page + 1)} rel="next">
                    {t('loadMore')}
                  </Link>
                )}
              </div>
            </nav>
          )}
        </>
      )}

      {hasFilters(query) && (
        <p style={{ marginTop: 'var(--spacing-5)' }}>
          <Link className="mono" href={base} style={{ color: 'var(--accent)' }}>
            {t('clearFilters')}
          </Link>
        </p>
      )}
    </div>
  );
}

export default ProductListing;
