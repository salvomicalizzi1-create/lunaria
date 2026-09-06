import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { HeaderShell } from './HeaderShell';
import { MoonMark } from './MoonMark';
import { MobileNav } from './MobileNav';
import { LocaleSwitch } from './LocaleSwitch';
import { CartDrawer } from './CartDrawer';

export async function Header() {
  const t = await getTranslations('nav');
  const brand = await getTranslations('brand');

  return (
    <HeaderShell>
      <Link href="/" className="brand">
        <MoonMark />
        {brand('name')}
      </Link>

      <nav className="navmain" aria-label={t('main')}>
        <Link href="/collezioni">{t('collections')}</Link>
        <Link href="/#lune">{t('thirteenMoons')}</Link>
        <Link href="/#oracolo">{t('oracle')}</Link>
        <Link href="/#cerchio">{t('circle')}</Link>
      </nav>

      {/* L'ordine è lingua, account, carrello: dalla scelta più generale alla
          più impegnativa, e il carrello resta l'ultimo prima del menu perché è
          quello che si cerca guardando all'angolo. */}
      <div className="hdr__tools">
        <LocaleSwitch className="tool tool--lingua" />
        {/* the account is a link on every width: it is where somebody goes to
            find an order, and hiding it behind a menu on a phone is where that
            journey usually dies */}
        <Link className="tool" href="/account" aria-label={t('account')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
            <circle cx="12" cy="8" r="3.6" />
            <path d="M4.5 20a7.5 7.5 0 0 1 15 0" strokeLinecap="round" />
          </svg>
        </Link>
        <CartDrawer />
        <MobileNav />
      </div>
    </HeaderShell>
  );
}

export default Header;
