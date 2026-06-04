'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  CARE_ACTION_LABELS,
  CARE_URGENCY_LABELS,
  CareActionType,
  CareTaskUrgency,
  PlantCareCalendarDto
} from '@terravision/shared';
import { ProfileSubnav } from '@/components/profile/ProfileSubnav';
import { AddPlantToGardenCard } from '@/components/care/AddPlantToGardenCard';
import { CareAssistantChat } from '@/components/care/CareAssistantChat';
import { careService } from '@/services/careService';
import type { CareCatalogPlantDto } from '@terravision/shared';
import { authService } from '@/services/authService';
import { tokenStore } from '@/services/tokenStore';

function urgencyClass(urgency: CareTaskUrgency): string {
  if (urgency === 3) return 'tv-garden-card--overdue';
  if (urgency === 2) return 'tv-garden-card--today';
  if (urgency === 1) return 'tv-garden-card--upcoming';
  return '';
}

function actionButtonLabel(actionType: CareActionType): string {
  if (actionType === 1) return 'Suladım';
  if (actionType === 2) return 'Gübreledim';
  return 'Temizledim';
}

function formatDue(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function MyGardenPage() {
  const router = useRouter();
  const [plants, setPlants] = useState<PlantCareCalendarDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mutatingKey, setMutatingKey] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<CareCatalogPlantDto[]>([]);
  const [catalogSource, setCatalogSource] = useState<'care-api' | 'products-fallback'>('care-api');

  const load = useCallback(async () => {
    if (!tokenStore.getToken()) {
      router.replace('/login');
      return;
    }
    if (!authService.isCustomer()) {
      setError(
        'Bahçem yalnızca müşteri hesapları içindir. Demo: customer@terravision.com / customer123'
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    let loadedPlants: PlantCareCalendarDto[] = [];
    try {
      const calendar = await careService.getMyCalendar();
      loadedPlants = calendar.plants;
      setPlants(loadedPlants);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        tokenStore.clearTokens();
        router.replace('/login');
        return;
      }
      const apiMessage =
        axios.isAxiosError(err) && typeof err.response?.data === 'object' && err.response.data !== null
          ? String((err.response.data as { message?: string }).message ?? '')
          : '';
      setError(apiMessage || 'Bakım takvimi yüklenemedi. Lütfen tekrar deneyin.');
      setLoading(false);
      return;
    }

    try {
      const { plants, source } = await careService.getCatalogPlantsWithMeta(loadedPlants);
      setCatalog(plants);
      setCatalogSource(source);
    } catch {
      setCatalog([]);
      setCatalogSource('care-api');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleComplete = async (calendarId: number, actionType: CareActionType) => {
    const key = `${calendarId}-${actionType}`;
    setMutatingKey(key);
    setError(null);
    setSuccess(null);
    try {
      const updated = await careService.completeAction(calendarId, actionType);
      setPlants((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setSuccess('Bakım görevi kaydedildi.');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        tokenStore.clearTokens();
        router.replace('/login');
        return;
      }
      const message =
        axios.isAxiosError(err) && typeof err.response?.data === 'object' && err.response.data !== null
          ? String((err.response.data as { message?: string }).message ?? '')
          : '';
      setError(message || 'Görev tamamlanamadı.');
    } finally {
      setMutatingKey(null);
    }
  };

  if (loading) {
    return <p className="tv-muted">Bahçeniz yükleniyor…</p>;
  }

  return (
    <div className="tv-page-garden">
      <ProfileSubnav />
      <h1 className="tv-page-title">Bahçem</h1>
      <p className="tv-page-lead">
        Bitkilerinizi satın almadan bahçenize ekleyebilir, bakım takibi yapabilir ve asistandan öneri alabilirsiniz.
        Teslim edilen siparişler otomatik eklenir.
      </p>
      <p className="tv-page-actions">
        <Link href="/products">Ürünlere dön</Link>
        {' · '}
        <Link href="/profile/ar-rooms">AR odalarım</Link>
      </p>

      {success ? (
        <p className="tv-success" role="status">
          {success}
        </p>
      ) : null}
      {error ? (
        <p className="tv-error" role="alert">
          {error}
        </p>
      ) : null}

      {!error ? (
        <>
          <AddPlantToGardenCard
            catalog={catalog}
            catalogSource={catalogSource}
            onAdd={async (productId) => {
              const added = await careService.addPlantToGarden(productId);
              setPlants((prev) => {
                const without = prev.filter((p) => p.productId !== added.productId);
                return [...without, added].sort((a, b) => a.productName.localeCompare(b.productName, 'tr'));
              });
              setCatalog((prev) =>
                prev.map((p) => (p.id === productId ? { ...p, isInMyGarden: true } : p))
              );
              setSuccess(`${added.productName} bahçenize eklendi.`);
            }}
          />
          <CareAssistantChat catalog={catalog} />
        </>
      ) : null}

      {!error && plants.length === 0 ? (
        <div className="tv-card tv-card--empty">
          <p>Henüz takvimde bitki yok.</p>
          <p className="tv-muted">Yukarıdan ekleyin veya asistana bitki adıyla soru sorun.</p>
        </div>
      ) : null}

      <div className="tv-garden-grid">
        {plants.map((plant) => (
          <article
            key={plant.id}
            className={`tv-card tv-garden-card ${urgencyClass(plant.overallUrgency)}`}
          >
            <header className="tv-garden-card-header">
              <h2 className="tv-section-title">{plant.productName}</h2>
              <span className="tv-garden-urgency-badge">{CARE_URGENCY_LABELS[plant.overallUrgency]}</span>
            </header>
            {plant.careInstructions ? <p className="tv-muted">{plant.careInstructions}</p> : null}
            <ul className="tv-garden-tasks">
              {plant.tasks.map((task) => {
                const key = `${plant.id}-${task.actionType}`;
                const busy = mutatingKey === key;
                return (
                  <li key={key} className={`tv-garden-task ${urgencyClass(task.urgency)}`}>
                    <div>
                      <strong>{CARE_ACTION_LABELS[task.actionType]}</strong>
                      <p className="tv-muted">
                        Sonraki: {formatDue(task.nextDueAt)} · {CARE_URGENCY_LABELS[task.urgency]}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="tv-btn tv-btn--primary tv-btn--compact"
                      disabled={mutatingKey !== null}
                      onClick={() => void handleComplete(plant.id, task.actionType)}
                    >
                      {busy ? 'Kaydediliyor…' : actionButtonLabel(task.actionType)}
                    </button>
                  </li>
                );
              })}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
