import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import type { OrderDto } from '../../types/order';
import { getOrderStatusLabel } from '../../theme/mobileTheme';
import { StateMessage } from '../../ui/StateMessage';

type Props = {
  orders: OrderDto[];
  palette: { card: string; text: string; border: string };
  isLoading: boolean;
  errorMessage: string | null;
};

export function OrdersSection({ orders, palette, isLoading, errorMessage }: Props): React.JSX.Element {
  return (
    <>
      <Text style={[styles.title, { color: palette.text }]}>My Orders</Text>
      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        {isLoading ? (
          <StateMessage text="Siparisler yukleniyor..." />
        ) : errorMessage ? (
          <StateMessage tone="error" text={errorMessage} />
        ) : orders.length === 0 ? (
          <StateMessage text="Henuz siparisiniz yok. Sepetten siparis olusturdugunuzda burada listelenecek." />
        ) : (
          orders.map((order) => (
            <View key={order.id} style={[styles.orderRow, { borderColor: palette.border }]}>
              <Text style={[styles.orderTitle, { color: palette.text }]}>#{order.id}</Text>
              <Text style={[styles.eventText, { color: palette.text }]}>
                Durum: {getOrderStatusLabel(order.status)}
              </Text>
              <Text style={[styles.eventText, { color: palette.text }]}>Toplam: {order.totalAmount} TL</Text>
            </View>
          ))
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  card: { backgroundColor: 'white', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  orderRow: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 8 },
  orderTitle: { fontSize: 14, fontWeight: '800', marginBottom: 3 },
  eventText: { fontSize: 13, marginBottom: 3 }
});
