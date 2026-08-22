import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatTryCurrency } from '@terravision/shared';
import type { ProductDto } from '../../types/product';
import { API_BASE_URL } from '../../config/env';
import type { MobilePalette } from '../app/types';

type Props = {
  item: ProductDto;
  palette: MobilePalette;
  onPreviewAr: (productId: number) => void;
  onOpenDetail: (productId: number) => void;
};

function resolveImage(path: string): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

export function ArProductCard({
  item,
  palette,
  onPreviewAr,
  onOpenDetail
}: Props): React.JSX.Element {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(item.imageUrl?.trim()) && !imageFailed;
  const inStock = item.stockQuantity > 0;

  return (
    <View style={[styles.card, { backgroundColor: palette.elevatedSurface, borderColor: palette.outlineVariant }]}>
      <TouchableOpacity
        onPress={() => onOpenDetail(item.id)}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={`${item.name} detayı`}
      >
        <View style={[styles.imageWrap, { backgroundColor: palette.surfaceDim }]}>
          {showImage ? (
            <Image
              source={{ uri: resolveImage(item.imageUrl) }}
              style={styles.image}
              resizeMode="cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <View style={[styles.fallback, { backgroundColor: palette.imagePlaceholder }]}>
              <Text style={{ color: palette.subText, fontWeight: '700' }}>{item.name.charAt(0)}</Text>
            </View>
          )}
          <View style={[styles.arBadge, { backgroundColor: palette.arPillBg, borderColor: palette.arPillBorder }]}>
            <Text style={[styles.arBadgeText, { color: palette.arPillText }]}>AR uyumlu</Text>
          </View>
        </View>
        <View style={styles.body}>
          <Text style={[styles.name, { color: palette.text }]} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={[styles.price, { color: palette.brandTitle }]}>{formatTryCurrency(item.price)}</Text>
          {!inStock ? (
            <Text style={[styles.stockHint, { color: palette.subText }]}>Stokta yok — AR yine de denenebilir</Text>
          ) : null}
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.arBtn, { backgroundColor: palette.button }]}
        onPress={() => onPreviewAr(item.id)}
        accessibilityRole="button"
        accessibilityLabel={`${item.name} AR önizleme`}
      >
        <Text style={[styles.arBtnText, { color: palette.buttonText }]}>AR'da görüntüle</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12
  },
  imageWrap: { height: 140, position: 'relative' },
  image: { width: '100%', height: '100%' },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  arBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1
  },
  arBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  body: { paddingHorizontal: 10, paddingTop: 10 },
  name: { fontSize: 14, fontWeight: '700', lineHeight: 19, minHeight: 38 },
  price: { fontSize: 15, fontWeight: '700', marginTop: 4 },
  stockHint: { fontSize: 11, marginTop: 4 },
  arBtn: {
    margin: 10,
    marginTop: 8,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center'
  },
  arBtnText: { fontSize: 13, fontWeight: '800' }
});
