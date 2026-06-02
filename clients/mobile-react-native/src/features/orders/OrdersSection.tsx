import React, { useMemo, useState } from 'react';
import { formatTryCurrency } from '@terravision/shared';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import type { OrderDto } from '../../types/order';
import { formatRelativeSinceTr } from '../../i18n/tr';
import { getOrderStatusLabel } from '../../theme/mobileTheme';
import type { MobilePalette, ThemeMode } from '../app/types';
import { StateMessage } from '../../ui/StateMessage';
import { OrderTrackingModal } from './OrderTrackingModal';

type OpenTracking = (order: OrderDto) => void;

type Props = {
  orders: OrderDto[];
  palette: MobilePalette;
  themeMode?: ThemeMode;
  isLoading: boolean;
  errorMessage: string | null;
};

type FilterKey = 'all' | 'processing' | 'shipped' | 'flagged';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Tümü' },
  { key: 'processing', label: 'Hazırlanıyor' },
  { key: 'shipped', label: 'Kargoda' },
  { key: 'flagged', label: 'İptal' }
];

const LIGHT_SURFACE_HIGH = '#eae7eb';
const LIGHT_PRIMARY_FIXED = '#a6f4b5';
const LIGHT_ON_PRIMARY_FIXED_VARIANT = '#005226';
const LIGHT_TERTIARY_FIXED = '#ffd9dd';
const LIGHT_ON_TERTIARY_FIXED_VARIANT = '#792d3b';

const DARK_PRIMARY_FIXED_DIM = '#73db9a';
const DARK_SHIPPED_TINT = 'rgba(115, 219, 154, 0.08)';

function hubLabel(orderId: number): string {
  return orderId % 2 === 0 ? 'Bölge deposu' : 'Lojistik merkezi A';
}

function darkFeaturedHub(orderId: number): string {
  return orderId % 2 === 0 ? 'Ankara merkezi' : 'Lojistik merkezi A';
}

function orderTvRef(id: number): string {
  return `TV-${String(id).padStart(4, '0')}`;
}

function orderSubtitle(order: OrderDto): string {
  const hub = hubLabel(order.id);
  switch (order.status) {
    case 1:
      return `${formatRelativeSinceTr(order.createdDate)} verildi • ${hub}`;
    case 2:
      return `${formatRelativeSinceTr(order.createdDate)} onaylandı • ${hub}`;
    case 3:
      return 'Yolda • Tahmini varış yarın';
    case 4: {
      const d = new Date(order.createdDate);
      const dateStr = Number.isNaN(d.getTime())
        ? order.createdDate
        : d.toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      return `Teslim edildi ${dateStr}`;
    }
    case 5:
      return 'İptal edildi • İnceleme gerekli';
    default:
      return hub;
  }
}

function matchesFilter(order: OrderDto, f: FilterKey): boolean {
  switch (f) {
    case 'all':
      return true;
    case 'processing':
      return order.status === 1 || order.status === 2;
    case 'shipped':
      return order.status === 3;
    case 'flagged':
      return order.status === 5;
    default:
      return true;
  }
}

function activePipelineCount(list: OrderDto[]): number {
  return list.filter((o) => o.status !== 4 && o.status !== 5).length;
}

function primaryLineSummary(order: OrderDto): { title: string; amount: string | null } {
  const items = order.items ?? [];
  if (items.length === 0) {
    return { title: 'Sipariş içeriği', amount: formatTryCurrency(order.totalAmount) };
  }
  const first = items[0];
  const extra = items.length - 1;
  const title =
    extra > 0 ? `${first.productName} (+${extra} ürün)` : `${first.productName} (x${first.quantity})`;
  return { title, amount: formatTryCurrency(first.lineTotal) };
}

function productHeadline(order: OrderDto): string {
  const items = order.items ?? [];
  if (items.length === 0) return 'Sipariş paketi';
  const first = items[0];
  const extra = items.length - 1;
  return extra > 0 ? `${first.productName} (+${extra})` : first.productName;
}

function formatEtaShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  d.setDate(d.getDate() + 2);
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

function darkStatusCopy(order: OrderDto): string {
  switch (order.status) {
    case 1:
      return 'Sevkiyat öncesi kalite kontrolü bekleniyor.';
    case 2:
      return '24 saat içinde sevkiyata hazırlanıyor.';
    case 3:
      return 'Gönderi hedef merkeze doğru yolda.';
    case 4:
      return order.notes?.trim() ? order.notes : 'Teslimatta imzalandı. Makbuz arşivlendi.';
    case 5:
      return 'Bu sipariş iptal edildi. Sonraki adımlar için ayrıntıları açın.';
    default:
      return '';
  }
}

function badgeStyle(status: number, palette: MobilePalette): { bg: string; fg: string } {
  switch (status) {
    case 1:
      return { bg: LIGHT_TERTIARY_FIXED, fg: LIGHT_ON_TERTIARY_FIXED_VARIANT };
    case 2:
      return { bg: palette.secondaryContainer, fg: palette.onSecondaryContainer };
    case 3:
      return { bg: LIGHT_PRIMARY_FIXED, fg: LIGHT_ON_PRIMARY_FIXED_VARIANT };
    case 4:
      return { bg: palette.outlineVariant, fg: palette.subText };
    case 5:
      return { bg: '#ffdad6', fg: '#93000a' };
    default:
      return { bg: palette.mutedCard, fg: palette.text };
  }
}

function OrdersSectionDark({
  orders,
  palette,
  isLoading,
  errorMessage,
  onOpenTracking
}: Pick<Props, 'orders' | 'palette' | 'isLoading' | 'errorMessage'> & {
  onOpenTracking: OpenTracking;
}): React.JSX.Element {
  const { featuredShipped, gridOrders } = useMemo(() => {
    const shipped = orders.find((o) => o.status === 3);
    const rest = shipped ? orders.filter((o) => o.id !== shipped.id) : orders;
    return { featuredShipped: shipped, gridOrders: rest };
  }, [orders]);

  const border = palette.outlineVariant;
  const surface = palette.card;
  const surfaceLow = palette.mutedCard;
  const surfaceHigh = palette.elevatedSurface;
  const surfaceHighest = palette.imagePlaceholder;

  return (
    <View style={darkStyles.root}>
      <View style={darkStyles.pageHeader}>
        <Text style={[darkStyles.pageTitle, { color: palette.text }]}>Aktif siparişler</Text>
        <Text style={[darkStyles.pageSubtitle, { color: palette.subText }]}>
          Gerçek zamanlı lojistik ve sipariş takibi.
        </Text>
      </View>

      {isLoading ? (
        <StateMessage text="Siparişler yükleniyor…" color={palette.subText} />
      ) : errorMessage ? (
        <StateMessage tone="error" text={errorMessage} />
      ) : null}

      {!isLoading && !errorMessage && featuredShipped ? (
        <View style={[darkStyles.featuredWrap, { backgroundColor: surfaceLow, borderColor: border }]}>
          <View style={[darkStyles.featuredHero, { backgroundColor: surfaceHighest }]}>
            <View style={[darkStyles.heroTint, { backgroundColor: DARK_SHIPPED_TINT }]} />
            <View style={darkStyles.heroBadgeSlot}>
              <View style={[darkStyles.shippedPillHero, { backgroundColor: palette.primaryContainer }]}>
                <Text style={{ fontSize: 12 }}>🚚</Text>
                <Text style={[darkStyles.shippedPillHeroText, { color: palette.onPrimaryContainer }]}>Kargoda</Text>
              </View>
            </View>
          </View>
          <View style={darkStyles.featuredBody}>
            <View style={darkStyles.featuredTopRow}>
              <Text style={[darkStyles.refUpper, { color: palette.border }]}>{`SİPARİŞ #${orderTvRef(featuredShipped.id).toUpperCase()}`}</Text>
              <Text style={[darkStyles.inTransitLabel, { color: palette.brandTitle }]}>Yolda</Text>
            </View>
            <Text style={[darkStyles.featuredTitle, { color: palette.text }]} numberOfLines={2}>
              {productHeadline(featuredShipped)}
            </Text>
            <View style={darkStyles.metaRow}>
              <Text style={[darkStyles.metaItem, { color: palette.subText }]}>
                📍 {darkFeaturedHub(featuredShipped.id)}
              </Text>
              <Text style={[darkStyles.metaItem, { color: palette.subText }]}>
                📅 ETA: {formatEtaShort(featuredShipped.createdDate)}
              </Text>
            </View>
            <TouchableOpacity
              style={[darkStyles.viewLogBtn, { backgroundColor: palette.primaryContainer }]}
              onPress={() => onOpenTracking(featuredShipped)}
              accessibilityRole="button"
              accessibilityLabel="Sipariş günlüğünü görüntüle"
            >
              <Text style={[darkStyles.viewLogBtnText, { color: palette.onPrimaryContainer }]}>Ayrıntılı günlük</Text>
              <Text style={[darkStyles.viewLogArrow, { color: palette.onPrimaryContainer }]}>→</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {!isLoading && !errorMessage
        ? gridOrders.map((order) => (
            <DarkCompactOrderCard
              key={order.id}
              order={order}
              palette={palette}
              border={border}
              surface={surface}
              surfaceHighest={surfaceHighest}
              onOpenTracking={onOpenTracking}
            />
          ))
        : null}

      {!isLoading && !errorMessage && orders.length === 0 ? (
        <StateMessage
          text="Henüz sipariş yok. Sepetten sipariş verdiğinizde burada görünür."
          color={palette.subText}
        />
      ) : null}

      {!isLoading && !errorMessage ? (
        <TouchableOpacity
          style={[darkStyles.newOrderCard, { backgroundColor: palette.surfaceLowest, borderColor: border }]}
          onPress={() => Alert.alert('Yeni sipariş', 'Yeni sipariş için ürünler sekmesine gidin.')}
          accessibilityRole="button"
          accessibilityLabel="Yeni sipariş başlat"
          activeOpacity={0.85}
        >
          <View style={[darkStyles.newOrderIconCircle, { backgroundColor: surfaceHigh }]}>
            <Text style={[darkStyles.newOrderPlus, { color: palette.brandTitle }]}>+</Text>
          </View>
          <Text style={[darkStyles.newOrderTitle, { color: palette.subText }]}>New Order</Text>
          <Text style={[darkStyles.newOrderCaption, { color: palette.border }]}>Provision equipment</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function DarkCompactOrderCard({
  order,
  palette,
  border,
  surface,
  surfaceHighest,
  onOpenTracking
}: {
  order: OrderDto;
  palette: MobilePalette;
  border: string;
  surface: string;
  surfaceHighest: string;
  onOpenTracking: OpenTracking;
}): React.JSX.Element {
  const ref = orderTvRef(order.id);
  const price = formatTryCurrency(order.totalAmount);
  const title = productHeadline(order);
  const body = darkStatusCopy(order);

  const pendingPill = order.status === 1;
  const delivered = order.status === 4;

  return (
    <TouchableOpacity
      style={[darkStyles.compactCard, { backgroundColor: surface, borderColor: border }]}
      onPress={() => onOpenTracking(order)}
      accessibilityRole="button"
      accessibilityLabel={`Sipariş ${ref} takibini aç`}
      activeOpacity={0.85}
    >
      <View style={darkStyles.compactHeader}>
        {pendingPill ? (
          <View style={[darkStyles.pillMuted, { backgroundColor: surfaceHighest }]}>
            <Text style={[darkStyles.pillMutedText, { color: palette.subText }]}>Pending</Text>
          </View>
        ) : delivered ? (
          <View
            style={[
              darkStyles.pillDelivered,
              { backgroundColor: 'rgba(219, 255, 226, 0.1)', borderColor: 'rgba(219, 255, 226, 0.2)' }
            ]}
          >
            <Text style={[darkStyles.pillDeliveredText, { color: DARK_PRIMARY_FIXED_DIM }]}>Delivered</Text>
          </View>
        ) : (
          <View
            style={[
              darkStyles.pillAccent,
              {
                backgroundColor:
                  order.status === 2 ? palette.secondaryContainer : order.status === 5 ? 'rgba(255, 180, 171, 0.18)' : palette.primaryContainer,
                borderWidth: order.status === 5 ? 0 : 0
              }
            ]}
          >
            <Text
              style={[
                darkStyles.pillAccentText,
                {
                  color:
                    order.status === 2
                      ? palette.onSecondaryContainer
                      : order.status === 5
                        ? '#ffb4ab'
                        : palette.onPrimaryContainer
                }
              ]}
            >
              {getOrderStatusLabel(order.status)}
            </Text>
          </View>
        )}
        <Text style={[darkStyles.compactRef, { color: palette.border }]}>{`#${ref}`}</Text>
      </View>
      <Text style={[darkStyles.compactTitle, { color: palette.text }]} numberOfLines={2}>
        {title}
      </Text>
      <Text style={[darkStyles.compactBody, { color: palette.subText }]} numberOfLines={3}>
        {body}
      </Text>
      <View style={[darkStyles.compactFooter, { borderTopColor: border }]}>
        <Text style={[darkStyles.compactPrice, { color: palette.brandTitle }]}>{price}</Text>
        {delivered ? (
          <View style={darkStyles.completeRow}>
            <Text style={{ color: DARK_PRIMARY_FIXED_DIM, fontSize: 16 }}>✓</Text>
            <Text style={[darkStyles.completeLabel, { color: DARK_PRIMARY_FIXED_DIM }]}>Complete</Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => onOpenTracking(order)}
            accessibilityRole="button"
            accessibilityLabel="Sipariş takibini aç"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[darkStyles.moreGlyph, { color: palette.border }]}>⋮</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

function OrdersSectionLight({
  orders,
  palette,
  isLoading,
  errorMessage,
  onOpenTracking
}: Pick<Props, 'orders' | 'palette' | 'isLoading' | 'errorMessage'> & {
  onOpenTracking: OpenTracking;
}): React.JSX.Element {
  const [filter, setFilter] = useState<FilterKey>('all');
  const filtered = useMemo(() => orders.filter((o) => matchesFilter(o, filter)), [orders, filter]);
  const activeCount = useMemo(() => activePipelineCount(orders), [orders]);

  const summaryCardBg = palette.surfaceLowest;
  const orderCardBg = palette.surfaceLowest;
  const chipInactiveBg = LIGHT_SURFACE_HIGH;
  const iconTileBg = palette.bottomNav;
  const trackBtnBg = LIGHT_SURFACE_HIGH;
  const borderSoft = palette.outlineVariant;

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.summaryCard,
          {
            backgroundColor: summaryCardBg,
            borderColor: borderSoft,
            shadowColor: '#000'
          }
        ]}
      >
        <Text style={[styles.pipelineCaption, { color: palette.subText }]}>Aktif süreç</Text>
        <View style={styles.summaryRow}>
          <Text style={[styles.activeOrdersTitle, { color: palette.brandTitle }]}>
            {activeCount} aktif sipariş
          </Text>
          <Text style={[styles.trendIcon, { color: palette.brandTitle }]}>↗</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterScroll}
      >
        {FILTERS.map((f) => {
          const selected = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={f.label}
              style={[
                styles.filterChip,
                {
                  backgroundColor: selected ? palette.button : chipInactiveBg
                }
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: selected ? palette.buttonText : palette.subText }
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <StateMessage text="Siparişler yükleniyor…" color={palette.subText} />
      ) : errorMessage ? (
        <StateMessage tone="error" text={errorMessage} />
      ) : orders.length === 0 ? (
        <StateMessage
          text="Henüz sipariş yok. Sepetten sipariş verdiğinizde burada görünür."
          color={palette.subText}
        />
      ) : filtered.length === 0 ? (
        <StateMessage text="Bu filtrede sipariş yok." color={palette.subText} />
      ) : (
        <View style={styles.orderList}>
          {filtered.map((order) => {
            const badge = badgeStyle(order.status, palette);
            const { title: lineTitle, amount: lineAmount } = primaryLineSummary(order);
            const isDelivered = order.status === 4;
            const isShipped = order.status === 3;
            const isPending = order.status === 1;
            const isConfirmed = order.status === 2;

            return (
              <View
                key={order.id}
                style={[
                  styles.orderCard,
                  isDelivered && styles.orderCardDelivered,
                  {
                    backgroundColor: isDelivered ? palette.mutedCard : orderCardBg,
                    borderColor: borderSoft,
                    opacity: isDelivered ? 0.92 : 1,
                    shadowColor: '#000'
                  }
                ]}
              >
                <TouchableOpacity
                  style={styles.orderHeader}
                  onPress={() => onOpenTracking(order)}
                  accessibilityRole="button"
                  accessibilityLabel={`Sipariş TV-${String(order.id).padStart(4, '0')} takibini aç`}
                  activeOpacity={0.7}
                >
                  <View style={styles.orderHeaderText}>
                    <Text
                      style={[
                        styles.orderId,
                        { color: isDelivered ? palette.subText : palette.text }
                      ]}
                    >
                      {`Sipariş #TV-${String(order.id).padStart(4, '0')}`}
                    </Text>
                    <Text style={[styles.orderMeta, { color: palette.subText }]}>{orderSubtitle(order)}</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.statusPillText, { color: badge.fg }]}>
                      {getOrderStatusLabel(order.status)}
                    </Text>
                  </View>
                </TouchableOpacity>

                {!isDelivered ? (
                  <View style={[styles.lineRow, { borderTopColor: borderSoft, borderBottomColor: borderSoft }]}>
                    <View style={[styles.iconTile, { backgroundColor: iconTileBg }]}>
                      <Text style={[styles.iconTileGlyph, { color: palette.border }]}>
                        {isShipped ? '📦' : '📋'}
                      </Text>
                    </View>
                    <View style={styles.lineTextCol}>
                      <Text style={[styles.lineTitle, { color: palette.text }]} numberOfLines={2}>
                        {lineTitle}
                      </Text>
                      {lineAmount ? (
                        <Text style={[styles.lineAmount, { color: palette.border }]}>{lineAmount}</Text>
                      ) : null}
                    </View>
                  </View>
                ) : (
                  <View style={styles.deliveredLine}>
                    <View style={[styles.iconTile, { backgroundColor: palette.imagePlaceholder }]}>
                      <Text style={styles.deliveredCheck}>✓</Text>
                    </View>
                    <Text style={[styles.lineTitle, { color: palette.subText }]} numberOfLines={2}>
                      {lineTitle}
                    </Text>
                  </View>
                )}

                {isPending ? (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.btnPrimary, { backgroundColor: palette.button }]}
                      onPress={() =>
                        Alert.alert('Siparişi onayla', `Sipariş #TV-${String(order.id).padStart(4, '0')} onaylansın mı?`)
                      }
                      accessibilityRole="button"
                      accessibilityLabel="Siparişi onayla"
                    >
                      <Text style={[styles.btnPrimaryLabel, { color: palette.buttonText }]}>Siparişi onayla</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.btnIconOutline, { borderColor: borderSoft }]}
                      onPress={() => onOpenTracking(order)}
                      accessibilityRole="button"
                      accessibilityLabel="Sipariş takibini aç"
                    >
                      <Text style={{ color: palette.subText, fontSize: 18 }}>⋮</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                {isConfirmed ? (
                  <TouchableOpacity
                    style={[styles.btnOutlinePrimary, { borderColor: palette.button }]}
                    onPress={() => Alert.alert('Kargo etiketi', 'Etiket oluşturma bu önizleme sürümünde henüz bağlı değil.')}
                    accessibilityRole="button"
                    accessibilityLabel="Kargo etiketi oluştur"
                  >
                    <Text style={[styles.btnOutlinePrimaryLabel, { color: palette.button }]}>Etiket oluştur</Text>
                  </TouchableOpacity>
                ) : null}

                {isShipped ? (
                  <View style={styles.shippedBlock}>
                    <View style={[styles.progressTrack, { backgroundColor: chipInactiveBg }]}>
                      <View style={[styles.progressFill, { width: '75%', backgroundColor: palette.button }]} />
                    </View>
                    <View style={styles.progressLabels}>
                      <Text style={[styles.captionMuted, { color: palette.border }]}>Çıkış</Text>
                      <Text style={[styles.captionMuted, { color: palette.border }]}>Varış</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.btnTrack, { backgroundColor: trackBtnBg }]}
                      onPress={() => onOpenTracking(order)}
                      accessibilityRole="button"
                      accessibilityLabel="Kargoyu takip et"
                    >
                      <Text style={{ fontSize: 16 }}>🚚</Text>
                      <Text style={[styles.btnTrackLabel, { color: palette.text }]}>Kargoyu takip et</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

export function OrdersSection({
  orders,
  palette,
  themeMode = 'light',
  isLoading,
  errorMessage
}: Props): React.JSX.Element {
  const [trackingOrder, setTrackingOrder] = useState<OrderDto | null>(null);
  const openTracking: OpenTracking = (order) => setTrackingOrder(order);

  return (
    <>
      {themeMode === 'dark' ? (
        <OrdersSectionDark
          orders={orders}
          palette={palette}
          isLoading={isLoading}
          errorMessage={errorMessage}
          onOpenTracking={openTracking}
        />
      ) : (
        <OrdersSectionLight
          orders={orders}
          palette={palette}
          isLoading={isLoading}
          errorMessage={errorMessage}
          onOpenTracking={openTracking}
        />
      )}
      <OrderTrackingModal
        orderId={trackingOrder?.id ?? null}
        visible={trackingOrder != null}
        onClose={() => setTrackingOrder(null)}
        palette={palette}
        themeMode={themeMode}
        fallbackOrder={trackingOrder}
      />
    </>
  );
}

const darkStyles = StyleSheet.create({
  root: { marginBottom: 8 },
  pageHeader: { marginBottom: 20 },
  pageTitle: { fontSize: 22, fontWeight: '600', lineHeight: 28, letterSpacing: -0.3, marginBottom: 4 },
  pageSubtitle: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  featuredWrap: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16
  },
  featuredHero: {
    height: 160,
    position: 'relative',
    justifyContent: 'flex-start'
  },
  heroTint: { ...StyleSheet.absoluteFill },
  heroBadgeSlot: { position: 'absolute', top: 14, left: 14 },
  shippedPillHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999
  },
  shippedPillHeroText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.02 },
  featuredBody: { padding: 18 },
  featuredTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  refUpper: { fontSize: 11, fontWeight: '600', letterSpacing: 1.2 },
  inTransitLabel: { fontSize: 12, fontWeight: '500' },
  featuredTitle: { fontSize: 17, fontWeight: '600', lineHeight: 24, marginBottom: 12 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  metaItem: { fontSize: 14, lineHeight: 20 },
  viewLogBtn: {
    minHeight: 44,
    borderRadius: 8,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'flex-start'
  },
  viewLogBtnText: { fontSize: 12, fontWeight: '600' },
  viewLogArrow: { fontSize: 16, fontWeight: '700' },
  compactCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
    minHeight: 200,
    justifyContent: 'space-between'
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  pillMuted: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  pillMutedText: { fontSize: 12, fontWeight: '600' },
  pillDelivered: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1
  },
  pillDeliveredText: { fontSize: 12, fontWeight: '600' },
  pillAccent: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  pillAccentText: { fontSize: 12, fontWeight: '600' },
  compactRef: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  compactTitle: { fontSize: 17, fontWeight: '600', lineHeight: 24, marginBottom: 6 },
  compactBody: { fontSize: 14, lineHeight: 20, marginTop: 2 },
  compactFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth
  },
  compactPrice: { fontSize: 20, fontWeight: '600', letterSpacing: -0.3 },
  completeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  completeLabel: { fontSize: 12, fontWeight: '600' },
  moreGlyph: { fontSize: 20, fontWeight: '700' },
  newOrderCard: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4
  },
  newOrderIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  newOrderPlus: { fontSize: 26, fontWeight: '400', lineHeight: 28 },
  newOrderTitle: { fontSize: 17, fontWeight: '600', marginBottom: 4 },
  newOrderCaption: { fontSize: 12, fontWeight: '500' }
});

const styles = StyleSheet.create({
  root: { marginBottom: 8 },
  summaryCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  pipelineCaption: { fontSize: 12, fontWeight: '500', letterSpacing: 0.01, marginBottom: 4 },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  activeOrdersTitle: { fontSize: 24, fontWeight: '600', letterSpacing: -0.3, flex: 1 },
  trendIcon: { fontSize: 26, fontWeight: '700', marginBottom: 2 },
  filterScroll: { marginBottom: 16, marginHorizontal: -2 },
  filterRow: { flexDirection: 'row', gap: 8, paddingBottom: 4, paddingRight: 8 },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999
  },
  filterChipText: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  orderList: { gap: 12 },
  orderCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  orderCardDelivered: {
    shadowOpacity: 0.03
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  orderHeaderText: { flex: 1, marginRight: 8 },
  orderId: { fontSize: 17, fontWeight: '600', letterSpacing: -0.1 },
  orderMeta: { fontSize: 12, fontWeight: '500', marginTop: 4, lineHeight: 16 },
  statusPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  statusPillText: { fontSize: 12, fontWeight: '500' },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    marginBottom: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconTileGlyph: { fontSize: 18 },
  lineTextCol: { flex: 1 },
  lineTitle: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  lineAmount: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  deliveredLine: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  deliveredCheck: { fontSize: 16, color: '#404940', fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  btnPrimary: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnPrimaryLabel: { fontSize: 14, fontWeight: '600' },
  btnIconOutline: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnOutlinePrimary: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12
  },
  btnOutlinePrimaryLabel: { fontSize: 14, fontWeight: '600' },
  shippedBlock: { marginTop: 2 },
  progressTrack: { height: 6, borderRadius: 999, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', borderRadius: 999 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  captionMuted: { fontSize: 12, fontWeight: '500' },
  btnTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    borderRadius: 8,
    paddingHorizontal: 12
  },
  btnTrackLabel: { fontSize: 14, fontWeight: '600' }
});
