import { products } from './products';
import type { Loc } from '@/types/product';
import rawOracle from './oracle.json';

/**
 * The Oracle is a deck, not three fixed cards: three plates per axis, one drawn
 * from each, so twenty-seven readings with different garments behind them.
 *
 * It is a game. It helps somebody pick a t-shirt, and it predicts nothing —
 * which the section says out loud under the cards.
 */

export type Tag =
  | 'quotidiano' | 'sera' | 'riparo'      // intention
  | 'cotone' | 'tela' | 'lana'            // material
  | 'mezza' | 'freddo' | 'caldo';         // season

export type Axis = { id: 'intenzione' | 'materia' | 'stagione'; label: Loc; title: Loc };

export const axes: Axis[] = rawOracle.axes as Axis[];

export type Plate = {
  /** the engraving on the face, in /public/images/oracolo */
  image: string;
  tag: Tag;
  key: Loc;
  value: Loc;
  /** the fragment this card contributes to the sentence of the reading */
  reading: Loc;
  alt: Loc;
};

/* Gli assi e il mazzo stanno in oracle.json: è testo che si legge sul sito, e
   chi lo scrive non deve aprire un file di codice per cambiarlo. */
export const deck: Record<Axis['id'], Plate[]> = rawOracle.deck as Record<Axis['id'], Plate[]>;

/**
 * What each garment is actually for. Judgement, not derivation: gsm and category
 * cannot tell you that a hooded sweatshirt is for staying covered, and guessing
 * it from the data would produce confident nonsense.
 */
const tagsBySlug = rawOracle.tagsBySlug as Record<string, Tag[]>;

/* A garment the Oracle cannot reach is a garment that quietly vanished from the
   deck, and a tag on a slug that no longer exists is a reading that returns
   nothing. Both are silent failures, so they stop the build instead. */
{
  const slugs = new Set(products.map((p) => p.slug));
  const tagged = new Set(Object.keys(tagsBySlug));
  const missing = [...slugs].filter((s) => !tagged.has(s));
  const stale = [...tagged].filter((s) => !slugs.has(s));
  if (missing.length || stale.length) {
    throw new Error(
      `oracle.ts is out of step with the catalogue.${
        missing.length ? ` Untagged: ${missing.join(', ')}.` : ''
      }${stale.length ? ` Unknown slugs: ${stale.join(', ')}.` : ''}`,
    );
  }
}

/**
 * Three cards in, three garments out. Ties break on catalogue order rather than
 * at random, so the same draw always lands on the same three pieces and a shared
 * reading shows the reader what the sender saw.
 */
export function pickProducts(tags: Tag[], count = 3) {
  return products
    .map((p, idx) => ({
      product: p,
      score: tags.reduce((n, tag) => n + (tagsBySlug[p.slug].includes(tag) ? 1 : 0), 0),
      idx,
    }))
    .sort((a, b) => b.score - a.score || a.idx - b.idx)
    .slice(0, count)
    .map((o) => o.product);
}

export const readingCount = deck.intenzione.length * deck.materia.length * deck.stagione.length;
