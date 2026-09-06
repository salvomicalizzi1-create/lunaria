import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';

export async function Footer() {
  const t = await getTranslations('footer');
  const nav = await getTranslations('nav');
  const brand = await getTranslations('brand');

  return (
    <footer className="ftr">
      <div className="wrap">
        <div className="ftr__cols">
          <div>
            <h2>{brand('name')}</h2>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', maxWidth: '22ch' }}>
              {brand('payoff')}
            </p>
          </div>

          <div>
            <h2>{t('collections')}</h2>
            <ul>
              <li><Link href="/collezioni/fasi">Fasi</Link></li>
              <li><Link href="/collezioni/arcani">Arcani</Link></li>
              <li><Link href="/collezioni/erbario">Erbario</Link></li>
              <li><Link href="/collezioni/carta-del-cielo">Carta del cielo</Link></li>
              <li><Link href="/collezioni/sale-e-ferro">Sale e ferro</Link></li>
            </ul>
          </div>

          <div>
            <h2>{t('brandCol')}</h2>
            {/* These are sections of the homepage, not pages of their own: the
                brand's story is one scroll, and splitting it into stubs would
                mean four thin pages nobody has a reason to open. */}
            <ul>
              <li><Link href="/#luna">{nav('tonightsMoon')}</Link></li>
              <li><Link href="/#lune">{nav('thirteenMoons')}</Link></li>
              <li><Link href="/#materia">{nav('material')}</Link></li>
              <li><Link href="/#cerchio">{nav('circle')}</Link></li>
            </ul>
          </div>

          {/* Consistent help, SC 3.2.6: the contact link sits in the same place
              in the footer on every single page. */}
          <div>
            <h2>{t('help')}</h2>
            <ul>
              <li><Link href="/aiuto">{t('help')}</Link></li>
              <li><Link href="/ordini">{nav('orders')}</Link></li>
              <li><Link href="/account">{nav('account')}</Link></li>
              <li><Link href="/legale/recesso">{t('withdrawal')}</Link></li>
              <li><Link href="/legale/termini">{t('terms')}</Link></li>
              <li><Link href="/legale/privacy">{t('privacy')}</Link></li>
              <li><Link href="/legale/cookie">{t('cookies')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="ftr__legal">
          <p><strong style={{ color: 'var(--fg)' }}>{t('fictional')}</strong></p>
          <p>{t('esoteric')}</p>
          <p>
            <span className="tag">{t('legalTag')}</span>{' '}
            {t('legalTodo')}
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
