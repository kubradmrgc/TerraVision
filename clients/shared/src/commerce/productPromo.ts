import type { ProductDto } from '../types/product';

export function isPromoScheduleActive(
  startsAtUtc?: string | null,
  endsAtUtc?: string | null,
  now: Date = new Date()
): boolean {
  const t = now.getTime();
  if (startsAtUtc) {
    const start = new Date(startsAtUtc).getTime();
    if (!Number.isNaN(start) && t < start) return false;
  }
  if (endsAtUtc) {
    const end = new Date(endsAtUtc).getTime();
    if (!Number.isNaN(end) && t > end) return false;
  }
  return true;
}

export function productDiscountPercent(product: ProductDto): number | null {
  const list = product.compareAtPrice;
  if (list == null || list <= product.price || list <= 0) return null;
  return Math.round((1 - product.price / list) * 100);
}

export function isDealProduct(product: ProductDto, now: Date = new Date()): boolean {
  if (!isPromoScheduleActive(product.promoStartsAtUtc, product.promoEndsAtUtc, now)) {
    return false;
  }
  if (product.compareAtPrice != null && product.compareAtPrice > product.price) {
    return true;
  }
  return Boolean(product.promoLabel?.trim());
}

export function dealBadgeLabel(product: ProductDto): string | null {
  const pct = productDiscountPercent(product);
  if (pct != null && pct > 0) return `%${pct}`;
  return product.promoLabel?.trim() || null;
}
