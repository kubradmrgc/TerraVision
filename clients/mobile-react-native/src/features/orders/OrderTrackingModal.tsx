import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { computeLineTotal, formatTryCurrency } from '@terravision/shared';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { OrderDto, OrderStatusHistoryDto } from '../../types/order';
import { orderService } from '../../services/orderService';
import { getOrderStatusLabel } from '../../theme/mobileTheme';
import type { MobilePalette, ThemeMode } from '../app/types';
import { StateMessage } from '../../ui/StateMessage';

const GLASS_BACKDROP_LIGHT = 'rgba(251, 248, 252, 0.92)';
const GLASS_BACKDROP_DARK = 'rgba(5, 20, 38, 0.88)';

type Props = {
  orderId: number | null;
  visible: boolean;
  onClose: () => void;
  palette: MobilePalette;
  themeMode?: ThemeMode;
  /** Cached order used as a fallback while the detailed record loads. */
  fallbackOrder?: OrderDto | null;
};

type TimelineNode = {
  key: string;
  status: number;
  title: string;
  occurredAtUtc: string;
  reason?: string;
  isOrigin: boolean;
};

function orderTvRef(id: number): string {
  return `TV-${String(id).padStart(4, '0')}`;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function statusDotColor(status: number, palette: MobilePalette): string {
  switch (status) {
    case 3:
      return palette.button;
    case 4:
      return palette.button;
    case 5:
      return '#b91c1c';
    default:
      return palette.brandTitle;
  }
}

/**
 * Builds an ascending timeline from the order's creation event plus every
 * recorded status transition. The API returns history newest-first, so we
 * sort ascending here to read top-to-bottom as a chronological track.
 */
function buildTimeline(order: OrderDto | null | undefined): TimelineNode[] {
  if (!order) return [];

  const history = [...(order.statusHistory ?? [])].sort(
    (a, b) => new Date(a.occurredAtUtc).getTime() - new Date(b.occurredAtUtc).getTime()
  );

  const nodes: TimelineNode[] = [
    {
      key: 'origin',
      status: 1,
      title: 'Sipariş oluşturuldu',
      occurredAtUtc: order.createdDate,
      isOrigin: true
    }
  ];

  history.forEach((entry: OrderStatusHistoryDto, index: number) => {
    nodes.push({
      key: `h-${index}-${entry.occurredAtUtc}`,
      status: entry.newStatus,
      title: getOrderStatusLabel(entry.newStatus),
      occurredAtUtc: entry.occurredAtUtc,
      reason: entry.reason ?? undefined,
      isOrigin: false
    });
  });

  return nodes;
}

export function OrderTrackingModal({
  orderId,
  visible,
  onClose,
  palette,
  themeMode = 'light',
  fallbackOrder = null
}: Props): React.JSX.Element {
  const isLight = themeMode === 'light';
  const backdrop = isLight ? GLASS_BACKDROP_LIGHT : GLASS_BACKDROP_DARK;

  const detailQuery = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderService.getMyOrderById(orderId as number),
    enabled: visible && orderId != null
  });

  const order = detailQuery.data ?? fallbackOrder;
  const timeline = useMemo(() => buildTimeline(order), [order]);
  const currentStatus = order?.status ?? fallbackOrder?.status ?? 1;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: backdrop }]}>
        <View style={[styles.sheet, { backgroundColor: palette.surfaceLowest, borderColor: palette.outlineVariant }]}>
          <View style={[styles.header, { borderBottomColor: palette.outlineVariant }]}>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: palette.text }]}>Sipariş Takibi</Text>
              <Text style={[styles.subtitle, { color: palette.subText }]} numberOfLines={1}>
                {orderId != null ? `Sipariş #${orderTvRef(orderId)}` : 'Sipariş detayı'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeRound}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Takip ekranını kapat"
            >
              <Text style={{ color: palette.subText, fontSize: 22, fontWeight: '300' }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {detailQuery.isLoading && !order ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={palette.brandTitle} />
                <Text style={[styles.loadingText, { color: palette.subText }]}>Sipariş yükleniyor…</Text>
              </View>
            ) : detailQuery.isError && !order ? (
              <StateMessage tone="error" text="Sipariş detayı yüklenemedi. Lütfen tekrar deneyin." />
            ) : order ? (
              <>
                <View style={[styles.summaryCard, { backgroundColor: palette.mutedCard, borderColor: palette.outlineVariant }]}>
                  <View style={styles.summaryTopRow}>
                    <Text style={[styles.summaryLabel, { color: palette.subText }]}>Güncel Durum</Text>
                    <View style={[styles.statusPill, { backgroundColor: palette.primaryContainer }]}>
                      <Text style={[styles.statusPillText, { color: palette.onPrimaryContainer }]}>
                        {getOrderStatusLabel(currentStatus)}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.summaryTotal, { color: palette.text }]}>
                    {formatTryCurrency(order.totalAmount)}
                  </Text>
                  <Text style={[styles.summaryMeta, { color: palette.subText }]}>
                    {`Oluşturulma: ${formatTimestamp(order.createdDate)}`}
                  </Text>
                  {order.notes?.trim() ? (
                    <Text style={[styles.summaryNotes, { color: palette.subText }]} numberOfLines={3}>
                      {`Not: ${order.notes.trim()}`}
                    </Text>
                  ) : null}
                </View>

                {(order.items ?? []).length > 0 ? (
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: palette.text }]}>Ürünler</Text>
                    {order.items.map((item) => {
                      const lineTotal =
                        item.lineTotal ?? computeLineTotal(item.unitPrice ?? 0, item.quantity ?? 0);
                      return (
                        <View key={`${item.productId}`} style={styles.itemRow}>
                          <Text style={[styles.itemName, { color: palette.text }]} numberOfLines={2}>
                            {`${item.productName} ×${item.quantity}`}
                          </Text>
                          <Text style={[styles.itemAmount, { color: palette.subText }]}>
                            {formatTryCurrency(lineTotal)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                ) : null}

                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: palette.text }]}>Durum Geçmişi</Text>
                  {timeline.length === 0 ? (
                    <Text style={[styles.emptyHistory, { color: palette.subText }]}>
                      Henüz durum değişikliği kaydı yok.
                    </Text>
                  ) : (
                    <View style={styles.timeline}>
                      {timeline.map((node, index) => {
                        const isLast = index === timeline.length - 1;
                        const dotColor = statusDotColor(node.status, palette);
                        return (
                          <View key={node.key} style={styles.timelineRow}>
                            <View style={styles.timelineRail}>
                              <View style={[styles.timelineDot, { backgroundColor: dotColor, borderColor: palette.surfaceLowest }]} />
                              {!isLast ? (
                                <View style={[styles.timelineLine, { backgroundColor: palette.outlineVariant }]} />
                              ) : null}
                            </View>
                            <View style={styles.timelineContent}>
                              <Text style={[styles.timelineTitle, { color: palette.text }]}>{node.title}</Text>
                              <Text style={[styles.timelineTime, { color: palette.subText }]}>
                                {formatTimestamp(node.occurredAtUtc)}
                              </Text>
                              {node.reason ? (
                                <Text style={[styles.timelineReason, { color: palette.subText }]} numberOfLines={3}>
                                  {node.reason}
                                </Text>
                              ) : null}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              </>
            ) : null}
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: palette.outlineVariant }]}>
            <TouchableOpacity
              style={[styles.closeBtn, { borderColor: palette.outlineVariant }]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Kapat"
            >
              <Text style={[styles.closeBtnText, { color: palette.text }]}>Kapat</Text>
            </TouchableOpacity>
          </View>
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
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  headerText: { flex: 1, marginRight: 12 },
  title: { fontSize: 18, fontWeight: '600', lineHeight: 24, letterSpacing: -0.1 },
  subtitle: { fontSize: 12, fontWeight: '500', lineHeight: 16, marginTop: 2 },
  closeRound: { width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 16, paddingVertical: 16 },
  loadingWrap: { paddingVertical: 32, alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 13, fontWeight: '500' },
  summaryCard: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 20 },
  summaryTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.3, textTransform: 'uppercase' },
  statusPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  statusPillText: { fontSize: 12, fontWeight: '600' },
  summaryTotal: { fontSize: 24, fontWeight: '600', letterSpacing: -0.3 },
  summaryMeta: { fontSize: 12, fontWeight: '500', marginTop: 6 },
  summaryNotes: { fontSize: 12, fontWeight: '500', marginTop: 8, lineHeight: 18 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, gap: 12 },
  itemName: { flex: 1, fontSize: 14, lineHeight: 20 },
  itemAmount: { fontSize: 13, fontWeight: '500' },
  emptyHistory: { fontSize: 13, lineHeight: 18 },
  timeline: { paddingLeft: 2 },
  timelineRow: { flexDirection: 'row' },
  timelineRail: { width: 24, alignItems: 'center' },
  timelineDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, marginTop: 2 },
  timelineLine: { width: 2, flex: 1, marginTop: 2, minHeight: 24 },
  timelineContent: { flex: 1, paddingBottom: 18, paddingLeft: 8 },
  timelineTitle: { fontSize: 15, fontWeight: '600', lineHeight: 20 },
  timelineTime: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  timelineReason: { fontSize: 12, lineHeight: 17, marginTop: 4, fontStyle: 'italic' },
  footer: { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth },
  closeBtn: { minHeight: 44, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 14, fontWeight: '600' }
});
