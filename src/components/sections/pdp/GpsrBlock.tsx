import { getTranslations } from 'next-intl/server';

/**
 * GPSR, Regulation (EU) 2023/988, applicable since 13 December 2024. Every
 * product page must carry the manufacturer's name and postal address, an email,
 * the EU responsible person where different, a product identifier, and any
 * warnings in the language of the country of sale.
 *
 * LUNARIA is a fictional brand, so there is no real manufacturer to name. The
 * block is present and complete in structure, with every field marked for a
 * lawyer, rather than filled with an invented company that would itself be a
 * false statement.
 */
export async function GpsrBlock({ sku }: { sku: string }) {
  const t = await getTranslations('gpsr');

  return (
    <details className="gpsr">
      <summary className="gpsr__summary">
        <span className="eyebrow">{t('title')}</span>
      </summary>
      <div className="gpsr__body">
        <p className="gpsr__lead">{t('lead')}</p>
        <dl className="spec">
          <div><dt>{t('sku')}</dt><dd className="mono">{sku}</dd></div>
          <div><dt>{t('manufacturer')}</dt><dd><span className="tag">{t('tag')}</span></dd></div>
          <div><dt>{t('address')}</dt><dd><span className="tag">{t('tag')}</span></dd></div>
          <div><dt>{t('email')}</dt><dd><span className="tag">{t('tag')}</span></dd></div>
          <div><dt>{t('responsible')}</dt><dd><span className="tag">{t('tag')}</span></dd></div>
          <div><dt>{t('warnings')}</dt><dd>{t('noWarnings')}</dd></div>
        </dl>
      </div>
    </details>
  );
}

export default GpsrBlock;
