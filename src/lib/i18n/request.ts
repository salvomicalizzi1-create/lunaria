import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`@/content/${locale}.json`)).default,
    // prices are shown VAT included for EU visitors; the amount is broken out
    // at checkout, never as a surprise afterwards
    formats: {
      number: {
        price: { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 },
      },
      dateTime: {
        long: { day: 'numeric', month: 'long', year: 'numeric' },
      },
    },
  };
});
