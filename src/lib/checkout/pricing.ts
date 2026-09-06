import { productBySlug } from '@/data/products';
import { tokens } from '@/design/tokens';

/**
 * The price is decided HERE, on the server, from the catalogue.
 *
 * The browser sends what the visitor picked, never what it costs. Trusting a
 * price that arrived from a browser is how a shop sells a jacket for one cent.
 */

export type CartInput = { slug: string; variantId: string; size: string; qty: number }[];

export type PricedLine = {
  slug: string; variantId: string; size: string; qty: number;
  name: string; unitCents: number; lineCents: number;
};

export type Totals = {
  lines: PricedLine[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  vatCents: number;
  freeShipping: boolean;
};

/** Shipping by country. Flat and stated up front, never revealed at the end. */
const SHIPPING: Record<string, number> = {
  IT: 590,
  DEFAULT_EU: 990,
  DEFAULT_WORLD: 1990,
};

const EU = new Set([
  'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT',
  'LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE',
]);

export function shippingFor(country: string, subtotalCents: number): number {
  if (subtotalCents >= tokens.commerce.freeShippingThreshold) return 0;
  if (country === 'IT') return SHIPPING.IT;
  return EU.has(country) ? SHIPPING.DEFAULT_EU : SHIPPING.DEFAULT_WORLD;
}

export function priceCart(input: CartInput, country = 'IT', locale: 'it' | 'en' = 'it'): Totals {
  const lines: PricedLine[] = [];

  for (const item of input) {
    const p = productBySlug[item.slug];
    if (!p) continue;                                   // a slug that does not exist buys nothing
    const variant = p.variants.find((v) => v.id === item.variantId);
    if (!variant) continue;
    const size = variant.sizes.find((s) => s.size === item.size);
    if (!size || size.availability.state === 'out-of-stock') continue;

    // never more than the shop actually has
    const cap = size.availability.state === 'low-stock' ? size.availability.left : 10;
    const qty = Math.max(1, Math.min(cap, Math.floor(item.qty) || 1));

    lines.push({
      slug: p.slug, variantId: variant.id, size: item.size, qty,
      name: p.name[locale],
      unitCents: p.priceCents,
      lineCents: p.priceCents * qty,
    });
  }

  const subtotalCents = lines.reduce((n, l) => n + l.lineCents, 0);
  const shippingCents = shippingFor(country, subtotalCents);
  const totalCents = subtotalCents + shippingCents;
  // prices are shown VAT included, so this is the amount inside the total
  const vatCents = Math.round(totalCents - totalCents / (1 + tokens.commerce.vatRate));

  return {
    lines, subtotalCents, shippingCents, totalCents, vatCents,
    freeShipping: shippingCents === 0 && subtotalCents > 0,
  };
}
