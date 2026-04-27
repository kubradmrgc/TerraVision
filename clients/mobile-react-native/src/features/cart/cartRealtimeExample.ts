import { realtimeService } from '../../services/realtimeService';
import { CartChangedEvent } from '../../types/realtime';

export async function startCartRealtime(
  onCartChanged: (event: CartChangedEvent) => void
): Promise<() => Promise<void>> {
  await realtimeService.connect();
  const unsubscribe = realtimeService.onCartChanged(onCartChanged);

  return async () => {
    unsubscribe();
    await realtimeService.disconnect();
  };
}
