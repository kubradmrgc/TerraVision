import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import type { CartDto } from '../../types/cart';
import { StateMessage } from '../../ui/StateMessage';

type Props = {
  cart: CartDto | null;
  palette: { card: string; text: string; border: string };
  onPlaceOrder: () => void;
  onClearCart: () => void;
  onDecrease: (productId: number, qty: number) => void;
  onIncrease: (productId: number, qty: number) => void;
  onRemove: (productId: number) => void;
};

export function CartSection(props: Props): React.JSX.Element {
  return (
    <>
      <Text style={[styles.title, { color: props.palette.text }]}>My Cart</Text>
      <View style={[styles.card, { backgroundColor: props.palette.card, borderColor: props.palette.border }]}>
        <Text style={styles.cardTitle}>Total: {props.cart?.totalAmount ?? 0} TL</Text>
        <TouchableOpacity style={styles.button} onPress={props.onPlaceOrder}>
          <Text style={styles.buttonText}>Place Order</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={props.onClearCart}>
          <Text style={styles.secondaryButtonText}>Clear Cart</Text>
        </TouchableOpacity>
        {(props.cart?.items ?? []).length === 0 && <StateMessage text="Sepetiniz bos." />}
        {(props.cart?.items ?? []).map((item) => (
          <View key={item.productId} style={styles.cartItemRow}>
            <Text style={styles.eventText}>
              {item.productName} x{item.quantity} = {item.lineTotal} TL
            </Text>
            <View style={styles.cartActions}>
              <TouchableOpacity style={styles.actionButton} onPress={() => props.onDecrease(item.productId, item.quantity)}>
                <Text style={styles.actionButtonText}>-</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => props.onIncrease(item.productId, item.quantity)}>
                <Text style={styles.actionButtonText}>+</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.removeButton} onPress={() => props.onRemove(item.productId)}>
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  card: { backgroundColor: 'white', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  cardTitle: { fontWeight: '700', fontSize: 16, marginBottom: 4 },
  button: { backgroundColor: '#2f7d32', paddingVertical: 11, paddingHorizontal: 12, borderRadius: 12, marginTop: 8 },
  buttonText: { color: 'white', fontWeight: '600', textAlign: 'center' },
  secondaryButton: { borderWidth: 1, borderColor: '#2f7d32', borderRadius: 10, paddingVertical: 8, marginBottom: 10 },
  secondaryButtonText: { color: '#2f7d32', fontWeight: '600', textAlign: 'center' },
  cartItemRow: { marginBottom: 8 },
  cartActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionButton: { backgroundColor: '#e5e7eb', borderRadius: 6, minWidth: 34, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  actionButtonText: { fontWeight: '700', color: '#111827' },
  removeButton: { backgroundColor: '#fee2e2', borderRadius: 6, paddingHorizontal: 10, justifyContent: 'center' },
  removeButtonText: { color: '#991b1b', fontWeight: '600' },
  eventText: { fontSize: 13, marginBottom: 6, color: '#1f2937' }
});
