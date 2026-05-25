'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent
} from 'react';
import { AdminPageShell } from '@/components/admin/AdminPageShell';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { categoryService, type CategoryDto } from '@/services/categoryService';
import { productService } from '@/services/productService';
import { tokenStore } from '@/services/tokenStore';
import { getApiErrorMessage, isUnauthorized } from '@/utils/apiError';
import { resolveMediaUrl } from '@/utils/mediaUrl';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

type FormState = {
  name: string;
  description: string;
  sku: string;
  categoryId: string;
  price: string;
  stockQuantity: string;
  minStockLevel: string;
  isArCompatible: boolean;
  wateringIntervalDays: string;
  fertilizingIntervalDays: string;
  cleaningIntervalDays: string;
  careInstructions: string;
};

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  sku: '',
  categoryId: '',
  price: '',
  stockQuantity: '',
  minStockLevel: '5',
  isArCompatible: false,
  wateringIntervalDays: '',
  fertilizingIntervalDays: '',
  cleaningIntervalDays: '',
  careInstructions: ''
};

const PLANT_CARE_TEMPLATE = {
  wateringIntervalDays: '7',
  fertilizingIntervalDays: '30',
  cleaningIntervalDays: '14',
  careInstructions: 'Toprak yüzeyi kuruyunca sulayın; doğrudan güneşten kaçının.'
};

function parseOptionalInterval(value: string): number | null | 'invalid' {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const n = Number(trimmed);
  if (!Number.isInteger(n) || n < 1 || n > 365) {
    return 'invalid';
  }
  return n;
}

function isPlantCategory(category: CategoryDto | undefined): boolean {
  if (!category) {
    return false;
  }
  return category.id === 1 || category.id === 2 || /bitki/i.test(category.name);
}

function suggestSku(name: string): string {
  const slug = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24);
  if (!slug) {
    return '';
  }
  return `PLT-${slug}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
}

function validateImage(file: File | null): string | null {
  if (!file) {
    return 'Ürün görseli seçin (JPG, PNG veya WebP).';
  }
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    return 'Yalnızca JPG, PNG veya WebP yükleyebilirsiniz.';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'Görsel en fazla 5 MB olabilir.';
  }
  return null;
}

export default function AdminNewProductPage() {
  const router = useRouter();
  const { status, deniedMessage } = useAdminGuard();
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ name: string; id: number; imageUrl: string } | null>(null);

  const loadCategories = useCallback(async () => {
    setLoadingCategories(true);
    setCategoriesError(null);
    try {
      const list = await categoryService.getCategories();
      setCategories(list);
      if (list.length > 0) {
        setForm((prev) => (prev.categoryId ? prev : { ...prev, categoryId: String(list[0].id) }));
      }
    } catch (err) {
      if (isUnauthorized(err)) {
        tokenStore.clearTokens();
        router.replace('/login/admin');
        return;
      }
      setCategoriesError(getApiErrorMessage(err, 'Kategoriler yüklenemedi.'));
    } finally {
      setLoadingCategories(false);
    }
  }, [router]);

  useEffect(() => {
    if (status !== 'ready') {
      return;
    }
    void loadCategories();
  }, [status, loadCategories]);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const applyImageFile = (file: File | null) => {
    const message = validateImage(file);
    setImageError(message);
    setImageFile(message ? null : file);
    if (message && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    applyImageFile(event.target.files?.[0] ?? null);
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      applyImageFile(file);
      if (fileInputRef.current) {
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInputRef.current.files = dt.files;
      }
    }
  };

  const resetForm = () => {
    setForm((prev) => ({
      ...EMPTY_FORM,
      categoryId: prev.categoryId || (categories[0] ? String(categories[0].id) : '')
    }));
    setImageFile(null);
    setImageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const imageValidation = validateImage(imageFile);
    if (imageValidation) {
      setImageError(imageValidation);
      return;
    }

    const categoryId = Number(form.categoryId);
    const price = Number(form.price);
    const stockQuantity = Number(form.stockQuantity);
    const minStockLevel = Number(form.minStockLevel);

    if (!form.name.trim() || !form.description.trim() || !form.sku.trim()) {
      setError('Ad, açıklama ve SKU alanları zorunludur.');
      return;
    }

    if (
      !categoryId ||
      Number.isNaN(price) ||
      price < 0 ||
      Number.isNaN(stockQuantity) ||
      stockQuantity < 0 ||
      Number.isNaN(minStockLevel) ||
      minStockLevel < 0
    ) {
      setError('Kategori, fiyat ve stok değerlerini kontrol edin.');
      return;
    }

    const watering = parseOptionalInterval(form.wateringIntervalDays);
    const fertilizing = parseOptionalInterval(form.fertilizingIntervalDays);
    const cleaning = parseOptionalInterval(form.cleaningIntervalDays);
    if (watering === 'invalid' || fertilizing === 'invalid' || cleaning === 'invalid') {
      setError('Bakım aralıkları 1–365 gün arasında tam sayı olmalıdır (boş bırakılabilir).');
      return;
    }

    setSubmitting(true);
    try {
      const product = await productService.createWithImage({
        name: form.name.trim(),
        description: form.description.trim(),
        price,
        stockQuantity,
        minStockLevel,
        sku: form.sku.trim(),
        categoryId,
        isArCompatible: form.isArCompatible,
        image: imageFile!,
        wateringIntervalDays: watering,
        fertilizingIntervalDays: fertilizing,
        cleaningIntervalDays: cleaning,
        careInstructions: form.careInstructions.trim() || null
      });

      setSuccess({ name: product.name, id: product.id, imageUrl: product.imageUrl });
      resetForm();
    } catch (err) {
      if (isUnauthorized(err)) {
        tokenStore.clearTokens();
        router.replace('/login/admin');
        return;
      }
      setError(getApiErrorMessage(err, 'Ürün kaydedilemedi. Görsel veya alanları kontrol edin.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading') {
    return <p className="tv-muted">Oturum doğrulanıyor…</p>;
  }

  if (status === 'denied') {
    return (
      <AdminPageShell
        title="Ürün yönetimi"
        lead="Bu alana yalnızca yönetici hesapları erişebilir."
      >
        <p className="tv-error" role="alert">
          {deniedMessage}
        </p>
        <p className="tv-page-actions">
          <Link href="/login/admin">Yönetici girişi</Link>
        </p>
      </AdminPageShell>
    );
  }

  const selectedCategory = categories.find((c) => String(c.id) === form.categoryId);
  const previewName = form.name.trim() || 'Ürün adı';
  const previewPrice = form.price.trim() ? `${form.price} TL` : '—';

  return (
    <AdminPageShell
      title="Yeni ürün ekle"
      lead="Görsel, fiyat ve stok bilgilerini kaydedin. Görsel sunucuya yüklenir ve mağaza ile mobil uygulamada listelenir."
    >
      {success ? (
        <div className="tv-card tv-admin-success-banner" role="status">
          <p className="tv-success" style={{ margin: 0 }}>
            <strong>{success.name}</strong> kaydedildi (ID: {success.id}).
          </p>
          <p className="tv-muted" style={{ margin: '8px 0 12px', fontSize: 14 }}>
            Mağazada görüntülemek için ürünler sayfasına gidebilir veya yeni bir ürün ekleyebilirsiniz.
          </p>
          <div className="tv-form-actions" style={{ marginTop: 0 }}>
            <Link href="/products" className="tv-btn-secondary">
              Mağazayı aç
            </Link>
            <button type="button" className="tv-btn-secondary" onClick={() => setSuccess(null)}>
              Başka ürün ekle
            </button>
          </div>
          {success.imageUrl ? (
            <img
              src={resolveMediaUrl(success.imageUrl)}
              alt={success.name}
              className="tv-preview-image"
              style={{ marginTop: 16, maxHeight: 200 }}
            />
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p className="tv-error" role="alert">
          {error}
        </p>
      ) : null}

      {categoriesError ? (
        <div className="tv-card tv-card--empty">
          <p className="tv-error" role="alert">
            {categoriesError}
          </p>
          <button type="button" className="tv-submit" onClick={() => void loadCategories()}>
            Kategorileri yeniden yükle
          </button>
        </div>
      ) : null}

      {!categoriesError && (
        <div className="tv-admin-layout">
          <section className="tv-card tv-admin-form-card">
            <h2 className="tv-section-title">Ürün bilgileri</h2>
            <form className="tv-form" onSubmit={(e) => void handleSubmit(e)} noValidate>
              <div className="tv-field">
                <label htmlFor="product-name">Ürün adı</label>
                <input
                  id="product-name"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  required
                  maxLength={200}
                  placeholder="Örn. Monstera Deliciosa"
                  disabled={submitting || loadingCategories}
                />
              </div>

              <div className="tv-field">
                <label htmlFor="product-description">Açıklama</label>
                <textarea
                  id="product-description"
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  required
                  rows={4}
                  placeholder="Ürünün kısa tanımı, bakım notları…"
                  disabled={submitting || loadingCategories}
                />
              </div>

              <div className="tv-field">
                <label htmlFor="product-sku">SKU</label>
                <input
                  id="product-sku"
                  value={form.sku}
                  onChange={(e) => updateField('sku', e.target.value)}
                  required
                  maxLength={50}
                  placeholder="PLT-MON-001"
                  disabled={submitting || loadingCategories}
                />
                <p className="tv-field-hint">
                  <button
                    type="button"
                    className="tv-link-btn"
                    onClick={() => updateField('sku', suggestSku(form.name))}
                    disabled={!form.name.trim() || submitting}
                  >
                    Adından SKU öner
                  </button>
                </p>
              </div>

              <div className="tv-field">
                <label htmlFor="product-category">Kategori</label>
                <select
                  id="product-category"
                  value={form.categoryId}
                  onChange={(e) => updateField('categoryId', e.target.value)}
                  required
                  disabled={submitting || loadingCategories || categories.length === 0}
                >
                  {categories.length === 0 ? (
                    <option value="">Kategori yok</option>
                  ) : (
                    categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="tv-form-row">
                <div className="tv-field">
                  <label htmlFor="product-price">Fiyat (TL)</label>
                  <input
                    id="product-price"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.price}
                    onChange={(e) => updateField('price', e.target.value)}
                    required
                    disabled={submitting || loadingCategories}
                  />
                </div>
                <div className="tv-field">
                  <label htmlFor="product-stock">Stok adedi</label>
                  <input
                    id="product-stock"
                    type="number"
                    min={0}
                    step={1}
                    value={form.stockQuantity}
                    onChange={(e) => updateField('stockQuantity', e.target.value)}
                    required
                    disabled={submitting || loadingCategories}
                  />
                </div>
                <div className="tv-field">
                  <label htmlFor="product-min-stock">Kritik stok eşiği</label>
                  <input
                    id="product-min-stock"
                    type="number"
                    min={0}
                    step={1}
                    value={form.minStockLevel}
                    onChange={(e) => updateField('minStockLevel', e.target.value)}
                    required
                    disabled={submitting || loadingCategories}
                  />
                  <p className="tv-field-hint">Stok bu değere düştüğünde yöneticilere anlık uyarı gider. 0 = kapalı.</p>
                </div>
              </div>

              <label className="tv-checkbox-field">
                <input
                  type="checkbox"
                  checked={form.isArCompatible}
                  onChange={(e) => updateField('isArCompatible', e.target.checked)}
                  disabled={submitting || loadingCategories}
                />
                <span>
                  <strong>AR uyumlu ürün</strong>
                  <span>Mobil uygulamada 3B önizleme ve yerleştirme için işaretleyin.</span>
                </span>
              </label>

              <div className="tv-care-admin-section">
                <h3 className="tv-subsection-title">Bitki bakım takvimi</h3>
                <p className="tv-field-hint" style={{ marginTop: 0 }}>
                  Teslim edilen siparişlerde müşterinin Bahçem / Takvimim paneline düşer. Bitki kategorisi veya
                  en az bir periyot tanımlı olmalıdır.
                </p>
                <div className="tv-form-row">
                  <div className="tv-field">
                    <label htmlFor="product-watering-days">Sulama (gün)</label>
                    <input
                      id="product-watering-days"
                      type="number"
                      min={1}
                      max={365}
                      step={1}
                      value={form.wateringIntervalDays}
                      onChange={(e) => updateField('wateringIntervalDays', e.target.value)}
                      placeholder="Örn. 7"
                      disabled={submitting || loadingCategories}
                    />
                  </div>
                  <div className="tv-field">
                    <label htmlFor="product-fertilizing-days">Gübreleme (gün)</label>
                    <input
                      id="product-fertilizing-days"
                      type="number"
                      min={1}
                      max={365}
                      step={1}
                      value={form.fertilizingIntervalDays}
                      onChange={(e) => updateField('fertilizingIntervalDays', e.target.value)}
                      placeholder="Örn. 30"
                      disabled={submitting || loadingCategories}
                    />
                  </div>
                  <div className="tv-field">
                    <label htmlFor="product-cleaning-days">Yaprak temizliği (gün)</label>
                    <input
                      id="product-cleaning-days"
                      type="number"
                      min={1}
                      max={365}
                      step={1}
                      value={form.cleaningIntervalDays}
                      onChange={(e) => updateField('cleaningIntervalDays', e.target.value)}
                      placeholder="Opsiyonel"
                      disabled={submitting || loadingCategories}
                    />
                  </div>
                </div>
                <div className="tv-field">
                  <label htmlFor="product-care-instructions">Bakım notları (müşteriye gösterilir)</label>
                  <textarea
                    id="product-care-instructions"
                    value={form.careInstructions}
                    onChange={(e) => updateField('careInstructions', e.target.value)}
                    rows={3}
                    maxLength={2000}
                    placeholder="Sulama ve ışık önerileri…"
                    disabled={submitting || loadingCategories}
                  />
                </div>
                {isPlantCategory(selectedCategory) ? (
                  <p className="tv-field-hint">
                    <button
                      type="button"
                      className="tv-link-btn"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          ...PLANT_CARE_TEMPLATE
                        }))
                      }
                      disabled={submitting}
                    >
                      Örnek bitki periyotlarını uygula
                    </button>
                  </p>
                ) : null}
              </div>

              <div className="tv-field">
                <span className="tv-file-zone-label" id={`${fileInputId}-label`}>
                  Ürün görseli
                </span>
                <div
                  className={`tv-file-zone${dragActive ? ' tv-file-zone--active' : ''}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                >
                  <p className="tv-file-zone-hint">JPG, PNG veya WebP · en fazla 5 MB</p>
                  <input
                    ref={fileInputRef}
                    id={fileInputId}
                    type="file"
                    accept={ACCEPTED_IMAGE_TYPES.join(',')}
                    onChange={handleImageChange}
                    disabled={submitting}
                    aria-labelledby={`${fileInputId}-label`}
                  />
                </div>
                {imageError ? <p className="tv-field-error">{imageError}</p> : null}
              </div>

              <div className="tv-form-actions">
                <button type="submit" className="tv-submit" disabled={submitting || loadingCategories || categories.length === 0}>
                  {submitting ? 'Kaydediliyor…' : 'Ürünü kaydet'}
                </button>
                <button type="button" className="tv-btn-secondary" onClick={resetForm} disabled={submitting}>
                  Formu temizle
                </button>
              </div>
            </form>
          </section>

          <aside className="tv-card tv-admin-preview-card" aria-live="polite">
            <h2 className="tv-section-title">Önizleme</h2>
            {previewUrl ? (
              <img src={previewUrl} alt="" className="tv-preview-image" />
            ) : (
              <div className="tv-preview-placeholder">Görsel seçildiğinde önizleme burada görünür</div>
            )}
            <dl className="tv-preview-meta">
              <div>
                <dt>Ürün</dt>
                <dd>{previewName}</dd>
              </div>
              <div>
                <dt>Fiyat</dt>
                <dd>{previewPrice}</dd>
              </div>
              <div>
                <dt>Kategori</dt>
                <dd>{selectedCategory?.name ?? '—'}</dd>
              </div>
              <div>
                <dt>AR</dt>
                <dd>{form.isArCompatible ? 'Uyumlu' : 'Kapalı'}</dd>
              </div>
              <div>
                <dt>Bakım</dt>
                <dd>
                  {form.wateringIntervalDays.trim()
                    ? `Sulama ${form.wateringIntervalDays} gün`
                    : 'Sulama tanımsız'}
                  {form.fertilizingIntervalDays.trim()
                    ? ` · Gübre ${form.fertilizingIntervalDays} gün`
                    : ''}
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      )}

      {loadingCategories && !categoriesError ? <p className="tv-muted">Kategoriler yükleniyor…</p> : null}
    </AdminPageShell>
  );
}
