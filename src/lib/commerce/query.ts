import type { ProductQuery, SortKey } from './types';
import type { CategoryId, CollectionId } from '@/types/product';

export type RawParams = Record<string, string | string[] | undefined>;

const list = (v: string | string[] | undefined) =>
  v === undefined ? undefined : (Array.isArray(v) ? v : v.split(',')).filter(Boolean);

const SORTS: SortKey[] = ['novita', 'prezzo-su', 'prezzo-giu', 'venduti'];

/** Read the address bar into a query. Anything unrecognised is ignored rather
 *  than throwing: a hand-edited URL must never break the page. */
export function parseQuery(
  params: RawParams,
  fixed: { collection?: CollectionId; category?: CategoryId } = {}
): ProductQuery {
  const sort = typeof params.sort === 'string' && (SORTS as string[]).includes(params.sort)
    ? (params.sort as SortKey)
    : 'novita';

  const page = Number(params.page);
  const priceMax = Number(params.prezzo_max);

  return {
    ...fixed,
    size: list(params.taglia),
    colour: list(params.colore),
    priceMax: Number.isFinite(priceMax) && priceMax > 0 ? priceMax : undefined,
    available: params.disponibili === '1' ? true : undefined,
    sort,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    perPage: 12,
  };
}

/**
 * Build the address for a filter, keeping everything else. Toggling a value off
 * removes it entirely instead of leaving an empty parameter behind, so the URL
 * stays clean enough to share.
 */
export function toggleHref(
  base: string,
  params: RawParams,
  key: 'taglia' | 'colore',
  value: string
): string {
  const current = list(params[key]) ?? [];
  const next = current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value];

  const out = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (k === key || k === 'page') continue;
    if (typeof v === 'string' && v) out.set(k, v);
    else if (Array.isArray(v) && v.length) out.set(k, v.join(','));
  }
  if (next.length) out.set(key, next.join(','));
  const qs = out.toString();
  return qs ? `${base}?${qs}` : base;
}

export function setHref(base: string, params: RawParams, key: string, value?: string): string {
  const out = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (k === key || k === 'page') continue;
    if (typeof v === 'string' && v) out.set(k, v);
    else if (Array.isArray(v) && v.length) out.set(k, v.join(','));
  }
  if (value) out.set(key, value);
  const qs = out.toString();
  return qs ? `${base}?${qs}` : base;
}

/** the next page, for the real rel=next link crawlers follow */
export function pageHref(base: string, params: RawParams, page: number): string {
  const out = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (k === 'page') continue;
    if (typeof v === 'string' && v) out.set(k, v);
    else if (Array.isArray(v) && v.length) out.set(k, v.join(','));
  }
  if (page > 1) out.set('page', String(page));
  const qs = out.toString();
  return qs ? `${base}?${qs}` : base;
}

export const hasFilters = (q: ProductQuery) =>
  Boolean(q.size?.length || q.colour?.length || q.priceMax || q.available);
