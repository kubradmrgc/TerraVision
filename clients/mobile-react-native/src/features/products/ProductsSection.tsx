import React, { useState } from 'react';
import {
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  type ListRenderItem
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import type { ProductDto } from '../../types/product';
import type { UploadFileInput } from '../../services/mediaService';
import type { MobilePalette } from '../app/types';
import { StateMessage } from '../../ui/StateMessage';
import { AR_UPLOAD_HELP_TEXT } from '../ar/arUploadValidation';

type Props = {
  products: ProductDto[];
  isAdmin: boolean;
  arPendingProducts: ProductDto[];
  selectedUploadProductId: number | null;
  selectedUploadFile: UploadFileInput | null;
  canUploadArModel: boolean;
  isArUploading: boolean;
  arUploadProgress: number;
  arUploadErrorMessage: string | null;
  arUploadSuccessMessage: string | null;
  palette: MobilePalette;
  onAddToCart: (productId: number) => void;
  onPreviewAr: (productId: number) => void;
  onPickArFile: () => void;
  onUploadArModel: () => void;
  onClearSelectedArFile: () => void;
  onSelectUploadProduct: (value: number | null) => void;
};

function formatPriceTry(value: number): string {
  try {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 }).format(value);
  } catch {
    return `${value} TL`;
  }
}

const LOW_STOCK_MAX = 5;

function ProductCard({
  item,
  palette,
  onAddToCart,
  onPreviewAr
}: {
  item: ProductDto;
  palette: MobilePalette;
  onAddToCart: (id: number) => void;
  onPreviewAr: (id: number) => void;
}): React.JSX.Element {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(item.imageUrl?.trim()) && !imageFailed;
  const price = typeof item.price === 'number' ? item.price : 0;
  const stockQty = typeof item.stockQuantity === 'number' ? item.stockQuantity : 0;
  const inStock = stockQty > 0;
  const lowStock = inStock && stockQty <= LOW_STOCK_MAX;

  const stockBadgeStyle = !inStock
    ? {
        backgroundColor: palette.mutedCard,
        borderColor: palette.outlineVariant,
        color: palette.subText,
        label: 'OUT OF STOCK'
      }
    : lowStock
      ? {
          backgroundColor: palette.stockLowPillBg,
          borderColor: palette.stockLowPillBorder,
          color: palette.stockLowPillText,
          label: `LOW STOCK (${stockQty})`
        }
      : {
          backgroundColor: palette.stockPillBg,
          borderColor: palette.stockPillBorder,
          color: palette.stockPillText,
          label: 'IN STOCK'
        };

  const addToCartOutline = palette.productUseOutlineAddToCart;

  return (
    <View
      style={[
        styles.productCard,
        { backgroundColor: palette.elevatedSurface, borderColor: palette.outlineVariant }
      ]}
    >
      <View style={[styles.imageWrap, { backgroundColor: palette.surfaceDim }]}>
        {showImage ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.productImage}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <View style={[styles.imageFallback, { backgroundColor: palette.imagePlaceholder }]}>
            <Text style={[styles.imageFallbackText, { color: palette.subText }]}>No image</Text>
          </View>
        )}
        <View style={styles.badgeStack}>
          {item.isArCompatible ? (
            <View
              style={[
                styles.badgeMint,
                { backgroundColor: palette.arPillBg, borderColor: palette.arPillBorder, borderWidth: 1 }
              ]}
            >
              <Text style={[styles.badgeMintText, { color: palette.arPillText }]}>AR Ready</Text>
            </View>
          ) : null}
          <View
            style={[
              styles.badgeStock,
              {
                backgroundColor: stockBadgeStyle.backgroundColor,
                borderColor: stockBadgeStyle.borderColor,
                borderWidth: 1
              }
            ]}
          >
            <Text style={[styles.badgeStockText, { color: stockBadgeStyle.color }]}>{stockBadgeStyle.label}</Text>
          </View>
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Text style={[styles.productName, { color: palette.text }]} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={[styles.productPrice, { color: palette.brandTitle }]}>{formatPriceTry(price)}</Text>
        </View>
        <Text style={[styles.productDesc, { color: palette.subText }]} numberOfLines={2}>
          {item.description?.trim() ? item.description : '—'}
        </Text>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.primaryCta,
              {
                backgroundColor: palette.productCtaBg,
                borderWidth: addToCartOutline ? 1 : 0,
                borderColor: addToCartOutline ? palette.productCtaBorder : 'transparent'
              }
            ]}
            onPress={() => onAddToCart(item.id)}
            accessibilityRole="button"
            accessibilityLabel={`Add ${item.name} to cart`}
          >
            <Text style={[styles.primaryCtaText, { color: palette.productCtaFg }]}>+ Add to cart</Text>
          </TouchableOpacity>
          {!addToCartOutline ? (
            <TouchableOpacity
              style={[styles.iconGhost, { borderColor: palette.outlineVariant }]}
              accessibilityRole="button"
              accessibilityLabel="Favorites placeholder"
              disabled
            >
              <Text style={[styles.heartIcon, { color: palette.subText }]}>♡</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {item.isArCompatible ? (
          <TouchableOpacity
            style={[styles.arLink, { borderColor: palette.outlineVariant, backgroundColor: palette.surfaceLowest }]}
            onPress={() => onPreviewAr(item.id)}
          >
            <Text style={[styles.arLinkText, { color: palette.brandTitle }]}>View in AR</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

export function ProductsSection(props: Props): React.JSX.Element {
  const { palette } = props;

  const renderItem: ListRenderItem<ProductDto> = ({ item }) => (
    <ProductCard item={item} palette={palette} onAddToCart={props.onAddToCart} onPreviewAr={props.onPreviewAr} />
  );

  return (
    <View style={styles.root}>
      {props.isAdmin && (
        <View
          style={[
            styles.adminCard,
            { backgroundColor: palette.mutedCard, borderColor: palette.outlineVariant }
          ]}
        >
          <View style={styles.adminTopBar}>
            <View style={styles.adminTitleBlock}>
              <Text style={[styles.sectionTitle, { color: palette.text }]}>AR Model Ingestion</Text>
              <Text style={[styles.adminSubtitle, { color: palette.subText }]}>
                Uploading spatial assets for field deployment
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.newAssetBtn, { backgroundColor: palette.primaryContainer }]}
              onPress={props.onPickArFile}
              disabled={props.arPendingProducts.length === 0}
            >
              <Text style={[styles.newAssetBtnText, { color: palette.onPrimaryContainer }]}>New asset</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.adminGrid}>
            <View style={[styles.adminCol, styles.adminColFirst]}>
              <Text style={[styles.caption, { color: palette.subText }]}>Upload AR model</Text>
              <TouchableOpacity
                style={[styles.dashedUpload, { borderColor: palette.outlineVariant, backgroundColor: palette.card }]}
                onPress={props.onPickArFile}
                disabled={props.arPendingProducts.length === 0}
                accessibilityRole="button"
                accessibilityLabel="Select AR model file"
              >
                <Text style={[styles.uploadGlyph, { color: palette.subText }]}>⬆</Text>
                <Text style={[styles.uploadHint, { color: palette.subText }]}>Tap to select (.usdz, .glb)</Text>
              </TouchableOpacity>
              <View style={[styles.pickerShell, { borderColor: palette.outlineVariant }]}>
                <Picker
                  selectedValue={props.selectedUploadProductId}
                  onValueChange={(v) => props.onSelectUploadProduct(Number(v))}
                >
                  {props.arPendingProducts.map((product) => (
                    <Picker.Item
                      key={product.id}
                      label={`${product.name} (#${product.id})`}
                      value={product.id}
                    />
                  ))}
                </Picker>
              </View>
            </View>
            <View style={[styles.adminCol, styles.adminColSecond]}>
              {props.arPendingProducts.length === 0 ? (
                <StateMessage text="AR modeli bekleyen urun yok." color={palette.subText} />
              ) : null}
              {props.selectedUploadFile ? (
                <Text style={[styles.fileName, { color: palette.text }]} numberOfLines={1}>
                  {props.selectedUploadFile.name}
                </Text>
              ) : null}
              {props.isArUploading ? (
                <>
                  <View style={styles.progressLabels}>
                    <Text style={[styles.bodyCompact, { color: palette.text }]}>Uploading</Text>
                    <Text style={[styles.caption, { color: palette.subText }]}>{props.arUploadProgress}%</Text>
                  </View>
                  <View style={[styles.progressTrack, { backgroundColor: palette.card }]}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.min(100, props.arUploadProgress)}%`, backgroundColor: palette.primaryContainer }
                      ]}
                    />
                  </View>
                  <Text style={[styles.caption, { color: palette.subText }]}>
                    Processing mesh for mobile visualization...
                  </Text>
                </>
              ) : (
                <Text style={[styles.caption, { color: palette.subText }]}>
                  {props.selectedUploadFile ? 'Ready to upload when you confirm below.' : AR_UPLOAD_HELP_TEXT}
                </Text>
              )}
            </View>
          </View>
          {props.selectedUploadFile && (
            <TouchableOpacity style={styles.clearFileBtn} onPress={props.onClearSelectedArFile}>
              <Text style={[styles.clearFileText, { color: palette.brandTitle }]}>Clear selected file</Text>
            </TouchableOpacity>
          )}
          {props.arUploadErrorMessage ? <StateMessage tone="error" text={props.arUploadErrorMessage} /> : null}
          {props.arUploadSuccessMessage ? <StateMessage text={props.arUploadSuccessMessage} color={palette.subText} /> : null}
          <TouchableOpacity
            style={[
              styles.primaryCta,
              styles.adminUploadBtn,
              { backgroundColor: palette.button },
              (!props.canUploadArModel || props.isArUploading) && styles.disabledOpacity
            ]}
            disabled={!props.canUploadArModel || props.isArUploading}
            onPress={props.onUploadArModel}
          >
            <Text style={[styles.primaryCtaText, { color: palette.buttonText }]}>
              {props.isArUploading
                ? `Uploading ${props.arUploadProgress}%`
                : props.arUploadErrorMessage
                  ? 'Retry upload'
                  : 'Upload and bind model'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inventoryHeader}>
        <View style={styles.inventoryTitleRow}>
          <Text style={styles.inventoryIcon}>📦</Text>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Active Inventory</Text>
        </View>
        <View style={styles.viewToggle}>
          <View style={[styles.toggleBtn, styles.toggleBtnFirst, { backgroundColor: palette.card, borderColor: palette.outlineVariant }]}>
            <Text style={[styles.toggleIcon, { color: palette.subText }]}>☰</Text>
          </View>
          <View style={[styles.toggleBtn, styles.toggleBtnMid, { backgroundColor: palette.mutedCard, borderColor: palette.outlineVariant }]}>
            <Text style={[styles.toggleIcon, { color: palette.text }]}>#</Text>
          </View>
          <View style={[styles.toggleBtn, { borderColor: palette.outlineVariant }]}>
            <Text style={[styles.toggleIcon, { color: palette.subText }]}>▦</Text>
          </View>
        </View>
      </View>

      {props.products.length === 0 ? (
        <StateMessage text="Urun bulunamadi." color={palette.subText} />
      ) : (
        <FlatList
          data={props.products}
          scrollEnabled={false}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '600', letterSpacing: -0.2 },
  adminCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2
  },
  adminTopBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  adminTitleBlock: { flex: 1, marginRight: 8 },
  adminSubtitle: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  newAssetBtn: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginLeft: 8
  },
  newAssetBtnText: { fontSize: 13, fontWeight: '700' },
  adminGrid: { flexDirection: 'column' },
  adminCol: { flex: 1 },
  adminColFirst: { marginBottom: 16 },
  adminColSecond: { marginBottom: 0 },
  caption: { fontSize: 12, fontWeight: '500', marginBottom: 8 },
  dashedUpload: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    minHeight: 128,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  uploadGlyph: { fontSize: 28, marginBottom: 4 },
  uploadHint: { fontSize: 14, textAlign: 'center', paddingHorizontal: 8 },
  pickerShell: { borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  fileName: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  bodyCompact: { fontSize: 14 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressTrack: { height: 8, borderRadius: 999, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: 8, borderRadius: 999 },
  clearFileBtn: { alignSelf: 'flex-start', marginTop: 8, marginBottom: 8 },
  clearFileText: { fontSize: 14, fontWeight: '600' },
  adminUploadBtn: { marginTop: 12 },
  disabledOpacity: { opacity: 0.55 },
  inventoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  inventoryTitleRow: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  inventoryIcon: { fontSize: 22, marginRight: 8 },
  viewToggle: { flexDirection: 'row' },
  toggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  toggleBtnFirst: { marginRight: 6 },
  toggleBtnMid: { marginRight: 6 },
  toggleIcon: { fontSize: 16, fontWeight: '700' },
  productCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2
  },
  imageWrap: { height: 192, width: '100%', position: 'relative' },
  productImage: { width: '100%', height: '100%' },
  imageFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imageFallbackText: { fontSize: 13, fontWeight: '500' },
  badgeStack: { position: 'absolute', top: 8, right: 8, alignItems: 'flex-end' },
  badgeMint: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginBottom: 6 },
  badgeMintText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  badgeStock: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeStockText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  cardBody: { padding: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  productName: { flex: 1, fontSize: 18, fontWeight: '600', letterSpacing: -0.2 },
  productPrice: { fontSize: 18, fontWeight: '600' },
  productDesc: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  actionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  primaryCta: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryCtaText: { fontSize: 14, fontWeight: '600' },
  iconGhost: {
    width: 48,
    height: 48,
    marginLeft: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  heartIcon: { fontSize: 20 },
  arLink: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center'
  },
  arLinkText: { fontSize: 14, fontWeight: '600' }
});
