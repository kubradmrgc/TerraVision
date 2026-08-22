const ORDER_STATUS_CLASS: Record<number, string> = {
  1: 'tv-order-status--pending',
  2: 'tv-order-status--confirmed',
  3: 'tv-order-status--shipped',
  4: 'tv-order-status--delivered',
  5: 'tv-order-status--cancelled'
};

const ORDER_STATUS_TR: Record<number, string> = {
  1: 'Beklemede',
  2: 'Onaylandı',
  3: 'Kargoda',
  4: 'Teslim edildi',
  5: 'İptal'
};

export function orderStatusLabelTr(status: number): string {
  return ORDER_STATUS_TR[status] ?? `Durum ${status}`;
}

export function AdminOrderStatusBadge({ status }: { status: number }) {
  return (
    <span className={`tv-order-status ${ORDER_STATUS_CLASS[status] ?? ''}`}>
      {orderStatusLabelTr(status)}
    </span>
  );
}
