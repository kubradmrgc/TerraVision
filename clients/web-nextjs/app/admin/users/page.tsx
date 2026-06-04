'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  AdminUserDto,
  USER_ROLE,
  USER_ROLE_LABELS_TR,
  type UserRoleId
} from '@terravision/shared';
import { AdminPageShell } from '@/components/admin/AdminPageShell';
import { userAdminService } from '@/services/userAdminService';
import { tokenStore } from '@/services/tokenStore';

const roleFilterOptions: { value: number; label: string }[] = [
  { value: 0, label: 'Tüm roller' },
  { value: USER_ROLE.Customer, label: USER_ROLE_LABELS_TR[USER_ROLE.Customer] },
  { value: USER_ROLE.Consultant, label: USER_ROLE_LABELS_TR[USER_ROLE.Consultant] },
  { value: USER_ROLE.Admin, label: USER_ROLE_LABELS_TR[USER_ROLE.Admin] }
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [roleFilter, setRoleFilter] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await userAdminService.getUsers({
        page,
        pageSize,
        search: search.trim() || undefined,
        role: roleFilter > 0 ? (roleFilter as UserRoleId) : undefined,
        includeInactive
      });
      setUsers(result.items);
      setTotalCount(result.totalCount);
      setTotalPages(Math.max(1, result.totalPages));
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        tokenStore.clearTokens();
        router.replace('/login/admin');
        return;
      }
      setError('Kullanıcı listesi yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, roleFilter, includeInactive, router]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminPageShell
      title="Kayıtlı kullanıcılar"
      lead="Sisteme kayıtlı müşteri, danışman ve yönetici hesaplarını listeleyin."
    >
      <form
        className="tv-admin-filters tv-card"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearch(searchInput);
        }}
      >
        <div className="tv-admin-filters-row">
          <label>
            Ara (e-posta veya ad)
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="ornek@mail.com"
            />
          </label>
          <label>
            Rol
            <select value={roleFilter} onChange={(e) => setRoleFilter(Number(e.target.value))}>
              {roleFilterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Sayfa boyutu
            <select
              value={pageSize}
              onChange={(e) => {
                setPage(1);
                setPageSize(Number(e.target.value));
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </label>
          <label className="tv-admin-checkbox">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => {
                setPage(1);
                setIncludeInactive(e.target.checked);
              }}
            />
            Pasif hesapları göster
          </label>
        </div>
        <button type="submit" className="tv-btn tv-btn--primary">
          Filtrele
        </button>
      </form>

      {error ? (
        <p className="tv-error" role="alert">
          {error}
        </p>
      ) : null}

      <p className="tv-muted" style={{ marginTop: 16 }}>
        Toplam {totalCount} kullanıcı
        {loading ? ' · yükleniyor…' : ''}
      </p>

      <div className="tv-admin-table-wrap">
        <table className="tv-admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Ad soyad</th>
              <th>E-posta</th>
              <th>Rol</th>
              <th>Kayıt</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>
                  {user.firstName} {user.lastName}
                </td>
                <td>{user.email}</td>
                <td>{USER_ROLE_LABELS_TR[user.role as UserRoleId] ?? user.role}</td>
                <td>{formatDate(user.createdDate)}</td>
                <td>
                  <span className={user.isActive ? 'tv-pill tv-pill--ok' : 'tv-pill tv-pill--muted'}>
                    {user.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
              </tr>
            ))}
            {!loading && users.length === 0 ? (
              <tr>
                <td colSpan={6} className="tv-muted">
                  Kriterlere uygun kullanıcı bulunamadı.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <nav className="tv-admin-pagination" aria-label="Sayfalama">
          <button
            type="button"
            className="tv-btn"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Önceki
          </button>
          <span className="tv-muted">
            Sayfa {page} / {totalPages}
          </span>
          <button
            type="button"
            className="tv-btn"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Sonraki
          </button>
        </nav>
      ) : null}
    </AdminPageShell>
  );
}
