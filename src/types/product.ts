import type { Locale } from '@/lib/i18n/routing';

/** Anything a visitor reads exists in both languages. English is a real
 *  translation, never a machine echo of the Italian. */
export type Loc = Record<Locale, string>;

export type CollectionId = 'fasi' | 'arcani' | 'erbario' | 'carta-del-cielo' | 'sale-e-ferro';
export type CategoryId = 't-shirt' | 'felpe' | 'maglieria' | 'camicie' | 'denim' | 'accessori';

/**
 * Real inventory states, and no invented ones. There is no "3 people are
 * viewing this" here and there never will be: the research says shoppers punish
 * fake urgency, and EU rules treat baseless scarcity claims as a dark pattern.
 */
export type Availability =
  | { state: 'in-stock' }
  | { state: 'low-stock'; left: number }   // shown only when it is true
  | { state: 'out-of-stock' }
  | { state: 'pre-order'; shipsOn: string };

export type SizeOption = {
  size: string;
  availability: Availability;
};

export type Variant = {
  id: string;
  colour: Loc;
  /** the swatch, so colour is never the only carrier of meaning: the name is
   *  always written next to it */
  hex: string;
  sizes: SizeOption[];
};

export type Product = {
  id: string;
  slug: string;
  name: Loc;
  collection: CollectionId;
  category: CategoryId;
  /** cents, always. Floating point money is how shops charge 19.999999 euro. */
  priceCents: number;
  /** the price before a discount, when there is one */
  compareAtCents?: number;
  /** EU price indication: mandatory whenever compareAtCents is set */
  lowest30Cents?: number;
  variants: Variant[];
  /** grams per square metre, the number that answers "is this cheap fabric" */
  gsm?: number;
  composition: Loc;   // required by the EU textile labelling regulation
  origin: Loc;
  care: Loc;
  /** the museum label: what the symbol is and where it comes from. This block is
   *  the brand's whole differentiation. */
  meaning: Loc;
  /** 4:5. Placeholders for now; the swap path is documented in the README. */
  image: string;
  /** the gallery. Every product needs four in the end: flat, on model, macro of
   *  the print, and a ritual shot. Today most have one, and the page shows what
   *  exists rather than padding the rail with repeats. */
  images?: string[];
  /** the model's height and the size they wear, so "it looked bigger online"
   *  has an answer before it becomes a return */
  fitNote?: Loc;
  /** how buyers reported the fit. Real numbers once there are real purchases;
   *  until then it is clearly marked as sample data. */
  fitVotes?: { small: number; true: number; large: number };
  edition?: string;
  /** newest first ordering without inventing a date field per product */
  releasedOn: string;
  bestseller?: boolean;
};

export type Collection = {
  id: CollectionId;
  name: Loc;
  tag: string;
  meaning: Loc;
  family: Loc;
  accent: string;
  image: string;
  /** what the collection's photograph actually shows, written not generated */
  alt: Loc;
};

export type Category = {
  id: CategoryId;
  name: Loc;
};
