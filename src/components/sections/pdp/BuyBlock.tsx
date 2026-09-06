'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useCart } from '@/lib/cart/store';
import type { Product } from '@/types/product';
import type { Locale } from '@/lib/i18n/routing';

/**
 * Colour, size, and the buy button. The cart itself arrives in the next block:
 * this component already knows exactly what was chosen and says so honestly
 * rather than pretending to add something.
 */
export function BuyBlock({
  product,
  locale,
  priceLabel,
}: {
  product: Product;
  locale: Locale;
  priceLabel: string;
}) {
  const t = useTranslations('pdp');
  const [variantId, setVariantId] = useState(product.variants[0].id);
  const [size, setSize] = useState<string | null>(null);
  const [notifyFor, setNotifyFor] = useState<string | null>(null);
  const [notified, setNotified] = useState<string | null>(null);
  const [said, setSaid] = useState('');
  const barRef = useRef<HTMLDivElement>(null);
  const [showBar, setShowBar] = useState(false);

  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  const chosen = variant.sizes.find((s) => s.size === size);
  const canBuy = chosen && chosen.availability.state !== 'out-of-stock';

  // the sticky phone bar appears once the buy block has scrolled past
  useEffect(() => {
    const el = barRef.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setShowBar(!e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const addToCart = useCart((s) => s.add);

  function add() {
    if (!canBuy || !size || !chosen) return;
    // the state changes first; nothing waits on an animation
    addToCart({
      slug: product.slug,
      variantId: variant.id,
      size,
      name: product.name[locale],
      colour: variant.colour[locale],
      image: product.image,
      unitCents: product.priceCents,
      maxQty: chosen.availability.state === 'low-stock' ? chosen.availability.left : 10,
    });
    // announced politely, so the choice is confirmed without stealing focus
    setSaid(t('added', { name: product.name[locale], size }));
  }

  return (
    <div className="buy" ref={barRef}>
      {/* --------------------------------------------------------- colour */}
      <fieldset className="buy__set">
        <legend className="eyebrow">
          {t('colour')}: <span className="buy__chosen">{variant.colour[locale]}</span>
        </legend>
        <div className="buy__swatches">
          {product.variants.map((v) => (
            <button
              key={v.id}
              type="button"
              className="buy__swatch"
              aria-pressed={v.id === variantId}
              onClick={() => { setVariantId(v.id); setSize(null) }}
            >
              <span style={{ background: v.hex }} aria-hidden="true" />
              {/* the name is always written: colour is never the only carrier */}
              <span className="buy__swatchName">{v.colour[locale]}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {/* ----------------------------------------------------------- size */}
      <fieldset className="buy__set">
        <legend className="eyebrow">{t('size')}</legend>
        <div className="buy__sizes">
          {variant.sizes.map((s) => {
            // narrowed on the union itself, so the compiler knows when `left` exists
            const av = s.availability;
            const out = av.state === 'out-of-stock';
            return (
              <button
                key={s.size}
                type="button"
                className="buy__size"
                data-out={out ? 'true' : undefined}
                aria-pressed={size === s.size}
                onClick={() => (out ? setNotifyFor(s.size) : setSize(s.size))}
              >
                {s.size}
                {av.state === 'low-stock' && (
                  <span className="buy__left">{t('left', { n: av.left })}</span>
                )}
                {out && <span className="sr">{t('soldOut')}</span>}
              </button>
            );
          })}
        </div>

        {/* the unavailable size expands in place into an email field, instead of
            opening a modal that loses the visitor's place */}
        {notifyFor && (
          <div className="notify">
            <p className="mono">{t('notifyIntro', { size: notifyFor })}</p>
            {notified === notifyFor ? (
              <p className="notify__ok" role="status">{t('notifyDone')}</p>
            ) : (
              <form
                className="notify__form"
                onSubmit={(e) => { e.preventDefault(); setNotified(notifyFor) }}
              >
                <label className="sr" htmlFor="notify-email">{t('yourEmail')}</label>
                <input
                  id="notify-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  placeholder="nome@dominio.it"
                  className="notify__input"
                />
                <button className="btn btn--ghost" type="submit">{t('notifyMe')}</button>
              </form>
            )}
            <p className="notify__note">{t('demoNote')}</p>
          </div>
        )}
      </fieldset>

      {/* ------------------------------------------------------------ buy */}
      <div className="buy__actions">
        <button
          type="button"
          className="btn btn--primary buy__cta"
          onClick={add}
          disabled={!canBuy}
        >
          {size ? t('addToCart') : t('chooseSize')}
        </button>
        <p className="buy__price">{priceLabel}</p>
      </div>

      <p className="buy__live" role="status" aria-live="polite">{said}</p>

      {/* The phone bar reserves its height before it appears, so it costs zero
          layout shift, and it clears the home indicator. */}
      <div className="stickybar" data-show={showBar ? 'true' : undefined} aria-hidden={!showBar}>
        <span className="stickybar__price">{priceLabel}</span>
        <button
          type="button"
          className="btn btn--primary"
          onClick={add}
          disabled={!canBuy}
          tabIndex={showBar ? 0 : -1}
        >
          {size ? t('addToCart') : t('chooseSize')}
        </button>
      </div>
    </div>
  );
}

export default BuyBlock;
