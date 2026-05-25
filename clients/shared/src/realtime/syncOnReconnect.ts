/**
 * TanStack Query keys refreshed after SignalR reconnects (events missed while offline).
 */
export const REALTIME_RECONNECT_QUERY_KEYS = [
  ['cart'],
  ['orders'],
  ['products'],
  ['appointments'],
  ['care']
] as const;

export type RealtimeReconnectInvalidate = (filters: {
  queryKey: readonly unknown[];
}) => void | Promise<void>;

/** Silently refetch commerce data that may have changed during a hub outage. */
export async function syncQueriesOnReconnect(invalidate: RealtimeReconnectInvalidate): Promise<void> {
  await Promise.all(
    REALTIME_RECONNECT_QUERY_KEYS.map((queryKey) =>
      Promise.resolve(invalidate({ queryKey: [...queryKey] }))
    )
  );
}
