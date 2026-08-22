'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import type { AppointmentDto, OrderDto } from '@terravision/shared';
import { formatTryCurrency } from '@terravision/shared';
import { ProfileSubnav } from '@/components/profile/ProfileSubnav';
import { pastAppointmentsForProfile, splitOrdersForProfile } from '@/components/profile/profileData';
import { appointmentService } from '@/services/appointmentService';
import { orderService } from '@/services/orderService';
import { tokenStore } from '@/services/tokenStore';
import { useAuthSession } from '@/hooks/useAuthSession';

const ORDER_STATUS_TR: Record<number, string> = {
  1: 'Beklemede',
  2: 'Onaylandı',
  3: 'Kargoda',
  4: 'Teslim edildi',
  5: 'İptal'
};

const APPOINTMENT_STATUS_TR: Record<number, string> = {
  1: 'Beklemede',
  2: 'Onaylandı',
  3: 'Tamamlandı',
  4: 'İptal'
};

function orderRef(id: number): string {
  return `#TV-${String(id).padStart(4, '0')}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ProfileOrdersPage() {
  const router = useRouter();
  const { ready, isAuthenticated, isCustomer } = useAuthSession();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { active, past } = useMemo(() => splitOrdersForProfile(orders), [orders]);
  const pastAppointments = useMemo(() => pastAppointmentsForProfile(appointments), [appointments]);

  const load = useCallback(async () => {
    if (!tokenStore.getToken()) {
      router.replace('/login');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [orderList, apptList] = await Promise.all([
        orderService.getMyOrders(),
        appointmentService.getCustomerAppointments()
      ]);
      setOrders(orderList);
      setAppointments(apptList);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        tokenStore.clearTokens();
        router.replace('/login');
        return;
      }
      setError('Sipariş ve randevu bilgileri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (!isCustomer) {
      router.replace('/products');
      return;
    }
    void load();
  }, [ready, isAuthenticated, isCustomer, load, router]);

  if (!ready || !isAuthenticated || !isCustomer) {
    return <p className="tv-muted">Siparişler yükleniyor…</p>;
  }

  return (
    <div>
      <ProfileSubnav />
      <header className="tv-ar-page-header">
        <div>
          <span className="tv-login-pill">Hesabım</span>
          <h1 className="tv-page-title">Siparişlerim</h1>
          <p className="tv-page-lead">Aktif ve geçmiş siparişleriniz ile geçmiş randevularınız.</p>
        </div>
      </header>

      {error ? (
        <p className="tv-error" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? <p className="tv-muted">Yükleniyor…</p> : null}

      {!loading && !error ? (
        <div className="tv-profile-orders-stack">
          <OrderBlock title="Aktif siparişler" orders={active} empty="Aktif siparişiniz yok." />
          <OrderBlock title="Geçmiş siparişler" orders={past} empty="Geçmiş sipariş bulunmuyor." />
          <section className="tv-card">
            <h2 className="tv-subsection-title">Geçmiş randevular</h2>
            {pastAppointments.length === 0 ? (
              <p className="tv-muted">Geçmiş randevu bulunmuyor.</p>
            ) : (
              <ul className="tv-profile-order-list">
                {pastAppointments.map((appt) => (
                  <li key={appt.id}>
                    <strong>Danışman #{appt.consultantId}</strong>
                    <span className="tv-muted">
                      {formatDate(appt.appointmentDate)} · {APPOINTMENT_STATUS_TR[appt.status] ?? '—'}
                    </span>
                    {appt.notes?.trim() ? <p className="tv-muted">{appt.notes}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}

      <p className="tv-page-actions">
        <Link href="/profile/account">Bilgilerim</Link>
        {' · '}
        <Link href="/cart">Sepete git</Link>
      </p>
    </div>
  );
}

function OrderBlock({
  title,
  orders,
  empty
}: {
  title: string;
  orders: OrderDto[];
  empty: string;
}): React.JSX.Element {
  return (
    <section className="tv-card">
      <h2 className="tv-subsection-title">{title}</h2>
      {orders.length === 0 ? (
        <p className="tv-muted">{empty}</p>
      ) : (
        <ul className="tv-profile-order-list">
          {orders.map((order) => (
            <li key={order.id}>
              <div>
                <strong>Sipariş {orderRef(order.id)}</strong>
                <span className="tv-muted">
                  {ORDER_STATUS_TR[order.status] ?? '—'} · {formatDate(order.createdDate)}
                </span>
              </div>
              <span>{formatTryCurrency(order.totalAmount)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
