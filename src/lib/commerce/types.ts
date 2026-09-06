import type { Product, Collection, Category, CollectionId, CategoryId } from '@/types/product';

/**
 * The one interface the whole shop talks to. Today a local adapter answers it
 * from src/data. The day LUNARIA needs a real backend, a second adapter answers
 * the same calls and not a single component changes.
 */

export type SortKey = 'novita' | 'prezzo-su' | 'prezzo-giu' | 'venduti';

export type ProductQuery = {
  collection?: CollectionId;
  category?: CategoryId;
  /** size codes, e.g. ['m','l'] */
  size?: string[];
  /** variant colour ids, e.g. ['osso'] */
  colour?: string[];
  /** cents */
  priceMin?: number;
  priceMax?: number;
  /** only what a visitor can actually buy today */
  available?: boolean;
  sort?: SortKey;
  page?: number;
  perPage?: number;
};

export type ProductPage = {
  items: Product[];
  total: number;
  page: number;
  perPage: number;
  pages: number;
};

export type Facets = {
  sizes: { value: string; count: number }[];
  colours: { value: string; label: Record<string, string>; hex: string; count: number }[];
  collections: { value: CollectionId; count: number }[];
  categories: { value: CategoryId; count: number }[];
  priceRange: { min: number; max: number };
};

export interface CommerceAdapter {
  listProducts(query: ProductQuery): Promise<ProductPage>;
  /** counts computed against the query WITHOUT its own dimension, so a filter
   *  never hides the option the visitor is about to click */
  getFacets(query: ProductQuery): Promise<Facets>;
  getProduct(slug: string): Promise<Product | null>;
  listCollections(): Promise<Collection[]>;
  getCollection(id: string): Promise<Collection | null>;
  listCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | null>;
}
