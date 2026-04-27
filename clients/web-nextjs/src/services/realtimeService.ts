import { HubConnection, HubConnectionBuilder, HttpTransportType, LogLevel } from '@microsoft/signalr';
import { SIGNALR_HUB_URL } from '../config/env';
import { tokenStore } from './tokenStore';
import { CartChangedEvent, OrderCreatedEvent, OrderStatusChangedEvent } from '../types/realtime';

type CartChangedHandler = (event: CartChangedEvent) => void;
type OrderCreatedHandler = (event: OrderCreatedEvent) => void;
type OrderStatusChangedHandler = (event: OrderStatusChangedEvent) => void;

class RealtimeService {
  private connection: HubConnection | null = null;
  private cartHandlers: CartChangedHandler[] = [];
  private orderCreatedHandlers: OrderCreatedHandler[] = [];
  private orderStatusChangedHandlers: OrderStatusChangedHandler[] = [];

  async connect(): Promise<void> {
    if (this.connection?.state === 'Connected') {
      return;
    }

    this.connection = new HubConnectionBuilder()
      .withUrl(SIGNALR_HUB_URL, {
        accessTokenFactory: () => tokenStore.getToken() ?? '',
        transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    this.connection.on('cart.changed', (event: CartChangedEvent) => {
      this.cartHandlers.forEach((handler) => handler(event));
    });
    this.connection.on('order.created', (event: OrderCreatedEvent) => {
      this.orderCreatedHandlers.forEach((handler) => handler(event));
    });
    this.connection.on('order.status.changed', (event: OrderStatusChangedEvent) => {
      this.orderStatusChangedHandlers.forEach((handler) => handler(event));
    });

    await this.connection.start();
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
