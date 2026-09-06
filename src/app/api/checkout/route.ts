import { NextResponse } from 'next/server';
import { priceCart, type CartInput } from '@/lib/checkout/pricing';
import { getStripe, newOrderNumber, toMetadata } from '@/lib/orders/store';
import type { OrderAddress } from '@/lib/orders/types';

/**
 * Creates the payment intent, and with it the order.
 *
 * Three rules this route exists to enforce:
 *  1. the amount is computed here from the catalogue, never taken from the body
 *  2. the secret key never leaves the server, and no card detail ever reaches it
 *     (the card goes straight from the browser to Stripe)
 *  3. the order is written onto the payment itself, so what the shop shows the
 *     customer afterwards and what the bank has are the same record
 */

const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function POST(req: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return NextResponse.json({ error: 'stripe_not_configured' }, { status: 503 });
  }
  if (!key.startsWith('sk_test_')) {
    // a hard stop, not a warning: this build is a demonstration and must never
    // be able to take real money by accident
    return NextResponse.json({ error: 'live_key_refused' }, { status: 400 });
  }

  let body: {
    cart?: CartInput;
    country?: string;
    email?: string;
    name?: string;
    address?: Partial<OrderAddress>;
    locale?: 'it' | 'en';
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_json' }, { status: 400 });
  }

  const cart = Array.isArray(body.cart) ? body.cart : [];
  if (cart.length === 0) return NextResponse.json({ error: 'empty_cart' }, { status: 400 });

  const country = typeof body.country === 'string' ? body.country.toUpperCase().slice(0, 2) : 'IT';
  const locale = body.locale === 'en' ? 'en' : 'it';
  const totals = priceCart(cart, country, locale);
  if (totals.totalCents <= 0) return NextResponse.json({ error: 'empty_cart' }, { status: 400 });

  const email = str(body.email);
  const address: OrderAddress = {
    line1: str(body.address?.line1, 120),
    line2: str(body.address?.line2, 120) || undefined,
    postcode: str(body.address?.postcode, 16),
    city: str(body.address?.city, 80),
    province: str(body.address?.province, 60) || undefined,
    country,
  };

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: 'stripe_not_configured' }, { status: 503 });

  const number = newOrderNumber();

  try {
    const intent = await stripe.paymentIntents.create({
      amount: totals.totalCents,
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
      description: `LUNARIA ${number}`,
      // the receipt goes to the address the visitor typed, and nowhere else
      receipt_email: email.includes('@') ? email : undefined,
      shipping: address.line1
        ? {
            name: str(body.name) || email || number,
            address: {
              line1: address.line1,
              line2: address.line2,
              postal_code: address.postcode,
              city: address.city,
              state: address.province,
              country,
            },
          }
        : undefined,
      metadata: toMetadata({
        number,
        email,
        name: str(body.name),
        address,
        lines: totals.lines.map((l) => ({
          slug: l.slug, variantId: l.variantId, size: l.size, qty: l.qty, unitCents: l.unitCents,
        })),
        subtotalCents: totals.subtotalCents,
        shippingCents: totals.shippingCents,
        vatCents: totals.vatCents,
        locale,
      }),
    });

    return NextResponse.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      order: number,
      totals: {
        subtotalCents: totals.subtotalCents,
        shippingCents: totals.shippingCents,
        totalCents: totals.totalCents,
        vatCents: totals.vatCents,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'stripe_error';
    return NextResponse.json({ error: 'stripe_error', message }, { status: 502 });
  }
}
