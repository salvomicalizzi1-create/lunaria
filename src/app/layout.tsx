import type { ReactNode } from 'react';
import './globals.css';

/**
 * The root layout only carries what is language independent. Everything the
 * visitor reads lives under [locale].
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
