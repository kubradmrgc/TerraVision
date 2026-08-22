'use client';

import { useState } from 'react';
import { formatTryCurrency, type ProposalDto } from '@terravision/shared';
import { cartService } from '@/services/cartService';

type Props = {
  proposal: ProposalDto;
  canAddToCart?: boolean;
};

export function ProposalCard({ proposal, canAddToCart = true }: Props) {
  const [adding, setAdding] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddToCart = async () => {
    if (adding || done || proposal.lines.length === 0) {
      return;
    }

    setAdding(true);
    setError(null);

    try {
      await cartService.addItems(
        proposal.lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity
        }))
      );
      setDone(true);
    } catch {
      setError('Sepete eklenemedi. Lütfen tekrar deneyin.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="tv-card tv-chat-proposal-card">
      <div className="tv-chat-proposal-header">
        <h3 className="tv-chat-proposal-title">{proposal.title}</h3>
        <span className="tv-chat-proposal-total">{formatTryCurrency(proposal.totalAmount)}</span>
      </div>
      {proposal.notes ? <p className="tv-chat-proposal-notes">{proposal.notes}</p> : null}
      <ul className="tv-chat-proposal-lines">
        {proposal.lines.map((line) => (
          <li key={`${line.productId}-${line.quantity}`}>
            <span>{line.productName}</span>
            <span>
              {line.quantity} × {formatTryCurrency(line.unitPrice)}
            </span>
          </li>
        ))}
      </ul>
      {error ? <p className="tv-form-error">{error}</p> : null}
      {canAddToCart ? (
        <button
          type="button"
          className="tv-btn tv-btn--primary"
          disabled={adding || done}
          onClick={() => void handleAddToCart()}
        >
          {done ? 'Sepete eklendi' : adding ? 'Ekleniyor…' : 'Sepete Ekle'}
        </button>
      ) : null}
    </div>
  );
}
