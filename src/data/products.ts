import type { Product, Availability } from '@/types/product';
import raw from './products.json';

/**
 * Twenty-four garments. Real names, real prices, real fibre compositions, and a
 * meaning written like a museum label for every one of them.
 *
 * The data moved out of this file and into products.json so the editing panel
 * at /studio can rewrite it safely. Nothing about the shape changed: this file
 * still owns the types and the guarantees.
 *
 * The images are placeholders shared per collection. Swap path: drop the four
 * shots per product into /public/images/products/<slug>-{flat,model,detail,ritual}.jpg
 * and change `image` to the flat one. Aspect ratio 4:5, nothing else changes.
 */

const STATES = new Set(['in-stock', 'low-stock', 'out-of-stock', 'pre-order']);

/* JSON carries no types, and this file is written by a tool. A cast alone would
   let a bad availability state through to the browser, where it becomes a blank
   size button nobody can explain. So the shape is checked once, on load. */
function check(list: unknown): Product[] {
  if (!Array.isArray(list)) throw new Error('products.json: non e un elenco');
  list.forEach((p, i) => {
    const where = `products.json[${i}]`;
    if (typeof p?.slug !== 'string' || !p.slug) throw new Error(`${where}: manca lo slug`);
    if (!Number.isInteger(p.priceCents) || p.priceCents <= 0) {
      throw new Error(`${where} (${p.slug}): priceCents deve essere un intero positivo in centesimi`);
    }
    if (p.compareAtCents != null && p.lowest30Cents == null) {
      throw new Error(`${where} (${p.slug}): c'e uno sconto senza il prezzo piu basso dei 30 giorni`);
    }
    if (!Array.isArray(p.variants) || p.variants.length === 0) {
      throw new Error(`${where} (${p.slug}): nessuna variante`);
    }
    for (const v of p.variants) {
      for (const s of v.sizes ?? []) {
        const state = (s.availability as Availability | undefined)?.state;
        if (!state || !STATES.has(state)) {
          throw new Error(`${where} (${p.slug}), taglia ${s.size}: stato "${state}" non valido`);
        }
      }
    }
  });
  return list as Product[];
}

export const products: Product[] = check(raw);

export const productBySlug = Object.fromEntries(products.map((p) => [p.slug, p]));
