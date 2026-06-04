import assert from 'node:assert/strict';
import test from 'node:test';
import { fetchCareCatalogWithFallback } from '../src/care/fetchCatalogPlants.ts';

test('fetchCareCatalogWithFallback returns care API list when non-empty', async () => {
  const result = await fetchCareCatalogWithFallback({
    fetchCatalog: async () => [{ id: 1, name: 'A', careInstructions: null, wateringIntervalDays: 7, fertilizingIntervalDays: null, cleaningIntervalDays: null, isInMyGarden: false }],
    fetchProducts: async () => {
      throw new Error('should not call products');
    }
  });
  assert.equal(result.source, 'care-api');
  assert.equal(result.plants.length, 1);
});

test('fetchCareCatalogWithFallback uses products when care API is empty', async () => {
  const result = await fetchCareCatalogWithFallback({
    fetchCatalog: async () => [],
    fetchProducts: async () => [
      { id: 2, name: 'B', categoryId: 1, wateringIntervalDays: 5, fertilizingIntervalDays: null, cleaningIntervalDays: null, careInstructions: null }
    ],
    gardenPlants: []
  });
  assert.equal(result.source, 'products-fallback');
  assert.equal(result.plants[0].id, 2);
});

test('fetchCareCatalogWithFallback uses products on catalog failure', async () => {
  const result = await fetchCareCatalogWithFallback({
    fetchCatalog: async () => {
      throw new Error('catalog unavailable');
    },
    fetchProducts: async () => [
      { id: 3, name: 'C', categoryId: 2, wateringIntervalDays: 3, fertilizingIntervalDays: null, cleaningIntervalDays: null, careInstructions: null }
    ]
  });
  assert.equal(result.source, 'products-fallback');
  assert.equal(result.plants[0].name, 'C');
});
