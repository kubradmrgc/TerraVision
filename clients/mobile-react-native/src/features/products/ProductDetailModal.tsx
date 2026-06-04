import React, { useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { dealBadgeLabel, formatTryCurrency } from '@terravision/shared';
import type { ProductDto } from '../../types/product';
import { API_BASE_URL } from '../../config/env';
import type { MobilePalette } from '../app/types';

type Props = {
  product: ProductDto | null;
  visible: boolean;
  onClose: () => void;
  palette: MobilePalette;
  onAddToCart: (productId: number) => void;
  onPreviewAr?: (productId: number) => void;
};

function resolveProductImageUrl(path: string): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

function careRows(product: ProductDto): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  if (product.wateringIntervalDays) {
    rows.push({ label: 'Sulama', value: `${product.wateringIntervalDays} günde bir` });
  }
  if (product.fertilizingIntervalDays) {
    rows.push({ label: 'Gübreleme', value: `${product.fertilizingIntervalDays} günde bir` });
  }
  if (product.cleaningIntervalDays) {
    rows.push({ label: 'Temizlik', value: `${product.cleaningIntervalDays} günde bir` });
  }
  return rows;
}

export function ProductDetailModal({
  product,
  visible,
  onClose,
  palette,
  onAddToCart,
  onPreviewAr
}: Props): React.JSX.Element {
  const [imageFailed, setImageFailed] = useState(false);

  const inStock = product ? product.stockQuantity > 0 : false;
  const care = product ? careRows(product) : [];
  const showImage = Boolean(product?.imageUrl?.trim()) && !imageFailed;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.45)' }]}>
        <View style={[styles.sheet, { backgroundColor: palette.surfaceLowest, borderColor: palette.outlineVariant }]}>
          <View style={[styles.header, { borderBottomColor: palette.outlineVariant }]}>
            <Text style={[styles.title, { color: palette.text }]} numberOfLines={2}>
              {product?.name ?? 'Ürün detayı'}
            </Text>
            <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Kapat">
              <Text style={{ color: palette.subText, fontSize: 22 }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
            {!product ? (
              <Text style={{ color: palette.subText }}>Ürün bulunamadı.</Text>
            ) : (
              <>
                <View style={[styles.imageWrap, { backgroundColor: palette.surfaceDim }]}>
                  {showImage ? (
                    <Image
                      source={{ uri: resolveProductImageUrl(product.imageUrl) }}
                      style={styles.image}
                      resizeMode="cover"
                      onError={() => setImageFailed(true)}
                    />
                  ) : (
                    <View style={[styles.imageFallback, { backgroundColor: palette.imagePlaceholder }]}>
                      <Text style={{ color: palette.subText }}>Görsel yok</Text>
                    </View>
                  )}
                </View>

                {dealBadgeLabel(product) ? (
                  <View style={[styles.promoBadge, { backgroundColor: palette.button }]}>
                    <Text style={{ color: palette.buttonText, fontWeight: '800', fontSize: 12 }}>
                      {dealBadgeLabel(product)}
                    </Text>
                  </View>
                ) : null}
                <Text style={[styles.price, { color: palette.brandTitle }]}>{formatTryCurrency(product.price)}</Text>
                {product.compareAtPrice != null && product.compareAtPrice > product.price ? (
                  <Text style={[styles.compare, { color: palette.subText }]}>{formatTryCurrency(product.compareAtPrice)}</Text>
                ) : null}
                <Text style={[styles.stock, { color: palette.subText }]}>
                  {inStock ? `Stok: ${product.stockQuantity} adet` : 'Stokta yok'}
                  {product.sku ? ` · SKU: ${product.sku}` : ''}
                </Text>

                <Text style={[styles.sectionLabel, { color: palette.text }]}>Açıklama</Text>
                <Text style={[styles.bodyText, { color: palette.subText }]}>
                  {product.description?.trim() ? product.description : 'Açıklama eklenmemiş.'}
                </Text>

                {care.length > 0 || product.careInstructions?.trim() ? (
                  <>
                    <Text style={[styles.sectionLabel, { color: palette.text }]}>Bakım</Text>
                    {care.map((row) => (
                      <Text key={row.label} style={[styles.bodyText, { color: palette.subText }]}>
                        {`${row.label}: ${row.value}`}
                      </Text>
                    ))}
                    {product.careInstructions?.trim() ? (
                      <Text style={[styles.bodyText, { color: palette.subText }]}>{product.careInstructions}</Text>
                    ) : null}
                  </>
                ) : null}

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      { backgroundColor: palette.button },
                      !inStock && styles.disabled
                    ]}
                    disabled={!inStock}
                    onPress={() => onAddToCart(product.id)}
                  >
                    <Text style={{ color: palette.buttonText, fontWeight: '700' }}>Sepete ekle</Text>
                  </TouchableOpacity>
                  {product.isArCompatible && onPreviewAr ? (
                    <TouchableOpacity
                      style={[styles.secondaryBtn, { borderColor: palette.outlineVariant }]}
                      onPress={() => onPreviewAr(product.id)}
                    >
                      <Text style={{ color: palette.brandTitle, fontWeight: '600' }}>AR'da görüntüle</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    height: '88%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    overflow: 'hidden'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12
  },
  title: { flex: 1, fontSize: 18, fontWeight: '600' },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 32 },
  imageWrap: { height: 200, borderRadius: 12, overflow: 'hidden', marginBottom: 16 },
  image: { width: '100%', height: '100%' },
  imageFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  promoBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginBottom: 8 },
  price: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  compare: { fontSize: 15, textDecorationLine: 'line-through', marginBottom: 6 },
  stock: { fontSize: 13, marginBottom: 16 },
  sectionLabel: { fontSize: 15, fontWeight: '700', marginTop: 12, marginBottom: 6 },
  bodyText: { fontSize: 14, lineHeight: 21 },
  actions: { marginTop: 20, gap: 10 },
  primaryBtn: { minHeight: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  secondaryBtn: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  disabled: { opacity: 0.5 }
});
