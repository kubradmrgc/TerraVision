import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { dealBadgeLabel, formatTryCurrency } from '@terravision/shared';
import type { ProductDto } from '../../types/product';
import { API_BASE_URL } from '../../config/env';
import type { MobilePalette } from '../app/types';

type Props = {
  item: ProductDto;
  palette: MobilePalette;
  compact?: boolean;
  onPress: () => void;
  onAddToCart: () => void;
};

function resolveImage(path: string): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

export function MarketplaceProductCard({
  item,
  palette,
  compact = false,
  onPress,
  onAddToCart
}: Props): React.JSX.Element {
  const [imageFailed, setImageFailed] = useState(false);
  const badge = dealBadgeLabel(item);
  const inStock = item.stockQuantity > 0;
  const showImage = Boolean(item.imageUrl?.trim()) && !imageFailed;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        compact && styles.cardCompact,
        { backgroundColor: palette.elevatedSurface, borderColor: palette.outlineVariant }
      ]}
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={item.name}
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
        {badge ? (
          <View style={[styles.badge, { backgroundColor: palette.button }]}>
            <Text style={[styles.badgeText, { color: palette.buttonText }]}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <Text style={[styles.name, { color: palette.text }]} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: palette.brandTitle }]}>{formatTryCurrency(item.price)}</Text>
          {item.compareAtPrice != null && item.compareAtPrice > item.price ? (
            <Text style={[styles.compare, { color: palette.subText }]}>{formatTryCurrency(item.compareAtPrice)}</Text>
          ) : null}
        </View>
        <TouchableOpacity
          style={[
            styles.cta,
            { backgroundColor: palette.productCtaBg, borderColor: palette.productCtaBorder },
            !inStock && styles.ctaDisabled
          ]}
          disabled={!inStock}
          onPress={(e) => {
            e.stopPropagation?.();
            onAddToCart();
          }}
        >
          <Text style={[styles.ctaText, { color: palette.productCtaFg }]}>{inStock ? '+ Sepet' : 'Tükendi'}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
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
  cardCompact: { width: 168, flex: 0, marginRight: 12 },
  imageWrap: { height: 140, position: 'relative' },
  image: { width: '100%', height: '100%' },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  badgeText: { fontSize: 11, fontWeight: '800' },
  body: { padding: 10 },
  name: { fontSize: 13, fontWeight: '600', lineHeight: 18, minHeight: 36 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  price: { fontSize: 15, fontWeight: '700' },
  compare: { fontSize: 12, textDecorationLine: 'line-through' },
  cta: {
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 8,
    alignItems: 'center'
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { fontSize: 12, fontWeight: '700' }
});
