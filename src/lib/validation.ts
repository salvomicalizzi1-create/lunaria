/**
 * Validation that both sides share.
 *
 * It lives on its own, with no 'use client' on it, for one specific reason: the
 * checkout store is a client module, and a function imported from a client
 * module into a server action does not arrive as a function. It arrives as a
 * reference the server cannot call, and the failure shows up at runtime as
 * "Illegal invocation" rather than at build time as anything useful.
 *
 * The rule an email has to pass is the same in the browser and on the server,
 * so it is written once, here, where both can reach it.
 */
export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

/** LN- and six characters from the read-aloud alphabet. */
export const isOrderNumber = (v: string) => /^LN-[A-Z2-9]{6}$/.test(v.trim().toUpperCase());
