import type { Locale } from '@/lib/i18n/routing';

export type OrderLine = {
  slug: string;
  variantId: string;
  size: string;
  qty: number;
  /** the price at the moment of the order, in cents, so a later price change
   *  can never rewrite what somebody was charged */
  unitCents: number;
};

export type OrderAddress = {
  line1: string;
  line2?: string;
  postcode: string;
  city: string;
  province?: string;
  country: string;
};

export type OrderStatus = 'paid' | 'processing' | 'unpaid' | 'failed';

export type Order = {
  /** what the customer quotes on the phone: LN-XXXXXX */
  number: string;
  paymentIntentId: string;
  status: OrderStatus;
  createdAt: string;
  email: string;
  name: string;
  address: OrderAddress;
  lines: OrderLine[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  vatCents: number;
  locale: Locale;
};

/** 30 days by the shop's own choice; 14 is the legal minimum in the EU. */
export function returnsCloseOn(order: Order, days: number): Date {
  const d = new Date(order.createdAt);
  d.setDate(d.getDate() + days);
  return d;
}

export function returnWindowOpen(order: Order, days: number, now = new Date()): boolean {
  return order.status === 'paid' && now <= returnsCloseOn(order, days);
}
