import type { Collection, Category } from '@/types/product';
import raw from './collections.json';

/**
 * Le cinque collezioni e le sei categorie.
 *
 * I dati sono usciti da qui e sono andati in collections.json, perché il
 * pannello di modifica possa riscriverli in sicurezza: cambiare i contenuti di
 * qualcuno con un'espressione regolare dentro un file di codice non è un modo
 * onesto di farlo. Qui restano i tipi e gli indici.
 */
export const collections = raw.collections as Collection[];
export const categories = raw.categories as Category[];

export const collectionById = Object.fromEntries(collections.map((c) => [c.id, c]));
export const categoryById = Object.fromEntries(categories.map((c) => [c.id, c]));
