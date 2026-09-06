import type { CommerceAdapter } from './types';
import { localAdapter } from './local/adapter';

/**
 * One place decides where the shop's data comes from. Today it is the local
 * adapter reading src/data. Point COMMERCE_ADAPTER at something else and the
 * rest of the application does not notice.
 */
export const commerce: CommerceAdapter = localAdapter;

export type { CommerceAdapter, ProductQuery, ProductPage, Facets, SortKey } from './types';
