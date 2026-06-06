'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { ProductDto } from '@terravision/shared';
import { productService } from '@/services/productService';
import { chatService } from '@/services/chatService';
import { getApiErrorMessage } from '@/utils/apiError';

type Props = {
  sessionId: number;
  onSent: () => void;
};

export function ChatProposalComposer({ sessionId, onSent }: Props) {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [title, setTitle] = useState('Peyzaj ürün teklifi');
  const [notes, setNotes] = useState('');
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void productService.getProducts().then(setProducts).catch(() => undefined);
  }, []);

  const toggleProduct = (productId: number) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[productId]) {
        delete next[productId];
      } else {
        next[productId] = 1;
      }
      return next;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const lines = Object.entries(selected).map(([productId, quantity]) => ({
      productId: Number(productId),
      quantity
    }));

    if (lines.length === 0) {
      setError('En az bir ürün seçin.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await chatService.sendProposal(sessionId, { title: title.trim(), notes: notes.trim() || null, lines });
      setSelected({});
      setOpen(false);
      onSent();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Teklif gönderilemedi.'));
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button type="button" className="tv-btn tv-btn--secondary" onClick={() => setOpen(true)}>
        Ürün teklifi gönder
      </button>
    );
  }

  return (
    <form className="tv-card tv-chat-proposal-compose" onSubmit={(e) => void handleSubmit(e)}>
      <h3 className="tv-chat-proposal-compose-title">Ürün teklifi oluştur</h3>
      <label className="tv-field">
        <span>Başlık</span>
        <input className="tv-input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
      </label>
      <label className="tv-field">
        <span>Not (opsiyonel)</span>
        <textarea className="tv-input" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={1000} />
      </label>
      <div className="tv-chat-proposal-product-grid">
        {products.map((product) => {
          const checked = Boolean(selected[product.id]);
          return (
            <label key={product.id} className={`tv-chat-proposal-product${checked ? ' tv-chat-proposal-product--on' : ''}`}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleProduct(product.id)}
              />
              <span>{product.name}</span>
              {checked ? (
                <input
                  type="number"
                  min={1}
                  max={99}
                  className="tv-input tv-input--compact"
                  value={selected[product.id] ?? 1}
                  onChange={(e) =>
                    setSelected((prev) => ({
                      ...prev,
                      [product.id]: Math.max(1, Number(e.target.value) || 1)
                    }))
                  }
                />
              ) : null}
            </label>
          );
        })}
      </div>
      {error ? <p className="tv-form-error">{error}</p> : null}
      <div className="tv-page-actions">
        <button type="button" className="tv-btn tv-btn--ghost" onClick={() => setOpen(false)}>
          İptal
        </button>
        <button type="submit" className="tv-btn tv-btn--primary" disabled={loading}>
          {loading ? 'Gönderiliyor…' : 'Teklifi gönder'}
        </button>
      </div>
    </form>
  );
}
