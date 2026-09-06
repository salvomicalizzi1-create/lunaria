import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing, type Locale } from '@/lib/i18n/routing';
import { Atmosphere } from '@/components/sections/home/Atmosphere';
import { Reveal } from '@/components/sections/home/Reveal';
import { Hero } from '@/components/sections/home/Hero';
import { MoonInstrument } from '@/components/sections/home/MoonInstrument';
import { CollectionsRows } from '@/components/sections/home/CollectionsRows';
import { Meaning } from '@/components/sections/home/Meaning';
import { Material } from '@/components/sections/home/Material';
import { Oracle } from '@/components/sections/home/Oracle';
import { ThirteenMoons } from '@/components/sections/home/ThirteenMoons';
import { Circle } from '@/components/sections/home/Circle';

/**
 * The homepage: the film, and then the shop.
 *
 * The cinematic page and the shop used to be two separate things at two separate
 * addresses, which meant the film had nothing to sell and the shop had nothing
 * to say. They are one page now, and every section that used to end in a caption
 * ends in a link: the five collections open the real listings, the museum label
 * opens the garment it describes, and the Oracle hands back three pieces you can
 * put in the basket.
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const typed = locale as Locale;

  const t = await getTranslations('hero');

  return (
    <>
      <Atmosphere />
      <Reveal />

      {/* The one h1 of the page. Both visible hero headlines are gated by CSS —
          one of them is hidden on every device — so the heading lives here where
          it is exposed in every mode, and the bands say it visually. */}
      <h1 className="vh">{t('h1')}</h1>

      <Hero />
      <MoonInstrument />
      <CollectionsRows locale={typed} />
      <Meaning locale={typed} />
      <Material />
      <Oracle locale={typed} />
      <ThirteenMoons />
      <Circle />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
