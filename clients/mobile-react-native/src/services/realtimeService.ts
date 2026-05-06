import {
  HubConnection,
  HubConnectionBuilder,
  HttpTransportType,
  LogLevel
} from '@microsoft/signalr';
import { SIGNALR_HUB_URL } from '../config/env';
import { tokenStore } from './tokenStore';
import { CartChangedEvent, OrderCreatedEvent, OrderStatusChangedEvent } from '../types/realtime';
import {
  AUTOMATIC_RECONNECT_DELAYS_MS,
  INITIAL_CONNECT_MAX_ROUNDS,
  delayBeforeConnectRetry,
  sleep
} from './realtimePolicy';

type CartChangedHandler = (event: CartChangedEvent) => void;
type OrderCreatedHandler = (event: OrderCreatedEvent) => void;
type OrderStatusChangedHandler = (event: OrderStatusChangedEvent) => void;
export type RealtimeConnectionStatus = 'connecting' | 'connected' | 'degraded' | 'offline';
type StatusChangedHandler = (status: RealtimeConnectionStatus) => void;

class RealtimeService {
  private connection: HubConnection | null = null;
  private connecting = false;
  private cartChangedHandlers: CartChangedHandler[] = [];
  private orderCreatedHandlers: OrderCreatedHandler[] = [];
  private orderStatusChangedHandlers: OrderStatusChangedHandler[] = [];
  private statusHandlers: StatusChangedHandler[] = [];

  private emitStatus(status: RealtimeConnectionStatus) {
    this.statusHandlers.forEach((handler) => handler(status));
  }

  private createConnection(transport: HttpTransportType): HubConnection {
    const connection = new HubConnectionBuilder()
      .withUrl(SIGNALR_HUB_URL, {
        accessTokenFactory: async () => (await tokenStore.getToken()) ?? '',
        transport
      })
      .withAutomaticReconnect([...AUTOMATIC_RECONNECT_DELAYS_MS])
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on('cart.changed', (event: CartChangedEvent) => {
      this.cartChangedHandlers.forEach((handler) => handler(event));
    });
    connection.on('order.created', (event: OrderCreatedEvent) => {
      this.orderCreatedHandlers.forEach((handler) => handler(event));
    });
    connection.on('order.status.changed', (event: OrderStatusChangedEvent) => {
      this.orderStatusChangedHandlers.forEach((handler) => handler(event));
    });
    connection.onreconnecting(() => {
      this.emitStatus('degraded');
    });
    connection.onreconnected(() => {
      this.emitStatus('connected');
    });
    connection.onclose(() => {
      this.emitStatus('offline');
    });

    return connection;
  }

  private async stopAndClearConnection(): Promise<void> {
    const existing: HubConnection | null = this.connection;
    this.connection = null;
    if (!existing) {
      return;
    }
    await existing.stop().catch(() => undefined);
  }

  /**
   * Single attempt: WebSockets first, then LongPolling. Emits connected on success.
   * Throws if both transports fail to start.
   */
  private async startWithTransportFallback(): Promise<void> {
    this.connection = this.createConnection(HttpTransportType.WebSockets);
    try {
      await this.connection.start();
      this.emitStatus('connected');
      return;
    } catch {
      this.emitStatus('degraded');
      await this.connection.stop().catch(() => undefined);
      this.connection = this.createConnection(HttpTransportType.LongPolling);
      await this.connection.start();
      this.emitStatus('connected');
    }
  }

  async connect(): Promise<void> {
    if (this.connection?.state === 'Connected' || this.connecting) {
      return;
    }
    this.connecting = true;
    this.emitStatus('connecting');
    try {
      if (this.connection) {
        await this.connection.stop().catch(() => undefined);
      }
      this.connection = null;

      let lastError: unknown;
      for (let round = 0; round < INITIAL_CONNECT_MAX_ROUNDS; round += 1) {
        const pause = delayBeforeConnectRetry(round);
        if (pause > 0) {
          await sleep(pause);
          this.emitStatus('connecting');
        }
        try {
          await this.startWithTransportFallback();
          return;
        } catch (err) {
          lastError = err;
          this.emitStatus('degraded');
          await this.stopAndClearConnection();
        }
      }
      this.emitStatus('offline');
      throw lastError;
    } finally {
      this.connecting = false;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connection) {
      return;
    }

    await this.connection.stop();
    this.connection = null;
    this.emitStatus('offline');
  }

  onCartChanged(handler: CartChangedHandler): () => void {
    this.cartChangedHandlers.push(handler);

    return () => {
      this.cartChangedHandlers = this.cartChangedHandlers.filter((h) => h !== handler);
    };
  }

  onOrderCreated(handler: OrderCreatedHandler): () => void {
    this.orderCreatedHandlers.push(handler);

    return () => {
      this.orderCreatedHandlers = this.orderCreatedHandlers.filter((h) => h !== handler);
    };
  }

  onOrderStatusChanged(handler: OrderStatusChangedHandler): () => void {
    this.orderStatusChangedHandlers.push(handler);

    return () => {
      this.orderStatusChangedHandlers = this.orderStatusChangedHandlers.filter((h) => h !== handler);
    };
  }

  onStatusChanged(handler: StatusChangedHandler): () => void {
    this.statusHandlers.push(handler);
    return () => {
      this.statusHandlers = this.statusHandlers.filter((h) => h !== handler);
    };
  }
}

export const realtimeService = new RealtimeService();
