export const ORDER_STATUS_LABELS: Record<number, string> = {
  1: 'Pending',
  2: 'Confirmed',
  3: 'Shipped',
  4: 'Delivered',
  5: 'Cancelled'
};

export const getOrderStatusLabel = (status: number): string =>
  ORDER_STATUS_LABELS[status] ?? `Unknown(${status})`;
