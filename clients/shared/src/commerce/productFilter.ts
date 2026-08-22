import type { ProductDto } from '../types/product';

/**
 * Shared product search/filter/sort logic so web and mobile catalogs behave
 * identically. Operates purely on an in-memory product list (the catalog is
 * fetched in full and cached), keeping both clients synchronized without an
 * extra server round-trip.
 */

export type ProductSortKey = 'relevance' | 'price-asc' | 'price-desc' | 'name-asc' | 'stock-desc';

export interface ProductFilter {
  /** Free-text query matched against name, description and SKU. */
  search?: string;
  /** Restrict to a single category; `null`/`undefined` means all categories. */
  categoryId?: number | null;
  /** Only keep products flagged as AR compatible. */
  arOnly?: boolean;
  /** Only keep products with stock available. */
  inStockOnly?: boolean;
  /** Ordering applied after filtering. Defaults to `'relevance'`. */
  sort?: ProductSortKey;
}

export interface ProductSortOption {
  key: ProductSortKey;
  label: string;
}

/** Sort choices both clients render in the same order. */
export const PRODUCT_SORT_OPTIONS: readonly ProductSortOption[] = [
  { key: 'relevance', label: 'Önerilen' },
  { key: 'price-asc', label: 'Fiyat: Artan' },
  { key: 'price-desc', label: 'Fiyat: Azalan' },
  { key: 'name-asc', label: 'İsim: A → Z' },
  { key: 'stock-desc', label: 'Stok: Çok → Az' }
] as const;

export const DEFAULT_PRODUCT_SORT: ProductSortKey = 'relevance';

export const EMPTY_PRODUCT_FILTER: ProductFilter = {
  search: '',
  categoryId: null,
  arOnly: false,
  inStockOnly: false,
  sort: DEFAULT_PRODUCT_SORT
};

/** Lower-cases and trims; intentionally locale-agnostic for Hermes/web parity. */
export function normalizeSearchText(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

export function matchesProductSearch(product: ProductDto, normalizedTerm: string): boolean {
  if (!normalizedTerm) {
    return true;
  }
  const haystack = [product.name, product.description, product.sku]
    .map((field) => (field ?? '').toLowerCase())
    .join('\u0001');
  return haystack.includes(normalizedTerm);
}

/** True when a product passes every active (non-sort) filter constraint. */
export function matchesProductFilter(product: ProductDto, filter: ProductFilter): boolean {
  if (!matchesProductSearch(product, normalizeSearchText(filter.search))) {
    return false;
  }
  if (filter.categoryId != null && product.categoryId !== filter.categoryId) {
    return false;
  }
  if (filter.arOnly && !product.isArCompatible) {
    return false;
  }
  if (filter.inStockOnly && (product.stockQuantity ?? 0) <= 0) {
    return false;
  }
  return true;
}

function compareProducts(a: ProductDto, b: ProductDto, sort: ProductSortKey): number {
  switch (sort) {
    case 'price-asc':
      return (a.price ?? 0) - (b.price ?? 0);
    case 'price-desc':
      return (b.price ?? 0) - (a.price ?? 0);
    case 'name-asc':
      return (a.name ?? '').localeCompare(b.name ?? '', 'tr');
    case 'stock-desc':
      return (b.stockQuantity ?? 0) - (a.stockQuantity ?? 0);
    case 'relevance':
    default:
      return 0;
  }
}

/**
 * Returns a new, filtered and sorted array. The input list is never mutated.
 * `relevance` keeps the server-provided order (stable).
 */
export function filterAndSortProducts(products: ProductDto[], filter: ProductFilter = {}): ProductDto[] {
  const filtered = products.filter((product) => matchesProductFilter(product, filter));
  const sort = filter.sort ?? DEFAULT_PRODUCT_SORT;
  if (sort === 'relevance') {
    return filtered;
  }
  return [...filtered].sort((a, b) => compareProducts(a, b, sort));
}

/** True when the filter would narrow the catalog (used to show a "clear" affordance). */
export function isProductFilterActive(filter: ProductFilter): boolean {
  return (
    normalizeSearchText(filter.search).length > 0 ||
    filter.categoryId != null ||
    Boolean(filter.arOnly) ||
    Boolean(filter.inStockOnly) ||
    (filter.sort != null && filter.sort !== DEFAULT_PRODUCT_SORT)
  );
}
