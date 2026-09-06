import { products, productBySlug } from '@/data/products';
import { collections, categories, collectionById, categoryById } from '@/data/collections';
import type { Product } from '@/types/product';
import type { CommerceAdapter, Facets, ProductPage, ProductQuery } from '../types';

const isBuyable = (p: Product) =>
  p.variants.some((v) =>
    v.sizes.some((s) => s.availability.state !== 'out-of-stock')
  );

const sizesOf = (p: Product) =>
  [...new Set(p.variants.flatMap((v) => v.sizes.map((s) => s.size)))];

const coloursOf = (p: Product) => p.variants.map((v) => v.id);

/** every filter except the one named, so a facet can show what clicking it gives */
function matches(p: Product, q: ProductQuery, skip?: keyof ProductQuery) {
  if (skip !== 'collection' && q.collection && p.collection !== q.collection) return false;
  if (skip !== 'category' && q.category && p.category !== q.category) return false;
  if (skip !== 'size' && q.size?.length) {
    const has = sizesOf(p).map((s) => s.toLowerCase());
    if (!q.size.some((s) => has.includes(s.toLowerCase()))) return false;
  }
  if (skip !== 'colour' && q.colour?.length) {
    if (!q.colour.some((c) => coloursOf(p).includes(c))) return false;
  }
  if (skip !== 'priceMin' && typeof q.priceMin === 'number' && p.priceCents < q.priceMin) return false;
  if (skip !== 'priceMax' && typeof q.priceMax === 'number' && p.priceCents > q.priceMax) return false;
  if (skip !== 'available' && q.available && !isBuyable(p)) return false;
  return true;
}

function sortItems(items: Product[], sort: ProductQuery['sort']) {
  const out = [...items];
  switch (sort) {
    case 'prezzo-su': return out.sort((a, b) => a.priceCents - b.priceCents);
    case 'prezzo-giu': return out.sort((a, b) => b.priceCents - a.priceCents);
    case 'venduti': return out.sort((a, b) => Number(b.bestseller ?? 0) - Number(a.bestseller ?? 0));
    case 'novita':
    default: return out.sort((a, b) => b.releasedOn.localeCompare(a.releasedOn));
  }
}

export const localAdapter: CommerceAdapter = {
  async listProducts(q) {
    const filtered = products.filter((p) => matches(p, q));
    const sorted = sortItems(filtered, q.sort);
    const perPage = q.perPage ?? 12;
    const page = Math.max(1, q.page ?? 1);
    const start = (page - 1) * perPage;
    const result: ProductPage = {
      items: sorted.slice(start, start + perPage),
      total: sorted.length,
      page,
      perPage,
      pages: Math.max(1, Math.ceil(sorted.length / perPage)),
    };
    return result;
  },

  async getFacets(q) {
    const count = <T extends string>(
      key: keyof ProductQuery,
      pick: (p: Product) => T[]
    ) => {
      const map = new Map<T, number>();
      for (const p of products) {
        if (!matches(p, q, key)) continue;
        for (const v of new Set(pick(p))) map.set(v, (map.get(v) ?? 0) + 1);
      }
      return map;
    };

    const sizeMap = count('size', (p) => sizesOf(p));
    const colourMap = count('colour', (p) => coloursOf(p));
    const collMap = count('collection', (p) => [p.collection]);
    const catMap = count('category', (p) => [p.category]);

    const colourMeta = new Map<string, { label: Record<string, string>; hex: string }>();
    for (const p of products) {
      for (const v of p.variants) {
        if (!colourMeta.has(v.id)) colourMeta.set(v.id, { label: v.colour, hex: v.hex });
      }
    }

    const inScope = products.filter((p) => matches(p, q));
    const prices = (inScope.length ? inScope : products).map((p) => p.priceCents);

    const facets: Facets = {
      sizes: [...sizeMap].map(([value, c]) => ({ value, count: c })),
      colours: [...colourMap].map(([value, c]) => ({
        value,
        label: colourMeta.get(value)?.label ?? { it: value, en: value },
        hex: colourMeta.get(value)?.hex ?? '#888',
        count: c,
      })),
      collections: [...collMap].map(([value, c]) => ({ value, count: c })),
      categories: [...catMap].map(([value, c]) => ({ value, count: c })),
      priceRange: { min: Math.min(...prices), max: Math.max(...prices) },
    };
    return facets;
  },

  async getProduct(slug) { return productBySlug[slug] ?? null },
  async listCollections() { return collections },
  async getCollection(id) { return collectionById[id] ?? null },
  async listCategories() { return categories },
  async getCategory(id) { return categoryById[id] ?? null },
};
