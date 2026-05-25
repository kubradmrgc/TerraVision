'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import type { ConsultantKpiDto, ConsultantPerformanceBoardDto } from '@terravision/shared';
import { AdminPageShell } from '@/components/admin/AdminPageShell';
import { authService } from '@/services/authService';
import { consultantPerformanceService } from '@/services/consultantPerformanceService';
import { tokenStore } from '@/services/tokenStore';

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatScore(value: number | null): string {
  if (value == null) return '—';
  return value.toFixed(1);
}

export default function ConsultantPerformancePage() {
  const router = useRouter();
  const [board, setBoard] = useState<ConsultantPerformanceBoardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = tokenStore.getToken();
    if (!token) {
      router.replace('/login/admin');
      return;
    }
    if (!authService.isAdmin()) {
      setError('Bu panel yalnızca yöneticiler içindir.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await consultantPerformanceService.getPerformanceBoard();
      setBoard(data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        tokenStore.clearTokens();
        router.replace('/login/admin');
        return;
      }
      setError('Danışman karnesi verileri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const topPerformers = useMemo(() => {
    if (!board) return [];
    return [...board.consultants]
      .filter((c) => c.completedAppointments > 0)
      .sort((a, b) => b.conversionRatePercent - a.conversionRatePercent)
      .slice(0, 5);
  }, [board]);

  if (loading) {
    return (
      <AdminPageShell title="Danışman Karnesi" lead="Yükleniyor…">
        <p className="tv-muted">KPI verileri getiriliyor…</p>
      </AdminPageShell>
    );
  }

  if (error) {
    return (
      <AdminPageShell title="Danışman Karnesi" lead="Danışman performansı ve randevu dönüşüm metrikleri.">
        <p className="tv-error" role="alert">
          {error}
        </p>
      </AdminPageShell>
    );
  }

  const conversion = board?.conversion;
  const consultants = board?.consultants ?? [];

  return (
    <AdminPageShell
      title="Danışman Karnesi"
      lead="Randevuların satışa dönüşümü, memnuniyet puanları ve danışman bazlı KPI özeti."
    >
      <section className="tv-card tv-consultant-kpi-grid" aria-labelledby="conversion-heading">
        <h2 id="conversion-heading" className="tv-section-title">
          Randevu Dönüşüm
        </h2>
        <p className="tv-muted">
          Tamamlanan randevuların satışa dönüşümü; kayıtlı sonuçlar ve müşteri siparişleri üzerinden
          otomatik eşleşme ({conversion?.inferredConversions ?? 0} çıkarım) birlikte sayılır.
        </p>
        <div className="tv-consultant-funnel">
          <div className="tv-consultant-funnel-step">
            <span className="tv-muted">Bekleyen</span>
            <strong>{conversion?.pendingCount ?? 0}</strong>
          </div>
          <div className="tv-consultant-funnel-step">
            <span className="tv-muted">Onaylı</span>
            <strong>{conversion?.approvedCount ?? 0}</strong>
          </div>
          <div className="tv-consultant-funnel-step">
            <span className="tv-muted">Tamamlanan</span>
            <strong>{conversion?.completedCount ?? 0}</strong>
          </div>
          <div className="tv-consultant-funnel-step tv-consultant-funnel-step--highlight">
            <span className="tv-muted">Satışa dönüşen</span>
            <strong>{conversion?.totalConverted ?? 0}</strong>
            <small>{formatPercent(conversion?.conversionRatePercent ?? 0)} dönüşüm</small>
          </div>
        </div>
        <ul className="tv-ar-stats-list">
          <li>
            <span>Kayıtlı dönüşüm</span>
            <strong>{conversion?.recordedConversions ?? 0}</strong>
          </li>
          <li>
            <span>Siparişten çıkarım</span>
            <strong>{conversion?.inferredConversions ?? 0}</strong>
          </li>
          <li>
            <span>Ortalama memnuniyet (1–5)</span>
            <strong>{formatScore(conversion?.averageSatisfactionScore ?? null)}</strong>
          </li>
        </ul>
      </section>

      {topPerformers.length > 0 ? (
        <section className="tv-card tv-ar-stats" style={{ marginTop: 16 }} aria-labelledby="top-heading">
          <h2 id="top-heading" className="tv-section-title">
            En yüksek dönüşüm
          </h2>
          <ul className="tv-ar-stats-list">
            {topPerformers.map((c: ConsultantKpiDto) => (
              <li key={c.consultantId}>
                <span>{c.fullName}</span>
                <strong>{formatPercent(c.conversionRatePercent)}</strong>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="tv-card" style={{ marginTop: 16 }} aria-labelledby="performance-heading">
        <h2 id="performance-heading" className="tv-section-title">
          Danışman Performans
        </h2>
        {consultants.length === 0 ? (
          <p className="tv-muted">Henüz aktif danışman veya randevu kaydı yok.</p>
        ) : (
          <div className="tv-table-wrap">
            <table className="tv-table tv-consultant-table">
              <thead>
                <tr>
                  <th>Danışman</th>
                  <th>Toplam</th>
                  <th>Tamamlanan</th>
                  <th>Satışa dönüşen</th>
                  <th>Dönüşüm %</th>
                  <th>Memnuniyet</th>
                  <th>Sonuç bekleyen</th>
                </tr>
              </thead>
              <tbody>
                {consultants.map((c) => (
                  <tr key={c.consultantId}>
                    <td>
                      <strong>{c.fullName}</strong>
                      <br />
                      <span className="tv-muted">{c.email}</span>
                    </td>
                    <td>{c.totalAppointments}</td>
                    <td>{c.completedAppointments}</td>
                    <td>{c.convertedAppointments}</td>
                    <td>{formatPercent(c.conversionRatePercent)}</td>
                    <td>
                      {formatScore(c.averageSatisfactionScore)}
                      {c.satisfactionResponseCount > 0 ? (
                        <span className="tv-muted"> ({c.satisfactionResponseCount})</span>
                      ) : null}
                    </td>
                    <td>{c.pendingOutcomeCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {board?.generatedAtUtc ? (
        <p className="tv-muted" style={{ marginTop: 12, fontSize: '0.85rem' }}>
          Son güncelleme: {new Date(board.generatedAtUtc).toLocaleString('tr-TR')}
        </p>
      ) : null}
    </AdminPageShell>
  );
}
