import {
  HubConnection,
  HubConnectionBuilder,
  HttpTransportType,
  LogLevel
} from '@microsoft/signalr';
import { SIGNALR_HUB_URL } from '../config/env';
import { tokenStore } from './tokenStore';
import { CartChangedEvent, OrderCreatedEvent, OrderStatusChangedEvent } from '../types/realtime';

type CartChangedHandler = (event: CartChangedEvent) => void;
type OrderCreatedHandler = (event: OrderCreatedEvent) => void;
type OrderStatusChangedHandler = (event: OrderStatusChangedEvent) => void;

class RealtimeService {
  private connection: HubConnection | null = null;
  private connecting = false;
  private cartChangedHandlers: CartChangedHandler[] = [];
  private orderCreatedHandlers: OrderCreatedHandler[] = [];
  private orderStatusChangedHandlers: OrderStatusChangedHandler[] = [];

  private createConnection(transport: HttpTransportType): HubConnection {
    const connection = new HubConnectionBuilder()
      .withUrl(SIGNALR_HUB_URL, {
        accessTokenFactory: async () => (await tokenStore.getToken()) ?? '',
        transport
      })
      .withAutomaticReconnect()
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
}

export const realtimeService = new RealtimeService();
