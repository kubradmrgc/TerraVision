import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import type { CartDto } from '../../types/cart';
import type { MobilePalette, ThemeMode } from '../app/types';
import { StateMessage } from '../../ui/StateMessage';
import { SectionHeader } from '../../ui/SectionHeader';

type Props = {
  cart: CartDto | null;
  palette: MobilePalette;
  themeMode?: ThemeMode;
  isLoading: boolean;
  isMutating: boolean;
  errorMessage: string | null;
  onPlaceOrder: () => void;
  onClearCart: () => void;
  onDecrease: (productId: number, qty: number) => void;
  onIncrease: (productId: number, qty: number) => void;
  onRemove: (productId: number) => void;
};

function formatTry(value: number): string {
  try {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 }).format(value);
  } catch {
    return `${value} TL`;
  }
}

const DARK_PRIMARY_FIXED_DIM = '#73db9a';
const DARK_ERROR_SOFT = 'rgba(255, 180, 171, 0.14)';
const DARK_ERROR_BORDER = 'rgba(255, 180, 171, 0.28)';
const DARK_DELETE = '#ffb4ab';

export function CartSection(props: Props): React.JSX.Element {
  const { palette } = props;
  const isDark = props.themeMode === 'dark';
  const cartItems = props.cart?.items ?? [];
  const isCartEmpty = cartItems.length === 0;
  const isPrimaryDisabled = props.isMutating || isCartEmpty;
  const subtotal = cartItems.reduce((sum, x) => sum + (x.lineTotal ?? 0), 0);
  const logisticsFee = 0;
  const total = props.cart?.totalAmount ?? subtotal + logisticsFee;
  const itemCount = cartItems.reduce((n, x) => n + x.quantity, 0);

  const itemCardBg = isDark ? palette.mutedCard : palette.surfaceLowest;
  const thumbFrameBg = isDark ? palette.imagePlaceholder : palette.bottomNav;
  const thumbInnerBg = isDark ? palette.surfaceDim : palette.mutedCard;
  const linePriceColor = isDark ? DARK_PRIMARY_FIXED_DIM : palette.brandTitle;
  const stepperBg = isDark ? palette.elevatedSurface : palette.bottomNav;
  const deleteColor = isDark ? DARK_DELETE : palette.subText;

  return (
    <View style={styles.root}>
      {props.errorMessage ? (
        <View
          style={[
            styles.errorBanner,
            isDark
              ? { backgroundColor: DARK_ERROR_SOFT, borderColor: DARK_ERROR_BORDER }
              : { backgroundColor: '#ffdad6', borderColor: 'rgba(186, 26, 26, 0.12)' }
          ]}
          accessibilityRole="alert"
        >
          <Text style={[styles.errorBannerIcon, { color: isDark ? '#ffb4ab' : '#93000a' }]}>!</Text>
          <View style={styles.errorBannerText}>
            <Text style={[styles.errorBannerTitle, { color: isDark ? '#ffb4ab' : '#93000a' }]}>Cart update</Text>
            <Text style={[styles.errorBannerBody, { color: isDark ? palette.subText : '#5c1f1f' }]}>
              {props.errorMessage}
            </Text>
          </View>
        </View>
      ) : null}

      <SectionHeader
        title={isCartEmpty ? 'Your Cart' : `Your Cart (${itemCount} ${itemCount === 1 ? 'item' : 'items'})`}
        subtitle={isCartEmpty ? 'Add products from the catalog' : 'Review items before checkout'}
        titleColor={palette.text}
        subtitleColor={palette.subText}
        right={
          !isCartEmpty ? (
            <TouchableOpacity
              onPress={props.onClearCart}
              disabled={props.isMutating || isCartEmpty}
              accessibilityRole="button"
              accessibilityLabel="Clear cart"
            >
              <Text
                style={[
                  styles.clearCartLink,
                  {
                    color:
                      props.isMutating || isCartEmpty
                        ? palette.subText
                        : isDark
                          ? DARK_DELETE
                          : '#ba1a1a'
                  }
                ]}
              >
                Clear
              </Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {props.isLoading ? <StateMessage text="Loading cart…" color={palette.subText} /> : null}

      {isCartEmpty && !props.isLoading && !props.errorMessage ? (
        <StateMessage
          variant="banner"
          text="Your cart is empty. Browse Products to add items."
          color={palette.subText}
          backgroundColor={palette.mutedCard}
          borderColor={palette.outlineVariant}
        />
      ) : null}

      <View style={styles.itemList}>
        {cartItems.map((item) => (
          <View
            key={item.productId}
            style={[
              styles.itemCard,
              isDark && styles.itemCardDark,
              { backgroundColor: itemCardBg, borderColor: palette.outlineVariant, shadowColor: '#000' }
            ]}
          >
            <View style={[styles.thumbWrap, { backgroundColor: thumbFrameBg }]}>
              <View style={[styles.thumbPlaceholder, { backgroundColor: thumbInnerBg }]}>
                <Text style={[styles.thumbLetter, { color: palette.subText }]}>
                  {item.productName.trim().charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
            </View>
            <View style={styles.itemBody}>
              <View style={styles.itemTitleRow}>
                <Text style={[styles.itemName, isDark && styles.itemNameDark, { color: palette.text }]} numberOfLines={2}>
                  {item.productName}
                </Text>
                <TouchableOpacity
                  onPress={() => props.onRemove(item.productId)}
                  disabled={props.isMutating}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${item.productName}`}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={[styles.deleteIcon, { color: deleteColor }]}>🗑</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.itemMeta, { color: palette.subText }]}>Ref #{item.productId}</Text>
              <View style={styles.itemFooterRow}>
                <Text style={[styles.itemPrice, isDark && styles.itemPriceDark, { color: linePriceColor }]}>
                  {formatTry(item.lineTotal)}
                </Text>
                <View
                  style={[
                    styles.stepper,
                    isDark && styles.stepperDark,
                    { backgroundColor: stepperBg, borderColor: palette.outlineVariant }
                  ]}
                >
                  <TouchableOpacity
                    style={[styles.stepperBtn, isDark && styles.stepperBtnDark]}
                    disabled={props.isMutating}
                    onPress={() => props.onDecrease(item.productId, item.quantity)}
                    accessibilityRole="button"
                    accessibilityLabel="Decrease quantity"
                  >
                    <Text style={[styles.stepperBtnText, { color: palette.text }]}>−</Text>
                  </TouchableOpacity>
                  <Text style={[styles.stepperValue, isDark && styles.stepperValueDark, { color: palette.text }]}>
                    {item.quantity}
                  </Text>
                  <TouchableOpacity
                    style={[styles.stepperBtn, isDark && styles.stepperBtnDark]}
                    disabled={props.isMutating}
                    onPress={() => props.onIncrease(item.productId, item.quantity)}
                    accessibilityRole="button"
                    accessibilityLabel="Increase quantity"
                  >
                    <Text style={[styles.stepperBtnText, { color: palette.text }]}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>

      {!isCartEmpty ? (
        <>
          {isDark ? (
            <View
              style={[
                styles.darkSummaryCard,
                { backgroundColor: palette.elevatedSurface, borderColor: palette.outlineVariant, shadowColor: '#000' }
              ]}
            >
              <Text style={[styles.darkSummaryTitle, { color: palette.text }]}>Order Summary</Text>
              <View style={styles.totalRow}>
                <Text style={[styles.darkSummaryRow, { color: palette.subText }]}>Subtotal</Text>
                <Text style={[styles.darkSummaryRow, { color: palette.subText }]}>{formatTry(subtotal)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={[styles.darkSummaryRow, { color: palette.subText }]}>Logistics Fee</Text>
                <Text style={[styles.darkSummaryRow, { color: palette.subText }]}>{formatTry(logisticsFee)}</Text>
              </View>
              <View style={[styles.darkSummaryTotalRow, { borderTopColor: palette.outlineVariant }]}>
                <Text style={[styles.darkSummaryTotalLabel, { color: palette.text }]}>Total</Text>
                <Text style={[styles.darkSummaryTotalValue, { color: palette.primaryContainer }]}>{formatTry(total)}</Text>
              </View>
            </View>
          ) : (
            <View style={[styles.totalsBlock, { borderTopColor: palette.outlineVariant }]}>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: palette.subText }]}>Subtotal</Text>
                <Text style={[styles.totalValue, { color: palette.text }]}>{formatTry(subtotal)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: palette.subText }]}>Logistics Fee</Text>
                <Text style={[styles.totalValue, { color: palette.text }]}>{formatTry(logisticsFee)}</Text>
              </View>
              <View style={[styles.totalRow, styles.totalRowGrand]}>
                <Text style={[styles.totalGrandLabel, { color: palette.text }]}>Total Amount</Text>
                <Text style={[styles.totalGrandValue, { color: palette.brandTitle }]}>{formatTry(total)}</Text>
              </View>
            </View>
          )}
        </>
      ) : null}

      <TouchableOpacity
        style={[
          styles.placeOrderBtn,
          isDark && styles.placeOrderBtnDark,
          {
            backgroundColor: isDark ? palette.primaryContainer : palette.button
          },
          isPrimaryDisabled && styles.buttonDisabled
        ]}
        disabled={isPrimaryDisabled}
        onPress={props.onPlaceOrder}
        accessibilityRole="button"
        accessibilityLabel="Place order"
      >
        <Text style={[styles.placeOrderLabel, isDark && styles.placeOrderLabelDark, { color: isDark ? palette.onPrimaryContainer : palette.buttonText }]}>
          {isDark ? 'Place order' : 'Place Order'}
        </Text>
        <Text style={[styles.placeOrderArrow, { color: isDark ? palette.onPrimaryContainer : palette.buttonText }]}>
          →
        </Text>
      </TouchableOpacity>

      <View style={{ height: 96 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginBottom: 8 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16
  },
  errorBannerIcon: { fontSize: 20, fontWeight: '800', marginTop: 2, marginRight: 10 },
  errorBannerText: { flex: 1 },
  errorBannerTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  errorBannerBody: { fontSize: 14, lineHeight: 20 },
  cartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 16,
    paddingHorizontal: 2
  },
  darkClearRow: { alignItems: 'flex-end', marginBottom: 14, marginTop: -8 },
  cartHeaderIcon: { fontSize: 22 },
  sectionTitle: { fontSize: 18, fontWeight: '600', letterSpacing: -0.2, flexShrink: 1 },
  darkSectionTitle: { fontSize: 22, fontWeight: '600', letterSpacing: -0.3, flex: 1 },
  clearCartLink: { fontSize: 12, fontWeight: '600' },
  itemList: {},
  itemCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  itemCardDark: {
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4
  },
  thumbWrap: { width: 96, height: 96, borderRadius: 8, overflow: 'hidden' },
  thumbPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  thumbLetter: { fontSize: 28, fontWeight: '700' },
  itemBody: { flex: 1, marginLeft: 12, justifyContent: 'space-between', minHeight: 96 },
  itemTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemName: { flex: 1, fontSize: 15, fontWeight: '700', lineHeight: 20 },
  itemNameDark: { fontSize: 17, fontWeight: '600' },
  deleteIcon: { fontSize: 18 },
  itemMeta: { fontSize: 12, fontWeight: '500', marginTop: 4 },
  itemFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  itemPrice: { fontSize: 16, fontWeight: '700' },
  itemPriceDark: { fontSize: 20, fontWeight: '600' },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: 4
  },
  stepperDark: { paddingVertical: 4 },
  stepperBtn: { width: 32, height: 36, alignItems: 'center', justifyContent: 'center' },
  stepperBtnDark: { width: 40, height: 40, borderRadius: 999 },
  stepperBtnText: { fontSize: 20, fontWeight: '600' },
  stepperValue: { paddingHorizontal: 12, fontSize: 14, fontWeight: '700' },
  stepperValueDark: { fontSize: 17, fontWeight: '600' },
  totalsBlock: {
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth
  },
  darkSummaryCard: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 18,
    marginBottom: 4,
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6
  },
  darkSummaryTitle: { fontSize: 17, fontWeight: '700', marginBottom: 14, letterSpacing: -0.2 },
  darkSummaryRow: { fontSize: 15, lineHeight: 22 },
  darkSummaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth
  },
  darkSummaryTotalLabel: { fontSize: 17, fontWeight: '700' },
  darkSummaryTotalValue: { fontSize: 22, fontWeight: '600', letterSpacing: -0.3 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalLabel: { fontSize: 14 },
  totalValue: { fontSize: 14, fontWeight: '500' },
  totalRowGrand: { marginTop: 6, paddingTop: 8, marginBottom: 0 },
  totalGrandLabel: { fontSize: 18, fontWeight: '700' },
  totalGrandValue: { fontSize: 18, fontWeight: '700' },
  placeOrderBtn: {
    marginTop: 18,
    minHeight: 56,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3
  },
  placeOrderBtnDark: {
    marginTop: 20,
    minHeight: 48,
    borderRadius: 999,
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8
  },
  placeOrderLabel: { fontSize: 14, fontWeight: '700' },
  placeOrderLabelDark: { fontSize: 17, fontWeight: '600' },
  placeOrderArrow: { fontSize: 18, marginLeft: 8, fontWeight: '700' },
  buttonDisabled: { opacity: 0.55 }
});
