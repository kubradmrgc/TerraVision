import type { HubConnection } from '@microsoft/signalr';

export type HubLifecycleCallbacks = {
  onReconnecting?: () => void;
  onReconnected?: () => void;
  onClose?: () => void;
};

/** Wires SignalR automatic-reconnect lifecycle hooks on a hub connection. */
export function wireHubLifecycle(connection: HubConnection, callbacks: HubLifecycleCallbacks): void {
  if (callbacks.onReconnecting) {
    connection.onreconnecting(callbacks.onReconnecting);
  }
  if (callbacks.onReconnected) {
    connection.onreconnected(callbacks.onReconnected);
  }
  if (callbacks.onClose) {
    connection.onclose(callbacks.onClose);
  }
}
