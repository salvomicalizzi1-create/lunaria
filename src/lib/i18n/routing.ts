import { defineRouting } from 'next-intl/routing';

/**
 * Italian is the brand's own voice and the default. English is a real
 * translation, not a machine echo, and it is the x-default for search engines
 * because it reaches the widest audience.
 */
export const routing = defineRouting({
  locales: ['it', 'en'],
  defaultLocale: 'it',
  // both languages carry their prefix, so /it and /en are equals and neither
  // is a second-class copy living at the bare root
  localePrefix: 'always',
});

export type Locale = (typeof routing.locales)[number];
