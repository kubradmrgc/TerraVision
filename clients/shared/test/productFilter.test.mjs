import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_PRODUCT_SORT,
  EMPTY_PRODUCT_FILTER,
  PRODUCT_SORT_OPTIONS,
  filterAndSortProducts,
  isProductFilterActive,
  matchesProductFilter,
  matchesProductSearch,
  normalizeSearchText
} from '../src/commerce/productFilter.ts';

function product(overrides) {
  return {
    id: 1,
    name: 'Monstera Deliciosa',
    description: 'İç mekan bitkisi',
    price: 250,
    stockQuantity: 8,
    minStockLevel: 2,
    sku: 'MON-001',
    imageUrl: '',
    isArCompatible: false,
    categoryId: 1,
    ...overrides
  };
}

const catalog = [
  product({ id: 1, name: 'Monstera Deliciosa', price: 250, stockQuantity: 8, categoryId: 1, sku: 'MON-001', isArCompatible: true }),
  product({ id: 2, name: 'Lavanta Saksısı', price: 90, stockQuantity: 0, categoryId: 2, sku: 'LAV-002', description: 'Mis kokulu' }),
  product({ id: 3, name: 'Fiddle Leaf Fig', price: 420, stockQuantity: 3, categoryId: 1, sku: 'FIG-003' })
];

describe('productFilter', () => {
  it('normalizeSearchText trims and lowercases', () => {
    assert.equal(normalizeSearchText('  Monstera '), 'monstera');
    assert.equal(normalizeSearchText(null), '');
  });

  it('matchesProductSearch checks name, description and sku', () => {
    const p = product({ name: 'Lavanta', description: 'Mis kokulu', sku: 'LAV-002' });
    assert.equal(matchesProductSearch(p, 'lavanta'), true);
    assert.equal(matchesProductSearch(p, 'kokulu'), true);
    assert.equal(matchesProductSearch(p, 'lav-002'), true);
    assert.equal(matchesProductSearch(p, 'orkide'), false);
    assert.equal(matchesProductSearch(p, ''), true);
  });

  it('matchesProductFilter applies category, ar and stock constraints', () => {
    const p = product({ categoryId: 1, isArCompatible: true, stockQuantity: 5 });
    assert.equal(matchesProductFilter(p, { categoryId: 2 }), false);
    assert.equal(matchesProductFilter(p, { categoryId: 1 }), true);
    assert.equal(matchesProductFilter(p, { arOnly: true }), true);
    assert.equal(matchesProductFilter(product({ isArCompatible: false }), { arOnly: true }), false);
    assert.equal(matchesProductFilter(product({ stockQuantity: 0 }), { inStockOnly: true }), false);
  });

  it('filterAndSortProducts filters by search + in stock', () => {
    const result = filterAndSortProducts(catalog, { search: 'fig', inStockOnly: true });
    assert.deepEqual(result.map((x) => x.id), [3]);
  });

  it('filterAndSortProducts sorts by price ascending and descending', () => {
    assert.deepEqual(filterAndSortProducts(catalog, { sort: 'price-asc' }).map((x) => x.id), [2, 1, 3]);
    assert.deepEqual(filterAndSortProducts(catalog, { sort: 'price-desc' }).map((x) => x.id), [3, 1, 2]);
  });

  it('filterAndSortProducts keeps server order for relevance and does not mutate input', () => {
    const snapshot = catalog.map((x) => x.id);
    const result = filterAndSortProducts(catalog, { sort: 'relevance' });
    assert.deepEqual(result.map((x) => x.id), [1, 2, 3]);
    assert.deepEqual(catalog.map((x) => x.id), snapshot);
  });

  it('isProductFilterActive reflects active constraints', () => {
    assert.equal(isProductFilterActive(EMPTY_PRODUCT_FILTER), false);
    assert.equal(isProductFilterActive({ search: 'a' }), true);
    assert.equal(isProductFilterActive({ categoryId: 3 }), true);
    assert.equal(isProductFilterActive({ sort: 'price-asc' }), true);
    assert.equal(isProductFilterActive({ sort: DEFAULT_PRODUCT_SORT }), false);
  });

  it('exposes a stable set of sort options', () => {
    assert.deepEqual(
      PRODUCT_SORT_OPTIONS.map((x) => x.key),
      ['relevance', 'price-asc', 'price-desc', 'name-asc', 'stock-desc']
    );
  });
});
