'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/lib/i18n/navigation';
import { useParams } from 'next/navigation';
import type { Locale } from '@/lib/i18n/routing';

/**
 * Switching language keeps the visitor on the same page, so nobody is thrown
 * back to the home page for wanting to read in their own language.
 */
export function LocaleSwitch({
  className = 'tool',
  esteso = false,
  onSwitch,
}: {
  className?: string;
  /** «Switch to English» invece della sola sigla: serve dentro al menu del
   *  telefono, dove due lettere in mezzo a voci scritte per esteso non si
   *  capirebbero */
  esteso?: boolean;
  /** il menu si chiude da sé quando si cambia lingua */
  onSwitch?: () => void;
} = {}) {
  const t = useTranslations('lang');
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();

  const next: Locale = locale === 'it' ? 'en' : 'it';
  const etichetta = next === 'en' ? t('switchToEn') : t('switchToIt');

  return (
    <button
      type="button"
      className={className}
      lang={next}
      aria-label={etichetta}
      onClick={() => {
        onSwitch?.();
        router.replace(
          // @ts-expect-error the params of the current route are carried through unchanged
          { pathname, params },
          { locale: next }
        );
      }}
    >
      {esteso ? etichetta : next === 'en' ? t('toEn') : t('toIt')}
    </button>
  );
}

export default LocaleSwitch;
