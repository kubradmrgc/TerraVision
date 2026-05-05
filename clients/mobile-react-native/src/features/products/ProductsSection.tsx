import React from 'react';
import { FlatList, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import type { ProductDto } from '../../types/product';
import type { UploadFileInput } from '../../services/mediaService';
import { StateMessage } from '../../ui/StateMessage';

type Props = {
  products: ProductDto[];
  isAdmin: boolean;
  arPendingProducts: ProductDto[];
  selectedUploadProductId: number | null;
  selectedUploadFile: UploadFileInput | null;
  canUploadArModel: boolean;
  palette: {
    card: string;
    text: string;
    subText: string;
    border: string;
    button: string;
    buttonText: string;
    mutedCard: string;
  };
  onAddToCart: (productId: number) => void;
  onPreviewAr: (productId: number) => void;
  onPickArFile: () => void;
  onUploadArModel: () => void;
  onSelectUploadProduct: (value: number | null) => void;
};

export function ProductsSection(props: Props): React.JSX.Element {
  return (
    <>
      <Text style={[styles.title, { color: props.palette.text }]}>Products</Text>
      {props.products.length === 0 ? (
        <StateMessage text="Urun bulunamadi." color={props.palette.subText} />
      ) : (
        <FlatList
          data={props.products}
          scrollEnabled={false}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: props.palette.card }]}>
              <Text style={[styles.cardTitle, { color: props.palette.text }]}>{item.name}</Text>
              <Text style={{ color: props.palette.subText }}>{item.price} TL</Text>
              <View style={[styles.badge, { backgroundColor: props.palette.mutedCard, borderColor: props.palette.border }]}>
                <Text style={[styles.badgeText, { color: props.palette.subText }]}>
                  {item.isArCompatible ? 'AR Ready' : 'AR Pending'}
                </Text>
              </View>
              <TouchableOpacity style={[styles.button, { backgroundColor: props.palette.button }]} onPress={() => props.onAddToCart(item.id)}>
                <Text style={[styles.buttonText, { color: props.palette.buttonText }]}>Add To Cart</Text>
              </TouchableOpacity>
              {item.isArCompatible && (
                <TouchableOpacity style={[styles.secondaryButton, { borderColor: props.palette.border }]} onPress={() => props.onPreviewAr(item.id)}>
                  <Text style={[styles.secondaryButtonText, { color: props.palette.text }]}>View In AR</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}
      {props.isAdmin && (
        <>
          <Text style={[styles.title, { color: props.palette.text }]}>Admin AR Model Upload</Text>
          <View style={[styles.card, { backgroundColor: props.palette.card, borderColor: props.palette.border }]}>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={props.selectedUploadProductId} onValueChange={props.onSelectUploadProduct}>
                {props.arPendingProducts.map((product) => (
                  <Picker.Item key={product.id} label={`${product.name} (#${product.id}) - AR pending`} value={product.id} />
                ))}
              </Picker>
            </View>
            {props.arPendingProducts.length === 0 && (
              <StateMessage text="AR modeli bekleyen urun yok. Tum urunler baglanmis gorunuyor." />
            )}
            <TouchableOpacity
              style={[styles.secondaryButton, props.arPendingProducts.length === 0 && styles.buttonDisabled]}
              disabled={props.arPendingProducts.length === 0}
              onPress={props.onPickArFile}
            >
              <Text style={styles.secondaryButtonText}>Pick AR Model File</Text>
            </TouchableOpacity>
            <Text style={[styles.eventText, { color: props.palette.subText }]}>
              {props.selectedUploadFile ? `Selected: ${props.selectedUploadFile.name}` : 'No file selected'}
            </Text>
            <TouchableOpacity
              style={[styles.button, !props.canUploadArModel && styles.buttonDisabled]}
              disabled={!props.canUploadArModel}
              onPress={props.onUploadArModel}
            >
              <Text style={styles.buttonText}>Upload And Bind Model</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  card: { backgroundColor: 'white', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  cardTitle: { fontWeight: '700', fontSize: 16, marginBottom: 4 },
  badge: { borderWidth: 1, borderRadius: 999, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, marginTop: 6 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  button: { backgroundColor: '#2f7d32', paddingVertical: 11, paddingHorizontal: 12, borderRadius: 12, marginTop: 8 },
  buttonText: { color: 'white', fontWeight: '600', textAlign: 'center' },
  secondaryButton: { borderWidth: 1, borderColor: '#2f7d32', borderRadius: 10, paddingVertical: 8, marginBottom: 10 },
  secondaryButtonText: { color: '#2f7d32', fontWeight: '600', textAlign: 'center' },
  pickerContainer: { borderWidth: 1, borderColor: '#d0d0d0', borderRadius: 8, marginBottom: 10, overflow: 'hidden' },
  eventText: { fontSize: 13, marginBottom: 6, color: '#1f2937' },
  buttonDisabled: { backgroundColor: '#9fb89f' }
});
