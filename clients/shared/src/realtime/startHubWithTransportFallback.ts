import { HubConnection, HttpTransportType } from '@microsoft/signalr';

/**
 * Prefer WebSockets; fall back to LongPolling when negotiate/start fails.
 */
export async function startHubWithTransportFallback(
  createConnection: (transport: HttpTransportType) => HubConnection
): Promise<HubConnection> {
  const webSockets = createConnection(HttpTransportType.WebSockets);
  try {
    await webSockets.start();
    return webSockets;
  } catch {
    await webSockets.stop().catch(() => undefined);
    const longPolling = createConnection(HttpTransportType.LongPolling);
    await longPolling.start();
    return longPolling;
  }
}
