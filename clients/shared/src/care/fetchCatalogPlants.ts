import axios from 'axios';
import type { CareCatalogPlantDto, PlantCareCalendarDto } from '../types/care';
import type { ProductDto } from '../types/product';
import { mapProductsToCareCatalog } from './catalogFromProducts';

export type CareCatalogSource = 'care-api' | 'products-fallback';

export type CareCatalogLoadResult = {
  plants: CareCatalogPlantDto[];
  source: CareCatalogSource;
};

function shouldUseProductsFallback(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return true;
  }
  const status = error.response?.status;
  if (status === 401) {
    return false;
  }
  return true;
}

/**
 * Loads care catalog from the care API, falling back to the public product list when
 * the care endpoint is missing or unavailable (older API builds, transient errors).
 */
export async function fetchCareCatalogWithFallback(options: {
  fetchCatalog: () => Promise<CareCatalogPlantDto[]>;
  fetchProducts: () => Promise<ProductDto[]>;
  gardenPlants?: PlantCareCalendarDto[];
}): Promise<CareCatalogLoadResult> {
  const gardenPlants = options.gardenPlants ?? [];

  try {
    const plants = await options.fetchCatalog();
    if (plants.length > 0) {
      return { plants, source: 'care-api' };
    }
    const fromProducts = mapProductsToCareCatalog(await options.fetchProducts(), gardenPlants);
    if (fromProducts.length > 0) {
      return { plants: fromProducts, source: 'products-fallback' };
    }
    return { plants, source: 'care-api' };
  } catch (error) {
    if (!shouldUseProductsFallback(error)) {
      throw error;
    }
    const fromProducts = mapProductsToCareCatalog(await options.fetchProducts(), gardenPlants);
    return { plants: fromProducts, source: 'products-fallback' };
  }
}
