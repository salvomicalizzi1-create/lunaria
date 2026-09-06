'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Contact, Address } from '@/lib/checkout/store';

export type RememberedOrder = {
  number: string;
  paymentIntentId: string;
  email: string;
  /** when this browser first saw it, so the list can be newest first */
  seenAt: string;
};

type AccountState = {
  /** the details this browser offers to fill in at checkout, if asked to */
  contact: Contact | null;
  address: Address | null;
  orders: RememberedOrder[];
  save: (contact: Contact, address: Address) => void;
  rememberOrder: (o: Omit<RememberedOrder, 'seenAt'>) => void;
  forgetOrder: (number: string) => void;
  forgetEverything: () => void;
};

/**
 * The account, and what it honestly is.
 *
 * There is no server here that could hold an account: no database, no password
 * hashing, no session, no way to send a reset email. Rather than build a login
 * form that pretends otherwise, this browser remembers three things — your
 * details, so checkout can offer to fill itself in, and the numbers of the
 * orders placed from this device, so they can be looked up again.
 *
 * Every page that uses it says so in those words. An account page that implies
 * a server is holding your data when nothing is would be a lie told in a
 * reassuring typeface, and it is the kind of lie people only discover when they
 * change device and find their order history gone.
 *
 * The orders themselves are not stored here. Only their numbers are: opening one
 * asks Stripe, which is where the order actually lives.
 */
export const useAccount = create<AccountState>()(
  persist(
    (set) => ({
      contact: null,
      address: null,
      orders: [],

      save: (contact, address) => set({ contact, address }),

      rememberOrder: (o) =>
        set((s) => {
          if (s.orders.some((x) => x.number === o.number)) return s;
          // newest first, and a cap so a shared machine does not grow forever
          return { orders: [{ ...o, seenAt: new Date().toISOString() }, ...s.orders].slice(0, 40) };
        }),

      forgetOrder: (number) =>
        set((s) => ({ orders: s.orders.filter((o) => o.number !== number) })),

      forgetEverything: () => set({ contact: null, address: null, orders: [] }),
    }),
    {
      name: 'lunaria-account',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
