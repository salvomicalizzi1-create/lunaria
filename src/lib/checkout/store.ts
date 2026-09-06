'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { isEmail } from '@/lib/validation';

export type Contact = { email: string; firstName: string; lastName: string };
export type Address = {
  line1: string; line2: string; postcode: string; city: string;
  province: string; country: string; phone: string;
};

type CheckoutState = {
  contact: Contact;
  shipping: Address;
  billingSameAsShipping: boolean;
  setContact: (c: Partial<Contact>) => void;
  setShipping: (a: Partial<Address>) => void;
  setBillingSame: (v: boolean) => void;
  reset: () => void;
};

const emptyContact: Contact = { email: '', firstName: '', lastName: '' };
const emptyAddress: Address = {
  line1: '', line2: '', postcode: '', city: '', province: '', country: 'IT', phone: '',
};

/**
 * Kept in sessionStorage, not localStorage.
 *
 * A name, an address and a phone number are personal data. They stay for the
 * length of this visit so a refresh or a step back does not make the visitor
 * type them twice, and they are gone when the tab closes.
 */
export const useCheckout = create<CheckoutState>()(
  persist(
    (set) => ({
      contact: emptyContact,
      shipping: emptyAddress,
      billingSameAsShipping: true,
      setContact: (c) => set((s) => ({ contact: { ...s.contact, ...c } })),
      setShipping: (a) => set((s) => ({ shipping: { ...s.shipping, ...a } })),
      setBillingSame: (v) => set({ billingSameAsShipping: v }),
      reset: () => set({ contact: emptyContact, shipping: emptyAddress, billingSameAsShipping: true }),
    }),
    {
      name: 'lunaria-checkout',
      storage: createJSONStorage(() => sessionStorage),
      version: 1,
    }
  )
);

/* ------------------------------------------------------------ validation */
/* Checked on blur, never on every keystroke: telling someone their email is
   wrong while they are still typing it is just noise. */

/* Defined in @/lib/validation, which carries no 'use client', so the server
   action behind the order lookup can call the same rule. A function exported
   from a client module reaches the server as a reference it cannot invoke. */
export { isEmail } from '@/lib/validation';

export function contactErrors(c: Contact, t: (k: string) => string) {
  const e: Record<string, string> = {};
  if (!c.email.trim()) e.email = t('errEmailRequired');
  else if (!isEmail(c.email)) e.email = t('errEmailFormat');
  if (!c.firstName.trim()) e.firstName = t('errFirstName');
  if (!c.lastName.trim()) e.lastName = t('errLastName');
  return e;
}

export function shippingErrors(a: Address, t: (k: string) => string) {
  const e: Record<string, string> = {};
  if (!a.line1.trim()) e.line1 = t('errLine1');
  if (!a.postcode.trim()) e.postcode = t('errPostcode');
  else if (a.country === 'IT' && !/^\d{5}$/.test(a.postcode.trim())) e.postcode = t('errPostcodeIt');
  if (!a.city.trim()) e.city = t('errCity');
  if (!a.country.trim()) e.country = t('errCountry');
  return e;
}
