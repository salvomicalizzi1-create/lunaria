'use client';

import { useEffect } from 'react';
import { useCart } from '@/lib/cart/store';
import { useCheckout } from '@/lib/checkout/store';

/**
 * Clears the basket once the payment has gone through.
 *
 * An order that has been paid must not stay in the browser waiting to be paid
 * again — that is how somebody buys the same jacket twice by pressing back. The
 * personal details go with it: they were kept for the length of the checkout,
 * and the checkout is over.
 */
export function ClearAfterPayment() {
  useEffect(() => {
    useCart.setState({ lines: [], open: false, lastRemoved: null });
    useCheckout.getState().reset();
  }, []);
  return null;
}

export default ClearAfterPayment;
