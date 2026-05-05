import React from 'react';
import { FlatList, Text, StyleSheet } from 'react-native';
import { getOrderStatusLabel } from '../../theme/mobileTheme';
import type { CartChangedEvent, OrderCreatedEvent, OrderStatusChangedEvent } from '../../types/realtime';
import { StateMessage } from '../../ui/StateMessage';

type Props = {
  events: CartChangedEvent[];
  orderCreatedEvents: OrderCreatedEvent[];
  orderStatusEvents: OrderStatusChangedEvent[];
  textColor: string;
};

export function EventsSection(props: Props): React.JSX.Element {
  return (
    <>
      <Text style={[styles.title, { color: props.textColor }]}>Realtime Events</Text>
      {props.events.length === 0 ? (
        <StateMessage text="Realtime eventi henuz yok." />
      ) : (
        <FlatList
          data={props.events}
          scrollEnabled={false}
          keyExtractor={(_, idx) => String(idx)}
          renderItem={({ item }) => (
            <Text style={styles.eventText}>
              {item.action} product:{item.productId} qty:{item.quantity}
            </Text>
          )}
        />
      )}
      <Text style={[styles.title, { color: props.textColor }]}>Order Created Events</Text>
      <FlatList
        data={props.orderCreatedEvents}
        scrollEnabled={false}
        keyExtractor={(_, idx) => `oc-${idx}`}
        renderItem={({ item }) => (
          <Text style={styles.eventText}>
            order #{item.orderId} status:{getOrderStatusLabel(item.status)} total:{item.totalAmount}
          </Text>
        )}
      />
      <Text style={[styles.title, { color: props.textColor }]}>Order Status Events</Text>
      <FlatList
        data={props.orderStatusEvents}
        scrollEnabled={false}
        keyExtractor={(_, idx) => `os-${idx}`}
        renderItem={({ item }) => (
          <Text style={styles.eventText}>
            order #{item.orderId} {getOrderStatusLabel(item.previousStatus)}→{getOrderStatusLabel(item.newStatus)}
          </Text>
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  eventText: { fontSize: 13, marginBottom: 6, color: '#1f2937' }
});
