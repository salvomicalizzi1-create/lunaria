'use server';

import { headers } from 'next/headers';
import { findOrder } from '@/lib/orders/store';
import { isEmail, isOrderNumber } from '@/lib/validation';
import type { Order } from '@/lib/orders/types';

export type LookupState =
  | { kind: 'idle' }
  | { kind: 'invalid'; field: 'number' | 'email' }
  | { kind: 'not_found' }
  | { kind: 'unavailable' }
  | { kind: 'too_many' }
  | { kind: 'found'; order: Order };

/**
 * A crude limiter, and deliberately so.
 *
 * An order number is six characters from a thirty-two letter alphabet, and the
 * email has to match as well, so guessing one is not realistic — but a lookup
 * form with no ceiling is still a free ride on somebody else's Stripe account.
 * Ten attempts a minute is far more than a person who mistyped their own number
 * will ever need.
 *
 * It lives in the process, which means it resets on a restart and does not span
 * instances. For a shop of this size that is the honest trade; a real one puts
 * this in front of the application, not inside it.
 */
const attempts = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX = 10;

function allowed(key: string): boolean {
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX) {
    attempts.set(key, recent);
    return false;
  }
  recent.push(now);
  attempts.set(key, recent);
  // keep the map from growing without bound on a long-running process
  if (attempts.size > 5000) {
    for (const [k, v] of attempts) if (v.every((t) => now - t >= WINDOW_MS)) attempts.delete(k);
  }
  return true;
}

export async function lookupOrder(_prev: LookupState, form: FormData): Promise<LookupState> {
  const number = String(form.get('number') ?? '').trim().toUpperCase();
  const email = String(form.get('email') ?? '').trim();

  if (!isOrderNumber(number)) return { kind: 'invalid', field: 'number' };
  if (!isEmail(email)) return { kind: 'invalid', field: 'email' };

  const h = await headers();
  const ip = (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'local';
  if (!allowed(ip)) return { kind: 'too_many' };

  const result = await findOrder(number, email);
  if (result === 'not_found') return { kind: 'not_found' };
  if (result === 'unavailable') return { kind: 'unavailable' };
  return { kind: 'found', order: result };
}
