import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/lib/i18n/routing';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Ticker } from '@/components/sections/home/Ticker';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });

  return {
    // every relative image in the metadata resolves against this, so a shared
    // link shows a picture instead of nothing
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        'it-IT': '/it',
        en: '/en',
        'x-default': '/en',
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'nav' });

  /* The page has one ground and it is night.
     There used to be a reading mode here, read from a cookie so the right one
     was already in the HTML. It is gone: a brand built on the line between light
     and shadow, with a switch that turns the shadow off, was arguing with
     itself. The bone-coloured band in the middle of the page stays — that is a
     composition, not a setting. */
  return (
    <html lang={locale}>
      <head>
        <meta name="theme-color" content="#0B1020" />
        {/* only the Bodoni file used above the fold is preloaded */}
        <link
          rel="preload"
          href="/fonts/bodoni-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <NextIntlClientProvider>
          <a className="skip" href="#main">{t('skip')}</a>
          {/* above the header, where it belongs; it renders nothing off the
              homepage */}
          <Ticker />
          <Header />
          <main id="main" tabIndex={-1}>
            {children}
          </main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
