export function formatCartActivityLabel(action: string): string {
  switch (action) {
    case 'added':
      return 'Sepete eklendi';
    case 'updated':
      return 'Miktar güncellendi';
    case 'removed':
      return 'Sepetten çıkarıldı';
    default:
      return 'Güncellendi';
  }
}

export function formatRelativeTimeTr(iso?: string): string {
  if (!iso?.trim()) {
    return 'Az önce';
  }
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) {
    return 'Yakın zamanda';
  }
  const diffSec = Math.floor((Date.now() - t) / 1000);
  if (diffSec < 60) {
    return 'Az önce';
  }
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `${diffMin} dk önce`;
  }
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) {
    return `${diffHr} sa önce`;
  }
  return new Date(t).toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}
