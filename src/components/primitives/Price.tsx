import { getTranslations } from 'next-intl/server';

/**
 * Amounts are integers in cents everywhere in this codebase. Floating point
 * money is how shops end up charging 19.999999 euro.
 */
export function formatCents(cents: number, locale: string) {
  return new Intl.NumberFormat(locale === 'en' ? 'en-IE' : 'it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

type Props = {
  cents: number;
  locale: string;
  /** the price before the discount, if there is one */
  compareAtCents?: number;
  /**
   * EU price indication rule: when a product is discounted, the lowest price
   * applied in the previous 30 days must be shown. Passing it is not optional
   * once compareAtCents is set.
   */
  lowest30Cents?: number;
};

export async function Price({ cents, locale, compareAtCents, lowest30Cents }: Props) {
  const t = await getTranslations('price');
  const discounted = typeof compareAtCents === 'number' && compareAtCents > cents;

  return (
    <span className="price">
      <span>{formatCents(cents, locale)}</span>
      {discounted && (
        <span className="price__was">{formatCents(compareAtCents, locale)}</span>
      )}
      {discounted && typeof lowest30Cents === 'number' && (
        <span className="price__lowest">
          {t('lowest30')}: {formatCents(lowest30Cents, locale)}
        </span>
      )}
    </span>
  );
}

export default Price;
