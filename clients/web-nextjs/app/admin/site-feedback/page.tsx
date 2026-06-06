'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminPageShell } from '@/components/admin/AdminPageShell';
import {
  channelKeyLabel,
  feedbackKindLabel,
  feedbackStatusLabel,
  siteSupportService,
  type SiteContactChannelAdmin,
  type SiteFeedbackSubmission
} from '@/services/siteSupportService';
import { getApiErrorMessage } from '@/utils/apiError';

export default function AdminSiteFeedbackPage() {
  const [channels, setChannels] = useState<SiteContactChannelAdmin[]>([]);
  const [items, setItems] = useState<SiteFeedbackSubmission[]>([]);
  const [newCount, setNewCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'new' | 'reviewed'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const overview = await siteSupportService.getAdminOverview(200);
      setChannels(overview.channels);
      setItems(overview.submissions);
      setNewCount(overview.newSubmissionCount);
      setTotalCount(overview.totalSubmissionCount);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Destek verileri yüklenemedi.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleItems = useMemo(() => {
    if (filter === 'new') {
      return items.filter((i) => i.status === 0);
    }
    if (filter === 'reviewed') {
      return items.filter((i) => i.status === 1);
    }
    return items;
  }, [items, filter]);

  const handleMarkReviewed = async (id: number) => {
    setUpdatingId(id);
    setError(null);
    try {
      const updated = await siteSupportService.markSubmissionReviewed(id);
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      setNewCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Durum güncellenemedi.'));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AdminPageShell
      title="Destek & geri bildirim"
      lead="Sitede görünen iletişim e-postaları ve kullanıcıların user story olarak gönderdiği site sorunları."
      actions={
        <button type="button" className="tv-btn" onClick={() => void load()} disabled={loading}>
          Yenile
        </button>
      }
    >
      {error ? (
        <p className="tv-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="tv-admin-stat-row" style={{ marginBottom: 20 }}>
        <div className="tv-admin-stat-card" style={{ cursor: 'default' }}>
          <span className="tv-admin-stat-label">Yeni geri bildirim</span>
          <span className="tv-admin-stat-desc">{newCount} kayıt</span>
        </div>
        <div className="tv-admin-stat-card" style={{ cursor: 'default' }}>
          <span className="tv-admin-stat-label">Toplam geri bildirim</span>
          <span className="tv-admin-stat-desc">{totalCount} kayıt</span>
        </div>
        <div className="tv-admin-stat-card" style={{ cursor: 'default' }}>
          <span className="tv-admin-stat-label">İletişim kanalı</span>
          <span className="tv-admin-stat-desc">{channels.length} e-posta</span>
        </div>
      </div>

      <section className="tv-card" style={{ marginBottom: 20, padding: 16 }} aria-labelledby="admin-channels-title">
        <h2 id="admin-channels-title" className="tv-section-title">
          İletişim e-postaları (veritabanı)
        </h2>
        <p className="tv-muted" style={{ marginTop: 0, marginBottom: 12 }}>
          Bu adresler sitenin alt çubuğunda Destek ve İletişim bölümlerinde gösterilir.
        </p>
        {loading ? <p className="tv-muted">Yükleniyor…</p> : null}
        {!loading && channels.length === 0 ? (
          <p className="tv-muted">Kanal bulunamadı. API migration uygulandı mı kontrol edin.</p>
        ) : null}
        {!loading && channels.length > 0 ? (
          <div className="tv-admin-table-wrap">
            <table className="tv-admin-table">
              <thead>
                <tr>
                  <th scope="col">Alan</th>
                  <th scope="col">Etiket</th>
                  <th scope="col">E-posta</th>
                  <th scope="col">Durum</th>
                </tr>
              </thead>
              <tbody>
                {channels.map((ch) => (
                  <tr key={ch.id}>
                    <td>{channelKeyLabel(ch.channelKey)}</td>
                    <td>{ch.label}</td>
                    <td>
                      <a href={`mailto:${ch.email}`}>{ch.email}</a>
                    </td>
                    <td>{ch.isActive ? 'Aktif' : 'Pasif'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section aria-labelledby="admin-feedback-title">
        <div className="tv-admin-feedback-toolbar">
          <h2 id="admin-feedback-title" className="tv-section-title" style={{ margin: 0 }}>
            Kullanıcı geri bildirimleri
          </h2>
          <div className="tv-admin-feedback-filters" role="group" aria-label="Filtre">
            <button
              type="button"
              className={`tv-btn${filter === 'all' ? ' tv-btn--primary' : ''}`}
              onClick={() => setFilter('all')}
            >
              Tümü ({items.length})
            </button>
            <button
              type="button"
              className={`tv-btn${filter === 'new' ? ' tv-btn--primary' : ''}`}
              onClick={() => setFilter('new')}
            >
              Yeni ({items.filter((i) => i.status === 0).length})
            </button>
            <button
              type="button"
              className={`tv-btn${filter === 'reviewed' ? ' tv-btn--primary' : ''}`}
              onClick={() => setFilter('reviewed')}
            >
              İncelendi ({items.filter((i) => i.status === 1).length})
            </button>
          </div>
        </div>

        {loading ? <p className="tv-muted">Yükleniyor…</p> : null}
        {!loading && visibleItems.length === 0 ? (
          <p className="tv-muted">Bu filtrede kayıt yok. Siteden bir sorun bildirimi göndererek test edebilirsiniz.</p>
        ) : null}
        {!loading && visibleItems.length > 0 ? (
          <ul className="tv-admin-feedback-list">
            {visibleItems.map((item) => (
              <li key={item.id} className="tv-card tv-admin-feedback-item">
                <div className="tv-admin-feedback-meta">
                  <span className="tv-badge-ar">{feedbackKindLabel(item.kind)}</span>
                  <span className={`tv-admin-feedback-status tv-admin-feedback-status--${item.status}`}>
                    {feedbackStatusLabel(item.status)}
                  </span>
                  <time dateTime={item.createdDate}>
                    {new Date(item.createdDate).toLocaleString('tr-TR')}
                  </time>
                </div>
                <p>
                  <strong>
                    <a href={`mailto:${item.email}`}>{item.email}</a>
                  </strong>
                  {item.userId != null ? ` · kullanıcı #${item.userId}` : ' · misafir'}
                </p>
                <p className="tv-admin-feedback-story">{item.userStory}</p>
                {item.pageUrl ? (
                  <p className="tv-muted">
                    Sayfa:{' '}
                    <a href={item.pageUrl} target="_blank" rel="noreferrer">
                      {item.pageUrl}
                    </a>
                  </p>
                ) : null}
                {item.status === 0 ? (
                  <button
                    type="button"
                    className="tv-btn tv-btn--primary"
                    disabled={updatingId === item.id}
                    onClick={() => void handleMarkReviewed(item.id)}
                  >
                    {updatingId === item.id ? 'Kaydediliyor…' : 'İncelendi olarak işaretle'}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </AdminPageShell>
  );
}
