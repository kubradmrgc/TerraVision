'use client';

import { useState } from 'react';
import type { CareCatalogPlantDto, CareCatalogSource } from '@terravision/shared';

type Props = {
  catalog: CareCatalogPlantDto[];
  catalogSource?: CareCatalogSource;
  disabled?: boolean;
  onAdd: (productId: number) => Promise<void>;
};

export function AddPlantToGardenCard({ catalog, catalogSource, disabled, onAdd }: Props) {
  const [selectedId, setSelectedId] = useState<number | ''>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const available = catalog.filter((p) => !p.isInMyGarden);

  const handleAdd = async () => {
    if (selectedId === '') return;
    setBusy(true);
    setError(null);
    try {
      await onAdd(Number(selectedId));
      setSelectedId('');
    } catch {
      setError('Bitki eklenemedi. Lütfen tekrar deneyin.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="tv-card tv-garden-add-card">
      <h2 className="tv-subsection-title">Satın almadan bahçeme ekle</h2>
      <p className="tv-muted">
        Mağazadaki bir bitkiyi bahçenize ekleyin; sulama ve bakım takvimi oluşur. Sipariş şart değil.
      </p>
      {catalogSource === 'products-fallback' ? (
        <p className="tv-muted tv-garden-add-hint">
          Liste ürün kataloğundan geldi. Bahçeye eklemek için API&apos;nin güncel sürümle çalıştığından emin olun.
        </p>
      ) : null}
      {available.length === 0 ? (
        <p className="tv-muted">
          {catalog.length === 0
            ? 'Bitki kataloğu yüklenemedi. Müşteri hesabıyla giriş yaptığınızdan ve API\'nin çalıştığından emin olun.'
            : 'Tüm bitkiler zaten bahçenizde.'}
        </p>
      ) : (
        <div className="tv-garden-add-form">
          <label>
            Bitki seçin
            <select
              value={selectedId}
              disabled={disabled || busy}
              onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">— Seçin —</option>
              {available.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="tv-btn tv-btn--primary"
            disabled={disabled || busy || selectedId === ''}
            onClick={() => void handleAdd()}
          >
            {busy ? 'Ekleniyor…' : 'Bahçeme ekle'}
          </button>
        </div>
      )}
      {error ? (
        <p className="tv-error" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
