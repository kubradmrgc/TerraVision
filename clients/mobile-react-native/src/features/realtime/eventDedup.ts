type SeenStore = {
  has: (key: string) => boolean;
  add: (key: string) => void;
  delete: (key: string) => void;
};

export function pushUniqueEvent<T>(
  prev: T[],
  incoming: T,
  key: string,
  seen: SeenStore,
  order: string[],
  max = 25
): T[] {
  if (seen.has(key)) {
    return prev;
  }

  seen.add(key);
  order.push(key);

  const next = [incoming, ...prev].slice(0, max);
  while (order.length > max) {
    const oldest = order.shift();
    if (oldest) {
      seen.delete(oldest);
    }
  }

  return next;
}
