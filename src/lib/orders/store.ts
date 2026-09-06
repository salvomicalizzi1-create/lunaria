import Stripe from 'stripe';
import { randomInt } from 'node:crypto';
import type { Order, OrderAddress, OrderLine, OrderStatus } from './types';
import type { Locale } from '@/lib/i18n/routing';

/**
 * Orders live in Stripe, not in a database of ours.
 *
 * This shop has no server-side storage, and inventing one would mean either a
 * file that vanishes on the next deployment or a table nobody maintains. The
 * payment already exists as a durable, queryable record with the amount, the
 * time and the status on it, so the order is written into that record's metadata
 * and read back from there. There is exactly one source of truth for what
 * somebody bought and what they paid, and it is the same object the bank sees.
 *
 * The limits this has to live inside: fifty metadata keys, five hundred
 * characters per value. Long fields are chunked; nothing else needs it.
 */

const CHUNK = 480;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !key.startsWith('sk_test_')) return null;
  return new Stripe(key);
}

/** LN-XXXXXX, from the crypto generator: an order number a stranger can guess is
 *  half of an order somebody else can read. */
export function newOrderNumber(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // no I, O, 0 or 1 to read aloud
  let out = '';
  for (let i = 0; i < 6; i++) out += alphabet[randomInt(alphabet.length)];
  return `LN-${out}`;
}

function packLong(prefix: string, value: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0, n = 0; i < value.length && n < 6; i += CHUNK, n++) {
    out[`${prefix}${n}`] = value.slice(i, i + CHUNK);
  }
  return out;
}

function unpackLong(meta: Stripe.Metadata, prefix: string): string {
  let out = '';
  for (let n = 0; n < 6; n++) {
    const part = meta[`${prefix}${n}`];
    if (typeof part !== 'string') break;
    out += part;
  }
  return out;
}

const encodeLines = (lines: OrderLine[]) =>
  lines.map((l) => [l.slug, l.variantId, l.size, l.qty, l.unitCents].join('|')).join(';');

function decodeLines(s: string): OrderLine[] {
  if (!s) return [];
  return s.split(';').filter(Boolean).map((row) => {
    const [slug, variantId, size, qty, unitCents] = row.split('|');
    return {
      slug, variantId, size,
      qty: Number(qty) || 1,
      unitCents: Number(unitCents) || 0,
    };
  });
}

export type OrderDraft = {
  number: string;
  email: string;
  name: string;
  address: OrderAddress;
  lines: OrderLine[];
  subtotalCents: number;
  shippingCents: number;
  vatCents: number;
  locale: Locale;
};

/** Everything the order needs, flattened into what Stripe will hold. */
export function toMetadata(d: OrderDraft): Stripe.MetadataParam {
  return {
    brand: 'LUNARIA (fictional brand, test mode)',
    order: d.number,
    email: d.email.slice(0, 200),
    name: d.name.slice(0, 200),
    ...packLong('addr', JSON.stringify(d.address)),
    ...packLong('lines', encodeLines(d.lines)),
    subtotal_cents: String(d.subtotalCents),
    shipping_cents: String(d.shippingCents),
    vat_cents: String(d.vatCents),
    country: d.address.country,
    locale: d.locale,
  };
}

const STATUS: Record<string, OrderStatus> = {
  succeeded: 'paid',
  processing: 'processing',
  requires_payment_method: 'unpaid',
  requires_confirmation: 'unpaid',
  requires_action: 'unpaid',
  requires_capture: 'processing',
  canceled: 'failed',
};

export function fromPaymentIntent(pi: Stripe.PaymentIntent): Order | null {
  const m = pi.metadata ?? {};
  if (!m.order) return null;                      // not one of ours

  let address: OrderAddress;
  try {
    address = JSON.parse(unpackLong(m, 'addr')) as OrderAddress;
  } catch {
    address = { line1: '', postcode: '', city: '', country: m.country ?? 'IT' };
  }

  const subtotalCents = Number(m.subtotal_cents) || 0;
  const shippingCents = Number(m.shipping_cents) || 0;

  return {
    number: m.order,
    paymentIntentId: pi.id,
    status: STATUS[pi.status] ?? 'unpaid',
    createdAt: new Date(pi.created * 1000).toISOString(),
    email: m.email ?? '',
    name: m.name ?? '',
    address,
    lines: decodeLines(unpackLong(m, 'lines')),
    subtotalCents,
    shippingCents,
    // the amount is the payment's own, never a number we recomputed later
    totalCents: pi.amount,
    vatCents: Number(m.vat_cents) || 0,
    locale: m.locale === 'en' ? 'en' : 'it',
  };
}

/** Straight retrieval by id: no search index, so this is correct the instant
 *  the payment is confirmed. It is what the thank-you page uses. */
export async function orderByPaymentIntent(id: string): Promise<Order | null> {
  const stripe = getStripe();
  if (!stripe || !/^pi_[A-Za-z0-9_]+$/.test(id)) return null;
  try {
    const pi = await stripe.paymentIntents.retrieve(id);
    return fromPaymentIntent(pi);
  } catch {
    return null;
  }
}

/**
 * Lookup by order number AND email, both required.
 *
 * Stripe's search index lags a payment by up to a minute, so an order looked up
 * seconds after it is placed can legitimately come back missing. The caller says
 * so in plain words rather than claiming the order does not exist.
 */
export async function findOrder(number: string, email: string): Promise<Order | 'not_found' | 'unavailable'> {
  const stripe = getStripe();
  if (!stripe) return 'unavailable';

  const clean = number.trim().toUpperCase();
  if (!/^LN-[A-Z2-9]{6}$/.test(clean)) return 'not_found';

  try {
    const res = await stripe.paymentIntents.search({
      query: `metadata['order']:'${clean}'`,
      limit: 5,
    });
    for (const pi of res.data) {
      const order = fromPaymentIntent(pi);
      // the number alone is not enough: the address it was sent to has to match
      if (order && order.email.toLowerCase() === email.trim().toLowerCase()) return order;
    }
    return 'not_found';
  } catch {
    return 'unavailable';
  }
}
