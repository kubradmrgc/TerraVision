/** Mirrors server `CartItemDto.LineTotal` / `OrderItemDto.LineTotal`. */
export function computeLineTotal(unitPrice: number, quantity: number): number {
  return unitPrice * quantity;
}
