import type { CareCatalogPlantDto, PlantCareCalendarDto } from '../types/care';
import type { ProductDto } from '../types/product';

/** Category ids 1–2 = indoor/outdoor plants (matches API PlantCareRules). */
const PLANT_CATEGORY_IDS = new Set([1, 2]);

export function productQualifiesForCareCatalog(product: ProductDto): boolean {
  return (
    PLANT_CATEGORY_IDS.has(product.categoryId) ||
    (product.wateringIntervalDays ?? 0) > 0 ||
    (product.fertilizingIntervalDays ?? 0) > 0 ||
    (product.cleaningIntervalDays ?? 0) > 0
  );
}

export function mapProductsToCareCatalog(
  products: ProductDto[],
  gardenPlants: PlantCareCalendarDto[] = []
): CareCatalogPlantDto[] {
  const inGarden = new Set(gardenPlants.map((p) => p.productId));
  return products
    .filter(productQualifiesForCareCatalog)
    .map((p) => ({
      id: p.id,
      name: p.name,
      careInstructions: p.careInstructions ?? null,
      wateringIntervalDays: p.wateringIntervalDays ?? null,
      fertilizingIntervalDays: p.fertilizingIntervalDays ?? null,
      cleaningIntervalDays: p.cleaningIntervalDays ?? null,
      isInMyGarden: inGarden.has(p.id)
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
}
