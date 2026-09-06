import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { AccountPanel } from '@/components/sections/account/AccountPanel';
import { routing } from '@/lib/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'account' });
  return { title: `${t('title')} · LUNARIA`, robots: { index: false, follow: true } };
}

export default async function Account({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('account');

  return (
    <div className="wrap acct" style={{ paddingBlock: 'var(--spacing-9)', maxWidth: '760px' }}>
      <p className="eyebrow">{t('eyebrow')}</p>
      <h1 style={{ fontSize: 'var(--text-h1)', marginBlock: 'var(--spacing-3)' }}>{t('title')}</h1>
      {/* The first thing the page says is what it is, not what it wishes it was. */}
      <p className="lede">{t('lede')}</p>
      <p className="acct__truth">{t('truth')}</p>

      <AccountPanel />
    </div>
  );
}
