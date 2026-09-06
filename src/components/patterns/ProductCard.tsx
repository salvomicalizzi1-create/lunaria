import Image from 'next/image';
import { Link } from '@/lib/i18n/navigation';
import { formatCents } from '@/components/primitives/Price';
import { collectionById } from '@/data/collections';
import type { Product } from '@/types/product';
import type { Locale } from '@/lib/i18n/routing';

/** the worst state across every size, which is what the card should admit to */
function cardAvailability(p: Product) {
  const all = p.variants.flatMap((v) => v.sizes);
  if (all.every((s) => s.availability.state === 'out-of-stock')) return 'out' as const;
  const low = all.filter((s) => s.availability.state === 'low-stock').length;
  const open = all.filter((s) => s.availability.state !== 'out-of-stock').length;
  // truthful threshold: called low only when most of the run really is gone
  if (open > 0 && low >= open) return 'low' as const;
  return 'in' as const;
}

export function ProductCard({
  product,
  locale,
  labels,
  priority = false,
}: {
  product: Product;
  locale: Locale;
  labels: { soldOut: string; lowStock: string; colours: string };
  priority?: boolean;
}) {
  const collection = collectionById[product.collection];
  const state = cardAvailability(product);
  const discounted =
    typeof product.compareAtCents === 'number' && product.compareAtCents > product.priceCents;

  return (
    <article className="card">
      <Link href={`/prodotto/${product.slug}`} className="card__link">
        <div className="card__media">
          <Image
            src={product.image}
            alt={`${product.name[locale]}, ${collection.name[locale]}`}
            width={1000}
            height={1250}
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
            priority={priority}
            className="card__img"
          />
          {state === 'out' && (
            // a word plus a hairline, never colour alone
            <span className="card__flag card__flag--out">{labels.soldOut}</span>
          )}
          {state === 'low' && (
            <span className="card__flag card__flag--low">{labels.lowStock}</span>
          )}
        </div>

        <p className="eyebrow card__coll">{collection.name[locale]}</p>
        <h3 className="card__name">{product.name[locale]}</h3>

        <p className="card__price">
          <span className="price">{formatCents(product.priceCents, locale)}</span>
          {discounted && (
            <span className="price__was">{formatCents(product.compareAtCents!, locale)}</span>
          )}
        </p>
      </Link>

      {/* Swatches are ALWAYS visible, never hover-only: anything that appears
          only on hover does not exist on a phone. */}
      {product.variants.length > 1 && (
        <ul className="card__swatches" aria-label={labels.colours}>
          {product.variants.map((v) => (
            <li key={v.id}>
              <span className="card__swatch" style={{ background: v.hex }} aria-hidden="true" />
              <span className="sr">{v.colour[locale]}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export default ProductCard;
