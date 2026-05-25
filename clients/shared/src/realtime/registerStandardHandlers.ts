import type { HubConnection } from '@microsoft/signalr';
import { SIGNALR_EVENTS } from '../apiContract';
import type { ArSessionCreatedEvent } from '../types/ar';
import type {
  ExchangeOfferReceivedEvent,
  ExchangeOfferStatusChangedEvent,
  ExchangeProductListedEvent
} from '../types/exchange';
import type {
  CartAbandonedEvent,
  CartChangedEvent,
  OrderCreatedEvent,
  OrderStatusChangedEvent,
  ProductLowStockEvent
} from '../types/realtime';

export interface StandardHubHandlerCallbacks {
  onCartChanged?: (event: CartChangedEvent) => void;
  onCartAbandoned?: (event: CartAbandonedEvent) => void;
  onOrderCreated?: (event: OrderCreatedEvent) => void;
  onOrderStatusChanged?: (event: OrderStatusChangedEvent) => void;
  onArSessionCreated?: (event: ArSessionCreatedEvent) => void;
  onProductLowStock?: (event: ProductLowStockEvent) => void;
  onExchangeOfferReceived?: (event: ExchangeOfferReceivedEvent) => void;
  onExchangeOfferStatusChanged?: (event: ExchangeOfferStatusChangedEvent) => void;
  onExchangeProductListed?: (event: ExchangeProductListedEvent) => void;
}

export function registerStandardHubHandlers(
  connection: HubConnection,
  callbacks: StandardHubHandlerCallbacks
): void {
  if (callbacks.onCartChanged) {
    connection.on(SIGNALR_EVENTS.cartChanged, callbacks.onCartChanged);
  }
  if (callbacks.onCartAbandoned) {
    connection.on(SIGNALR_EVENTS.cartAbandoned, callbacks.onCartAbandoned);
  }
  if (callbacks.onOrderCreated) {
    connection.on(SIGNALR_EVENTS.orderCreated, callbacks.onOrderCreated);
  }
  if (callbacks.onOrderStatusChanged) {
    connection.on(SIGNALR_EVENTS.orderStatusChanged, callbacks.onOrderStatusChanged);
  }
  if (callbacks.onArSessionCreated) {
    connection.on(SIGNALR_EVENTS.arSessionCreated, callbacks.onArSessionCreated);
  }
  if (callbacks.onProductLowStock) {
    connection.on(SIGNALR_EVENTS.productLowStock, callbacks.onProductLowStock);
  }
  if (callbacks.onExchangeOfferReceived) {
    connection.on(SIGNALR_EVENTS.exchangeOfferReceived, callbacks.onExchangeOfferReceived);
  }
  if (callbacks.onExchangeOfferStatusChanged) {
    connection.on(SIGNALR_EVENTS.exchangeOfferStatusChanged, callbacks.onExchangeOfferStatusChanged);
  }
  if (callbacks.onExchangeProductListed) {
    connection.on(SIGNALR_EVENTS.exchangeProductListed, callbacks.onExchangeProductListed);
  }
}
