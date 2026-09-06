'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { commerce as _commerce } from '@/lib/commerce';
import { tokens } from '@/design/tokens';

export type CartLine = {
  /** slug + variant + size, so the same shirt in two sizes is two lines */
  key: string;
  slug: string;
  variantId: string;
  size: string;
  qty: number;
  /** copied in at the time of adding, so the drawer needs no round trip */
  name: string;
  colour: string;
  image: string;
  unitCents: number;
  /** how many the shop actually has, so the stepper can stop with a reason */
  maxQty: number;
};

type Removed = { line: CartLine; at: number; index: number };

type CartState = {
  lines: CartLine[];
  open: boolean;
  /** the last removed line, kept so "undo" is real and not a promise */
  lastRemoved: Removed | null;
  add: (line: Omit<CartLine, 'key' | 'qty'>, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  undoRemove: () => void;
  clearUndo: () => void;
  setOpen: (open: boolean) => void;
};

const keyOf = (slug: string, variantId: string, size: string) => `${slug}|${variantId}|${size}`;

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      open: false,
      lastRemoved: null,

      /* Optimistic by design: the state changes first and any animation runs
         after. Motion must never delay commerce. */
      add: (line, qty = 1) => {
        const key = keyOf(line.slug, line.variantId, line.size);
        const lines = [...get().lines];
        const i = lines.findIndex((l) => l.key === key);
        if (i >= 0) {
          lines[i] = { ...lines[i], qty: Math.min(lines[i].maxQty, lines[i].qty + qty) };
        } else {
          lines.push({ ...line, key, qty: Math.min(line.maxQty, qty) });
        }
        set({ lines, open: true });
      },

      setQty: (key, qty) =>
        set((s) => ({
          lines: s.lines.map((l) =>
            l.key === key ? { ...l, qty: Math.max(1, Math.min(l.maxQty, qty)) } : l
          ),
        })),

      remove: (key) =>
        set((s) => {
          const index = s.lines.findIndex((l) => l.key === key);
          if (index < 0) return s;
          return {
            lines: s.lines.filter((l) => l.key !== key),
            lastRemoved: { line: s.lines[index], at: Date.now(), index },
          };
        }),

      undoRemove: () =>
        set((s) => {
          if (!s.lastRemoved) return s;
          const lines = [...s.lines];
          lines.splice(s.lastRemoved.index, 0, s.lastRemoved.line);
          return { lines, lastRemoved: null };
        }),

      clearUndo: () => set({ lastRemoved: null }),
      /* never opened by the page itself: only a deliberate action opens it */
      setOpen: (open) => set({ open }),
    }),
    {
      name: 'lunaria-cart',
      storage: createJSONStorage(() => localStorage),
      // the drawer's open state and the undo buffer are per visit, not per browser
      partialize: (s) => ({ lines: s.lines }) as CartState,
      version: 1,
    }
  )
);

/* ------------------------------------------------------------- selectors */
export const countOf = (lines: CartLine[]) => lines.reduce((n, l) => n + l.qty, 0);
export const subtotalOf = (lines: CartLine[]) =>
  lines.reduce((n, l) => n + l.unitCents * l.qty, 0);

/** VAT is included in the displayed price; this is the amount inside it, which
 *  the checkout has to break out by law. */
export const vatInside = (grossCents: number) =>
  Math.round(grossCents - grossCents / (1 + tokens.commerce.vatRate));

export const freeShippingGap = (subtotal: number) =>
  Math.max(0, tokens.commerce.freeShippingThreshold - subtotal);
