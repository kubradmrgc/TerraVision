import React, { useMemo, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getOrderStatusLabel } from '../../theme/mobileTheme';
import type { CartChangedEvent, OrderCreatedEvent, OrderStatusChangedEvent } from '../../types/realtime';
import type { MobilePalette, ThemeMode } from '../app/types';
import { StateMessage } from '../../ui/StateMessage';

const LIGHT_SECONDARY_ACCENT = '#006d3e';
const LIGHT_TERTIARY_ACCENT = '#722736';
const LIGHT_TERTIARY_FIXED = '#ffd9dd';
const LIGHT_ON_TERTIARY_FIXED_VARIANT = '#792d3b';
const PRIMARY_CONTAINER_MUTED = 'rgba(22, 101, 52, 0.1)';

const DARK_PRIMARY_FIXED_DIM = '#73db9a';
const DARK_ERROR = '#ffb4ab';
const DARK_ERROR_CONTAINER = '#93000a';

const LOGISTICS_HERO_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAByzL5HBRpf8sw8HBOKlMfzssBAGlmzQAbSMINJxLjNoJOjtkr3sdc_I59PDPMU8ZBaZfVeihNlE1r2YyPmtoosZcfEFCo4Fp4XpePhHBonIJ30Yu-lKyhRORSMvMBrS9FXx63EaFRHMW5QoY3bIAyrrQ2QKD-f2K6zSZtv97zoc51KI7BdDcxx36usZeauOhDp_twCnVU9SeHKtlQAoeCr3iL6BurTSsA3Ul8bFm4UM6yWbnf1EKa5-ptGLBtFkl-yUVawEs6u-Cj';

const MAP_HERO_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBm6YAC8fBkKRmC0iV67OX_O9DjDgFtfT6NRYEK6vpclvMGbLXcQKDmxCgy7m9_SCuMt8Hs1So6R5Fj-RMBkiYoYAB-GfqHL-fxL9_crXVZYI8-mlLjpdY8n74wSNpNGI4Wj8f55Khpv259L3Ugu7bTNt20HhfhQElVyJno8QyKEKA6w0x7332LiH5M7wksnf0FHm3f7YohOgDghYXqZP7X-BT9LvjnJdTyddCtm2TulU4GKTgd6_28dkxp4JiDrBh8N5jnU2TbRwbE';

type Props = {
  events: CartChangedEvent[];
  orderCreatedEvents: OrderCreatedEvent[];
  orderStatusEvents: OrderStatusChangedEvent[];
  palette: MobilePalette;
  themeMode: ThemeMode;
  /** Sum of cart line quantities for “Active Carts” stat */
  activeCartQuantity: number;
};

type FeedAccent = 'secondary' | 'primary' | 'tertiary';
type DarkCardKind = 'critical' | 'user' | 'warning' | 'routine';

type FeedRow = {
  key: string;
  accent: FeedAccent;
  darkKind: DarkCardKind;
  iconGlyph: string;
  title: string;
  body: string;
  sortTime: number;
  timeLabel: string;
};

function parseEventTime(iso?: string): number {
  if (!iso?.trim()) return 0;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function formatRelativeTime(iso?: string): string {
  if (!iso?.trim()) {
    return 'Just now';
  }
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) {
    return 'Recently';
  }
  const diffMs = Date.now() - t;
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return 'Just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

function buildFeedRows(
  events: CartChangedEvent[],
  orderCreatedEvents: OrderCreatedEvent[],
  orderStatusEvents: OrderStatusChangedEvent[]
): FeedRow[] {
  const rows: FeedRow[] = [];

  events.forEach((item, idx) => {
    const t = parseEventTime(item.occurredAtUtc);
    rows.push({
      key: `cart-${idx}-${item.productId}`,
      accent: 'secondary',
      darkKind: 'user',
      iconGlyph: '🛒',
      title: 'Cart Updated',
      body: `User #${item.userId} ${item.action.toLowerCase()} product #${item.productId} (qty ${item.quantity}).`,
      sortTime: t || Date.now() - idx * 120000,
      timeLabel: formatRelativeTime(item.occurredAtUtc)
    });
  });

  orderCreatedEvents.forEach((item, idx) => {
    const t = parseEventTime(item.occurredAtUtc);
    rows.push({
      key: `oc-${idx}-${item.orderId}`,
      accent: 'primary',
      darkKind: 'critical',
      iconGlyph: '⚡',
      title: `Order #${item.orderId} Created`,
      body: `New order total ${item.totalAmount.toFixed(2)} (${getOrderStatusLabel(item.status)}).`,
      sortTime: t || Date.now() - idx * 900000,
      timeLabel: formatRelativeTime(item.occurredAtUtc)
    });
  });

  orderStatusEvents.forEach((item, idx) => {
    const shipped = item.newStatus === 3;
    const cancelled = item.newStatus === 5;
    const t = parseEventTime(item.occurredAtUtc);
    const darkKind: DarkCardKind = cancelled ? 'warning' : shipped ? 'critical' : 'routine';
    const accent: FeedAccent = cancelled ? 'tertiary' : shipped ? 'primary' : 'tertiary';
    rows.push({
      key: `os-${idx}-${item.orderId}`,
      accent,
      darkKind,
      iconGlyph: cancelled ? '⚠️' : shipped ? '🚚' : '🔄',
      title: shipped
        ? `Order #${item.orderId} Shipped`
        : cancelled
          ? `Order #${item.orderId} Cancelled`
          : `Order #${item.orderId} Updated`,
      body: shipped
        ? 'Package status moved to shipped in the fulfillment network.'
        : cancelled
          ? 'Order lifecycle closed; inventory and billing hooks may still be processing.'
          : `Status ${getOrderStatusLabel(item.previousStatus)}→${getOrderStatusLabel(item.newStatus)}.`,
      sortTime: t || Date.now() - idx * 600000,
      timeLabel: formatRelativeTime(item.occurredAtUtc)
    });
  });

  rows.sort((a, b) => b.sortTime - a.sortTime);
  return rows;
}

function accentBorder(accent: FeedAccent, palette: MobilePalette): string {
  switch (accent) {
    case 'secondary':
      return LIGHT_SECONDARY_ACCENT;
    case 'primary':
      return palette.button;
    case 'tertiary':
      return LIGHT_TERTIARY_ACCENT;
    default:
      return palette.border;
  }
}

function iconBubbleStyle(
  accent: FeedAccent,
  palette: MobilePalette
): { bg: string; fg: string } {
  switch (accent) {
    case 'secondary':
      return { bg: palette.secondaryContainer, fg: palette.onSecondaryContainer };
    case 'primary':
      return { bg: PRIMARY_CONTAINER_MUTED, fg: palette.button };
    case 'tertiary':
      return { bg: LIGHT_TERTIARY_FIXED, fg: LIGHT_ON_TERTIARY_FIXED_VARIANT };
    default:
      return { bg: palette.mutedCard, fg: palette.text };
  }
}

function darkPill(row: FeedRow, palette: MobilePalette): { label: string; fg: string; bg: string } {
  switch (row.darkKind) {
    case 'critical':
      return {
        label: 'NODE UPDATE',
        fg: DARK_PRIMARY_FIXED_DIM,
        bg: 'rgba(0, 82, 45, 0.35)'
      };
    case 'user':
      return {
        label: 'CART CHANNEL',
        fg: palette.onSecondaryContainer,
        bg: 'rgba(64, 71, 88, 0.45)'
      };
    case 'warning':
      return {
        label: 'SYSTEM WARNING',
        fg: DARK_ERROR,
        bg: 'rgba(147, 0, 10, 0.35)'
      };
    default:
      return {
        label: 'ROUTINE CYCLE',
        fg: palette.border,
        bg: palette.imagePlaceholder
      };
  }
}

function darkIconTile(row: FeedRow, palette: MobilePalette): { bg: string; fg: string; radius: number } {
  switch (row.darkKind) {
    case 'critical':
      return { bg: palette.primaryContainer, fg: palette.onPrimaryContainer, radius: 8 };
    case 'user':
      return { bg: palette.secondaryContainer, fg: palette.onSecondaryContainer, radius: 8 };
    case 'warning':
      return { bg: DARK_ERROR_CONTAINER, fg: DARK_ERROR, radius: 8 };
    default:
      return { bg: palette.elevatedSurface, fg: palette.border, radius: 8 };
  }
}

export function EventsSection(props: Props): React.JSX.Element {
  const { events, orderCreatedEvents, orderStatusEvents, palette, themeMode, activeCartQuantity } = props;
  const stitchDark = themeMode === 'dark';

  const [darkFilter, setDarkFilter] = useState<'all' | 'alerts'>('all');

  const feedRows = useMemo(
    () => buildFeedRows(events, orderCreatedEvents, orderStatusEvents),
    [events, orderCreatedEvents, orderStatusEvents]
  );

  const totalToday = events.length + orderCreatedEvents.length + orderStatusEvents.length;

  const darkVisibleRows = useMemo(
    () => (darkFilter === 'alerts' ? feedRows.filter((r) => r.darkKind === 'warning') : feedRows),
    [darkFilter, feedRows]
  );

  if (stitchDark) {
    const nodePct = '98.4';

    return (
      <View style={edStyles.root}>
        <View style={edStyles.heroRow}>
          <View
            style={[
              edStyles.heroWide,
              {
                backgroundColor: palette.mutedCard,
                borderColor: palette.outlineVariant
              }
            ]}
          >
            <Text style={[edStyles.heroKicker, { color: DARK_PRIMARY_FIXED_DIM }]}>LIVE STATUS</Text>
            <Text style={[edStyles.heroTitle, { color: palette.text }]}>System Monitoring Active</Text>
            <Text style={[edStyles.heroBody, { color: palette.subText }]}>
              All terraforming nodes in Sector 7 are reporting optimal atmospheric conversion rates.
            </Text>
            <Text style={[edStyles.heroWatermark, { color: palette.border }]}>⎘</Text>
          </View>
          <View
            style={[
              edStyles.heroStat,
              {
                backgroundColor: palette.primaryContainer,
                borderColor: DARK_PRIMARY_FIXED_DIM
              }
            ]}
          >
            <Text style={{ fontSize: 36, marginBottom: 6 }}>⚡</Text>
            <Text style={[edStyles.heroStatValue, { color: palette.onPrimaryContainer }]}>{nodePct}%</Text>
            <Text style={[edStyles.heroStatCap, { color: palette.onPrimaryContainer }]}>NODE EFFICIENCY</Text>
          </View>
        </View>

        <View style={edStyles.streamHead}>
          <Text style={[edStyles.streamTitle, { color: palette.text }]}>Activity Stream</Text>
          <View style={edStyles.chipRow}>
            <TouchableOpacity
              onPress={() => setDarkFilter('all')}
              style={[
                edStyles.filterChip,
                {
                  backgroundColor: darkFilter === 'all' ? palette.primaryContainer : palette.elevatedSurface,
                  borderColor: palette.outlineVariant
                }
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: darkFilter === 'all' }}
              accessibilityLabel="Show all activity"
            >
              <Text
                style={[
                  edStyles.filterChipText,
                  { color: darkFilter === 'all' ? palette.onPrimaryContainer : palette.subText }
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setDarkFilter('alerts')}
              style={[
                edStyles.filterChip,
                {
                  backgroundColor: darkFilter === 'alerts' ? palette.primaryContainer : palette.elevatedSurface,
                  borderColor: darkFilter === 'alerts' ? DARK_PRIMARY_FIXED_DIM : palette.outlineVariant
                }
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: darkFilter === 'alerts' }}
              accessibilityLabel="Show alerts only"
            >
              <Text
                style={[
                  edStyles.filterChipText,
                  { color: darkFilter === 'alerts' ? palette.onPrimaryContainer : palette.subText }
                ]}
              >
                Alerts
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={edStyles.cardList}>
          {darkVisibleRows.length === 0 ? (
            <StateMessage
              text={
                darkFilter === 'alerts'
                  ? 'No alert-level events in the current buffer.'
                  : 'No live events yet. Cart and order activity will appear here.'
              }
              color={palette.subText}
            />
          ) : (
            darkVisibleRows.map((row) => {
              const pill = darkPill(row, palette);
              const tile = darkIconTile(row, palette);
              const warnBorder = row.darkKind === 'warning';
              return (
                <View
                  key={row.key}
                  style={[
                    edStyles.activityCard,
                    {
                      backgroundColor: palette.card,
                      borderColor: palette.outlineVariant,
                      borderLeftWidth: warnBorder ? 4 : 1,
                      borderLeftColor: warnBorder ? DARK_ERROR : palette.outlineVariant
                    }
                  ]}
                >
                  <View style={edStyles.activityInner}>
                    <View
                      style={[
                        edStyles.iconTile,
                        {
                          backgroundColor: tile.bg,
                          borderRadius: tile.radius
                        }
                      ]}
                    >
                      <Text style={{ fontSize: 22, color: tile.fg }}>{row.iconGlyph}</Text>
                    </View>
                    <View style={edStyles.activityMain}>
                      <View style={edStyles.activityMetaRow}>
                        <View style={[edStyles.pill, { backgroundColor: pill.bg }]}>
                          <Text style={[edStyles.pillText, { color: pill.fg }]}>{pill.label}</Text>
                        </View>
                        <Text style={[edStyles.timeCap, { color: palette.border }]}>{row.timeLabel}</Text>
                      </View>
                      <Text style={[edStyles.cardTitle, { color: palette.text }]} numberOfLines={2}>
                        {row.title}
                      </Text>
                      <Text style={[edStyles.cardBody, { color: palette.subText }]} numberOfLines={5}>
                        {row.body}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={edStyles.chevronBtn}
                      onPress={() => Alert.alert('Event', row.title)}
                      accessibilityRole="button"
                      accessibilityLabel="Open event details"
                    >
                      <Text style={{ color: palette.outlineVariant, fontSize: 22 }}>›</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}

          <View style={[edStyles.mapCard, { backgroundColor: palette.mutedCard, borderColor: palette.outlineVariant }]}>
            <View style={[edStyles.mapHead, { borderBottomColor: `${palette.outlineVariant}55` }]}>
              <Text style={[edStyles.mapTitle, { color: palette.text }]}>Regional Activity Map</Text>
              <Text style={[edStyles.mapLive, { color: DARK_PRIMARY_FIXED_DIM }]}>Updating live…</Text>
            </View>
            <View style={[edStyles.mapBody, { backgroundColor: palette.imagePlaceholder }]}>
              <Image source={{ uri: MAP_HERO_URI }} style={edStyles.mapImg} resizeMode="cover" />
              <View style={edStyles.mapDim} />
              <View style={edStyles.pingWrap}>
                <View style={[edStyles.pingOuter, { backgroundColor: DARK_PRIMARY_FIXED_DIM }]} />
                <View style={[edStyles.pingInner, { backgroundColor: DARK_PRIMARY_FIXED_DIM }]} />
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }

  const borderSoft = `${palette.outlineVariant}4D`;

  return (
    <View style={elStyles.root}>
      <View style={elStyles.headerBlock}>
        <Text style={[elStyles.headline, { color: palette.text }]}>Operations Live Feed</Text>
        <Text style={[elStyles.subhead, { color: palette.subText }]}>
          Real-time event tracking and system updates
        </Text>
      </View>

      <View style={elStyles.statsRow}>
        <View style={[elStyles.statCard, { backgroundColor: palette.surfaceLowest, borderColor: borderSoft }]}>
          <Text style={[elStyles.statLabel, { color: palette.subText }]}>Total Today</Text>
          <Text style={[elStyles.statValue, { color: palette.button }]}>
            {Math.max(totalToday, 0).toLocaleString('en-US')}
          </Text>
        </View>
        <View style={[elStyles.statCard, { backgroundColor: palette.surfaceLowest, borderColor: borderSoft }]}>
          <Text style={[elStyles.statLabel, { color: palette.subText }]}>Active Carts</Text>
          <Text style={[elStyles.statValue, { color: LIGHT_SECONDARY_ACCENT }]}>{activeCartQuantity}</Text>
        </View>
        <View style={[elStyles.statCard, { backgroundColor: palette.surfaceLowest, borderColor: borderSoft }]}>
          <Text style={[elStyles.statLabel, { color: palette.subText }]}>Avg. Fulfillment</Text>
          <Text style={[elStyles.statValue, { color: LIGHT_TERTIARY_ACCENT }]}>14m</Text>
        </View>
      </View>

      <View style={elStyles.mainRow}>
        <View style={elStyles.feedCol}>
          {feedRows.length === 0 ? (
            <StateMessage text="No live events yet. Cart and order activity will appear here." color={palette.subText} />
          ) : (
            feedRows.map((row) => {
              const bubble = iconBubbleStyle(row.accent, palette);
              return (
                <View
                  key={row.key}
                  style={[
                    elStyles.feedCard,
                    {
                      backgroundColor: palette.surfaceLowest,
                      borderColor: borderSoft,
                      borderLeftColor: accentBorder(row.accent, palette)
                    }
                  ]}
                >
                  <View style={[elStyles.iconBubble, { backgroundColor: bubble.bg }]}>
                    <Text style={{ fontSize: 18 }}>{row.iconGlyph}</Text>
                  </View>
                  <View style={elStyles.feedBody}>
                    <View style={elStyles.feedTopLine}>
                      <Text style={[elStyles.feedTitle, { color: palette.text }]} numberOfLines={1}>
                        {row.title}
                      </Text>
                      <Text style={[elStyles.feedTime, { color: palette.subText }]}>{row.timeLabel}</Text>
                    </View>
                    <Text style={[elStyles.feedDetail, { color: palette.subText }]} numberOfLines={4}>
                      {row.body}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={elStyles.sideCol}>
          <View style={[elStyles.hero, { backgroundColor: palette.imagePlaceholder }]}>
            <Image source={{ uri: LOGISTICS_HERO_URI }} style={elStyles.heroImg} resizeMode="cover" />
            <View style={elStyles.heroGradient} />
            <Text style={elStyles.heroCaption}>Logistics Center North</Text>
          </View>

          <View style={[elStyles.assistCard, { backgroundColor: palette.button }]}>
            <Text style={[elStyles.assistTitle, { color: palette.buttonText }]}>Need Assistance?</Text>
            <Text style={[elStyles.assistBody, { color: palette.buttonText }]}>
              Our field operations team is active 24/7 for support.
            </Text>
            <TouchableOpacity
              style={[elStyles.dispatchBtn, { backgroundColor: palette.buttonText }]}
              onPress={() => Alert.alert('Dispatch', 'Connecting to dispatch is not wired in this preview build.')}
              accessibilityRole="button"
              accessibilityLabel="Contact dispatch"
            >
              <Text style={[elStyles.dispatchBtnText, { color: palette.button }]}>Contact Dispatch</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const elStyles = StyleSheet.create({
  root: { marginBottom: 12 },
  headerBlock: { marginBottom: 20 },
  headline: { fontSize: 18, fontWeight: '600', lineHeight: 24, letterSpacing: -0.1, marginBottom: 4 },
  subhead: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
  statCard: {
    flexGrow: 1,
    flexBasis: '28%',
    minWidth: 96,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  statLabel: { fontSize: 12, fontWeight: '500', lineHeight: 16, letterSpacing: 0.01, marginBottom: 4 },
  statValue: { fontSize: 24, fontWeight: '600', lineHeight: 32, letterSpacing: -0.2 },
  mainRow: { flexDirection: 'column', gap: 16 },
  feedCol: { gap: 12, flex: 1 },
  sideCol: { gap: 12 },
  feedCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6
  },
  feedBody: { flex: 1 },
  feedTopLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  feedTitle: { fontSize: 14, lineHeight: 20, fontWeight: '600', flex: 1 },
  feedTime: { fontSize: 12, fontWeight: '500', lineHeight: 16, letterSpacing: 0.01 },
  feedDetail: { fontSize: 14, lineHeight: 20, marginTop: 4 },
  hero: {
    height: 192,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4
  },
  heroImg: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, width: '100%', height: '100%' },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)'
  },
  heroCaption: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: -0.1,
    color: '#ffffff'
  },
  assistCard: {
    borderRadius: 12,
    padding: 16,
    gap: 8
  },
  assistTitle: { fontSize: 18, fontWeight: '600', lineHeight: 24, letterSpacing: -0.1 },
  assistBody: { fontSize: 12, fontWeight: '500', lineHeight: 16, letterSpacing: 0.01, opacity: 0.92 },
  dispatchBtn: {
    marginTop: 8,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center'
  },
  dispatchBtnText: { fontSize: 14, fontWeight: '600', lineHeight: 20 }
});

const edStyles = StyleSheet.create({
  root: { marginBottom: 16, gap: 20 },
  heroRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'stretch' },
  heroWide: {
    flex: 1,
    minWidth: 220,
    minHeight: 160,
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    overflow: 'hidden',
    position: 'relative'
  },
  heroKicker: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 6,
    textTransform: 'uppercase' as const
  },
  heroTitle: { fontSize: 22, fontWeight: '600', lineHeight: 28, letterSpacing: -0.2, maxWidth: 320 },
  heroBody: { fontSize: 14, lineHeight: 20, marginTop: 10, maxWidth: 300 },
  heroWatermark: {
    position: 'absolute',
    right: -20,
    bottom: -28,
    fontSize: 100,
    opacity: 0.12
  },
  heroStat: {
    width: 140,
    minHeight: 160,
    borderRadius: 12,
    borderWidth: 1,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroStatValue: { fontSize: 26, fontWeight: '800', lineHeight: 32 },
  heroStatCap: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginTop: 6, textTransform: 'uppercase' as const },
  streamHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12
  },
  streamTitle: { fontSize: 18, fontWeight: '600', lineHeight: 24, letterSpacing: -0.1 },
  chipRow: { flexDirection: 'row', gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1
  },
  filterChipText: { fontSize: 12, fontWeight: '600', lineHeight: 16 },
  cardList: { gap: 14 },
  activityCard: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2
  },
  activityInner: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12 },
  iconTile: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center'
  },
  activityMain: { flex: 1 },
  activityMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8
  },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, maxWidth: '70%' },
  pillText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' as const },
  timeCap: { fontSize: 12, fontWeight: '500', lineHeight: 16, letterSpacing: 0.02 },
  cardTitle: { fontSize: 15, fontWeight: '700', lineHeight: 22, marginTop: 2 },
  cardBody: { fontSize: 14, lineHeight: 20, marginTop: 6 },
  chevronBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  mapCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 4
  },
  mapHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  mapTitle: { fontSize: 18, fontWeight: '600', lineHeight: 24, letterSpacing: -0.1 },
  mapLive: { fontSize: 12, fontWeight: '500', lineHeight: 16 },
  mapBody: { height: 192, position: 'relative' },
  mapImg: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, width: '100%', height: '100%', opacity: 0.55 },
  mapDim: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 20, 38, 0.35)'
  },
  pingWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pingOuter: {
    width: 14,
    height: 14,
    borderRadius: 999,
    opacity: 0.45
  },
  pingInner: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 999,
    opacity: 0.95
  }
});
