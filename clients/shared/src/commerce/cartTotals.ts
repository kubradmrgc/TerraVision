import type { CartDto, CartItemDto } from '../types/cart';

export type CartLineLike = Pick<CartItemDto, 'lineTotal' | 'quantity'>;

export function computeCartSubtotal(items: readonly CartLineLike[]): number {
  return items.reduce((sum, item) => sum + (item.lineTotal ?? 0), 0);
}

export function sumCartItemQuantity(items: readonly Pick<CartItemDto, 'quantity'>[]): number {
  return items.reduce((count, item) => count + item.quantity, 0);
}

export interface CartDisplayTotals {
  subtotal: number;
  logisticsFee: number;
  total: number;
  itemCount: number;
}

export interface CartDisplayTotalsOptions {
  logisticsFee?: number;
}

/**
 * Display totals for cart UI. Prefers API `totalAmount` when present (server source of truth).
 */
export function computeCartDisplayTotals(
  cart: Pick<CartDto, 'totalAmount' | 'items'> | null | undefined,
  options?: CartDisplayTotalsOptions
): CartDisplayTotals {
  const items = cart?.items ?? [];
  const subtotal = computeCartSubtotal(items);
  const logisticsFee = options?.logisticsFee ?? 0;
  const total = cart?.totalAmount ?? subtotal + logisticsFee;
  const itemCount = sumCartItemQuantity(items);

  return { subtotal, logisticsFee, total, itemCount };
}
