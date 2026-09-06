/**
 * Structured data, and what is deliberately missing from it.
 *
 * LUNARIA is a fictional brand. Telling a search engine that a garment has a
 * price, is in stock, and carries an average rating from real buyers would be a
 * false statement made to a machine that repeats it to people. So this file
 * emits Product without `offers`, and no `aggregateRating` or `review` at all.
 *
 * BreadcrumbList is different: it describes the site's own navigation, which is
 * true today. It ships.
 *
 * When there is a real company behind the brand, set SELLS_FOR_REAL to true and
 * the offer block turns on. Nothing else changes.
 */
const SELLS_FOR_REAL = false;

type ProductLd = {
  name: string;
  description: string;
  image: string;
  sku: string;
  material: string;
  url: string;
  priceCents: number;
  available: boolean;
};

export function ProductJsonLd(p: ProductLd) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description,
    image: p.image,
    sku: p.sku,
    material: p.material,
    url: p.url,
    brand: { '@type': 'Brand', name: 'LUNARIA' },
  };

  if (SELLS_FOR_REAL) {
    data.offers = {
      '@type': 'Offer',
      price: (p.priceCents / 100).toFixed(2),
      priceCurrency: 'EUR',
      availability: p.available
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: p.url,
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
