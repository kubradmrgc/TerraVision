import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatTryCurrency } from '@terravision/shared';
import type { AppointmentDto } from '../../types/appointment';
import type { OrderDto } from '../../types/order';
import { getOrderStatusLabel } from '../../theme/mobileTheme';
import { mobileTypography } from '../../theme/mobileTypography';
import type { MobilePalette } from '../app/types';
import { StateMessage } from '../../ui/StateMessage';
import { OrderTrackingModal } from '../orders/OrderTrackingModal';
import { pastAppointmentsForProfile, splitOrdersForProfile } from './profileData';

const APPOINTMENT_STATUS_LABELS: Record<number, string> = {
  1: 'Beklemede',
  2: 'Onaylandı',
  3: 'Tamamlandı',
  4: 'İptal'
};

type Props = {
  orders: OrderDto[];
  appointments: AppointmentDto[];
  palette: MobilePalette;
  isLoading: boolean;
  errorMessage: string | null;
};

function orderRef(id: number): string {
  return `#TV-${String(id).padStart(4, '0')}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function ProfileOrdersHistorySection({
  orders,
  appointments,
  palette,
  isLoading,
  errorMessage
}: Props): React.JSX.Element {
  const [trackingOrder, setTrackingOrder] = useState<OrderDto | null>(null);
  const { active, past } = useMemo(() => splitOrdersForProfile(orders), [orders]);
  const pastAppointments = useMemo(() => pastAppointmentsForProfile(appointments), [appointments]);

  return (
    <View style={styles.wrap}>
      <Text style={[styles.sectionTitle, mobileTypography.cardTitle, { color: palette.text }]}>Siparişlerim</Text>

      {isLoading ? <StateMessage text="Siparişler yükleniyor…" color={palette.subText} /> : null}
      {errorMessage ? <StateMessage tone="error" text={errorMessage} /> : null}

      {!isLoading && !errorMessage ? (
        <>
          <Subsection palette={palette} title="Aktif siparişler">
            {active.length === 0 ? (
              <EmptyHint palette={palette} text="Aktif siparişiniz yok." />
            ) : (
              active.map((order) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  palette={palette}
                  onPress={() => setTrackingOrder(order)}
                />
              ))
            )}
          </Subsection>

          <Subsection palette={palette} title="Geçmiş siparişler">
            {past.length === 0 ? (
              <EmptyHint palette={palette} text="Geçmiş sipariş bulunmuyor." />
            ) : (
              past.map((order) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  palette={palette}
                  onPress={() => setTrackingOrder(order)}
                />
              ))
            )}
          </Subsection>

          <Subsection palette={palette} title="Geçmiş randevular">
            {pastAppointments.length === 0 ? (
              <EmptyHint palette={palette} text="Geçmiş randevu bulunmuyor." />
            ) : (
              pastAppointments.map((appt) => (
                <View
                  key={appt.id}
                  style={[styles.apptRow, { borderBottomColor: palette.outlineVariant }]}
                >
                  <Text style={[styles.apptTitle, { color: palette.text }]}>
                    Danışman #{appt.consultantId}
                  </Text>
                  <Text style={[styles.apptMeta, { color: palette.subText }]}>
                    {formatDate(appt.appointmentDate)} · {APPOINTMENT_STATUS_LABELS[appt.status] ?? '—'}
                  </Text>
                  {appt.notes?.trim() ? (
                    <Text style={[styles.apptNotes, { color: palette.subText }]} numberOfLines={2}>
                      {appt.notes}
                    </Text>
                  ) : null}
                </View>
              ))
            )}
          </Subsection>
        </>
      ) : null}

      <OrderTrackingModal
        visible={trackingOrder !== null}
        orderId={trackingOrder?.id ?? null}
        fallbackOrder={trackingOrder}
        palette={palette}
        onClose={() => setTrackingOrder(null)}
      />
    </View>
  );
}

function Subsection({
  palette,
  title,
  children
}: {
  palette: MobilePalette;
  title: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <View style={[styles.subCard, { backgroundColor: palette.card, borderColor: palette.outlineVariant }]}>
      <Text style={[styles.subTitle, { color: palette.subText }]}>{title}</Text>
      {children}
    </View>
  );
}

function EmptyHint({ palette, text }: { palette: MobilePalette; text: string }): React.JSX.Element {
  return <Text style={[styles.empty, { color: palette.subText }]}>{text}</Text>;
}

function OrderRow({
  order,
  palette,
  onPress
}: {
  order: OrderDto;
  palette: MobilePalette;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <TouchableOpacity
      style={[styles.orderRow, { borderBottomColor: palette.outlineVariant }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Sipariş ${orderRef(order.id)}`}
    >
      <View style={styles.orderMeta}>
        <Text style={[styles.orderTitle, { color: palette.text }]}>Sipariş {orderRef(order.id)}</Text>
        <Text style={[styles.orderSub, { color: palette.subText }]}>
          {getOrderStatusLabel(order.status)} · {formatDate(order.createdDate)}
        </Text>
      </View>
      <Text style={[styles.orderAmount, { color: palette.brandTitle }]}>
        {formatTryCurrency(order.totalAmount)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  sectionTitle: { marginBottom: 2 },
  subCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4
  },
  subTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 4,
    textTransform: 'uppercase'
  },
  empty: { fontSize: 13, paddingVertical: 8 },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8
  },
  orderMeta: { flex: 1 },
  orderTitle: { fontSize: 14, fontWeight: '600' },
  orderSub: { fontSize: 12, marginTop: 2 },
  orderAmount: { fontSize: 13, fontWeight: '700' },
  apptRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  apptTitle: { fontSize: 14, fontWeight: '600' },
  apptMeta: { fontSize: 12, marginTop: 2 },
  apptNotes: { fontSize: 12, marginTop: 4 }
});
