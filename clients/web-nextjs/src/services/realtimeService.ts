import { HubConnection } from '@microsoft/signalr';
import {
  AUTOMATIC_RECONNECT_DELAYS_MS,
  buildHubConnection,
  createHandlerRegistry,
  delayBeforeConnectRetry,
  INITIAL_CONNECT_MAX_ROUNDS,
  registerStandardHubHandlers,
  sleep,
  startHubWithTransportFallback,
  wireHubLifecycle
} from '@terravision/shared';
import { SIGNALR_HUB_URL } from '../config/env';
import { tokenStore } from './tokenStore';
import type {
  ChatMessageReceivedEvent,
  ExchangeOfferReceivedEvent,
  ExchangeOfferStatusChangedEvent,
  ExchangeProductListedEvent
} from '@terravision/shared';
import {
  ArSessionCreatedEvent,
  CartChangedEvent,
  OrderCreatedEvent,
  OrderStatusChangedEvent,
  ProductLowStockEvent
} from '../types/realtime';

export type RealtimeConnectionStatus = 'connecting' | 'connected' | 'degraded' | 'offline';

class RealtimeService {
  private connection: HubConnection | null = null;
  private connecting = false;
  private readonly cartHandlers = createHandlerRegistry<CartChangedEvent>();
  private readonly orderCreatedHandlers = createHandlerRegistry<OrderCreatedEvent>();
  private readonly orderStatusChangedHandlers = createHandlerRegistry<OrderStatusChangedEvent>();
  private readonly arSessionCreatedHandlers = createHandlerRegistry<ArSessionCreatedEvent>();
  private readonly productLowStockHandlers = createHandlerRegistry<ProductLowStockEvent>();
  private readonly exchangeOfferReceivedHandlers = createHandlerRegistry<ExchangeOfferReceivedEvent>();
  private readonly exchangeOfferStatusHandlers = createHandlerRegistry<ExchangeOfferStatusChangedEvent>();
  private readonly exchangeProductListedHandlers = createHandlerRegistry<ExchangeProductListedEvent>();
  private readonly chatMessageReceivedHandlers = createHandlerRegistry<ChatMessageReceivedEvent>();
  private readonly statusHandlers = createHandlerRegistry<RealtimeConnectionStatus>();
  private readonly reconnectedHandlers = createHandlerRegistry<void>();

  private emitStatus(status: RealtimeConnectionStatus): void {
    this.statusHandlers.emit(status);
  }

  private emitReconnected(): void {
    this.reconnectedHandlers.emit(undefined);
  }

  private createConnection(transport: Parameters<typeof buildHubConnection>[0]['transport']): HubConnection {
    const connection = buildHubConnection({
      hubUrl: SIGNALR_HUB_URL,
      transport,
      getAccessToken: () => tokenStore.getToken(),
      automaticReconnectDelays: AUTOMATIC_RECONNECT_DELAYS_MS,
      registerHandlers: (hub) => {
        registerStandardHubHandlers(hub, {
          onCartChanged: (event) => this.cartHandlers.emit(event),
          onOrderCreated: (event) => this.orderCreatedHandlers.emit(event),
          onOrderStatusChanged: (event) => this.orderStatusChangedHandlers.emit(event),
          onArSessionCreated: (event) => this.arSessionCreatedHandlers.emit(event),
          onProductLowStock: (event) => this.productLowStockHandlers.emit(event),
          onExchangeOfferReceived: (event) => this.exchangeOfferReceivedHandlers.emit(event),
          onExchangeOfferStatusChanged: (event) => this.exchangeOfferStatusHandlers.emit(event),
          onExchangeProductListed: (event) => this.exchangeProductListedHandlers.emit(event),
          onChatMessageReceived: (event) => this.chatMessageReceivedHandlers.emit(event)
        });
      }
    });

    wireHubLifecycle(connection, {
      onReconnecting: () => this.emitStatus('degraded'),
      onReconnected: () => {
        this.emitStatus('connected');
        this.emitReconnected();
      },
      onClose: () => this.emitStatus('offline')
    });

    return connection;
  }

  private async stopAndClearConnection(): Promise<void> {
    const existing = this.connection;
    this.connection = null;
    if (!existing) {
      return;
    }
    await existing.stop().catch(() => undefined);
  }

  private async startWithTransportFallback(): Promise<void> {
    this.connection = await startHubWithTransportFallback((transport) =>
      this.createConnection(transport)
    );
    this.emitStatus('connected');
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

  onCartChanged(handler: (event: CartChangedEvent) => void): () => void {
    return this.cartHandlers.add(handler);
  }

  onOrderCreated(handler: (event: OrderCreatedEvent) => void): () => void {
    return this.orderCreatedHandlers.add(handler);
  }

  onOrderStatusChanged(handler: (event: OrderStatusChangedEvent) => void): () => void {
    return this.orderStatusChangedHandlers.add(handler);
  }

  onArSessionCreated(handler: (event: ArSessionCreatedEvent) => void): () => void {
    return this.arSessionCreatedHandlers.add(handler);
  }

  onProductLowStock(handler: (event: ProductLowStockEvent) => void): () => void {
    return this.productLowStockHandlers.add(handler);
  }

  onExchangeOfferReceived(handler: (event: ExchangeOfferReceivedEvent) => void): () => void {
    return this.exchangeOfferReceivedHandlers.add(handler);
  }

  onExchangeOfferStatusChanged(handler: (event: ExchangeOfferStatusChangedEvent) => void): () => void {
    return this.exchangeOfferStatusHandlers.add(handler);
  }

  onExchangeProductListed(handler: (event: ExchangeProductListedEvent) => void): () => void {
    return this.exchangeProductListedHandlers.add(handler);
  }

  onChatMessageReceived(handler: (event: ChatMessageReceivedEvent) => void): () => void {
    return this.chatMessageReceivedHandlers.add(handler);
  }

  async joinChatSession(sessionId: number): Promise<void> {
    await this.connect();
    if (!this.connection) {
      throw new Error('SignalR bağlantısı yok.');
    }
    await this.connection.invoke('JoinChatSession', sessionId);
  }

  async leaveChatSession(sessionId: number): Promise<void> {
    if (!this.connection || this.connection.state !== 'Connected') {
      return;
    }
    await this.connection.invoke('LeaveChatSession', sessionId).catch(() => undefined);
  }

  onStatusChanged(handler: (status: RealtimeConnectionStatus) => void): () => void {
    return this.statusHandlers.add(handler);
  }

  /** Fires after SignalR automatic reconnect succeeds (sync REST data here). */
  onReconnected(handler: () => void): () => void {
    return this.reconnectedHandlers.add(handler);
  }
}

export const realtimeService = new RealtimeService();
