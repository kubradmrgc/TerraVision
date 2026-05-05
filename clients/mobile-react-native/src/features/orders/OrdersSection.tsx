import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import type { OrderDto } from '../../types/order';
import { getOrderStatusLabel } from '../../theme/mobileTheme';
import { StateMessage } from '../../ui/StateMessage';

type Props = {
  orders: OrderDto[];
  palette: { card: string; text: string; border: string };
};

export function OrdersSection({ orders, palette }: Props): React.JSX.Element {
  return (
    <>
      <Text style={[styles.title, { color: palette.text }]}>My Orders</Text>
      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        {orders.length === 0 ? (
          <StateMessage text="No orders yet." />
        ) : (
          orders.map((order) => (
            <Text key={order.id} style={styles.eventText}>
              #{order.id} status:{getOrderStatusLabel(order.status)} total:{order.totalAmount} TL
            </Text>
          ))
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  card: { backgroundColor: 'white', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  eventText: { fontSize: 13, marginBottom: 6, color: '#1f2937' }
});
