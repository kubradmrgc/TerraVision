import { HubConnection, HubConnectionBuilder, HttpTransportType, LogLevel } from '@microsoft/signalr';
import { SIGNALR_EVENTS } from '@terravision/shared';
import { SIGNALR_HUB_URL } from '../config/env';
import { tokenStore } from './tokenStore';
import { CartChangedEvent, OrderCreatedEvent, OrderStatusChangedEvent } from '../types/realtime';

type CartChangedHandler = (event: CartChangedEvent) => void;
type OrderCreatedHandler = (event: OrderCreatedEvent) => void;
type OrderStatusChangedHandler = (event: OrderStatusChangedEvent) => void;

class RealtimeService {
  private connection: HubConnection | null = null;
  private connecting = false;
  private cartHandlers: CartChangedHandler[] = [];
  private orderCreatedHandlers: OrderCreatedHandler[] = [];
  private orderStatusChangedHandlers: OrderStatusChangedHandler[] = [];

  private createConnection(transport: HttpTransportType): HubConnection {
    const connection = new HubConnectionBuilder()
      .withUrl(SIGNALR_HUB_URL, {
        accessTokenFactory: () => tokenStore.getToken() ?? '',
        transport
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on(SIGNALR_EVENTS.cartChanged, (event: CartChangedEvent) => {
      this.cartHandlers.forEach((handler) => handler(event));
    });
    connection.on(SIGNALR_EVENTS.orderCreated, (event: OrderCreatedEvent) => {
      this.orderCreatedHandlers.forEach((handler) => handler(event));
    });
    connection.on(SIGNALR_EVENTS.orderStatusChanged, (event: OrderStatusChangedEvent) => {
      this.orderStatusChangedHandlers.forEach((handler) => handler(event));
    });

    return connection;
  }

  async connect(): Promise<void> {
    if (this.connection?.state === 'Connected' || this.connecting) {
      return;
    }
    this.connecting = true;

    try {
      if (this.connection) {
        await this.connection.stop();
      }

      // Prefer WebSockets, fallback to LongPolling when negotiate/start fails.
      this.connection = this.createConnection(HttpTransportType.WebSockets);
      try {
        await this.connection.start();
      } catch {
        await this.connection.stop();
        this.connection = this.createConnection(HttpTransportType.LongPolling);
        await this.connection.start();
      }
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
  }

  onCartChanged(handler: CartChangedHandler): () => void {
    this.cartHandlers.push(handler);
    return () => {
      this.cartHandlers = this.cartHandlers.filter((h) => h !== handler);
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
}

export const realtimeService = new RealtimeService();
