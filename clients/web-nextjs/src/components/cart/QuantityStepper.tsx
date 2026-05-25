'use client';

import { IconMinus, IconPlus, IconTrash } from '@/components/icons/CartIcons';

type Props = {
  quantity: number;
  disabled?: boolean;
  busy?: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
  onRemove: () => void;
};

export function QuantityStepper({ quantity, disabled, busy, onDecrease, onIncrease, onRemove }: Props) {
  const isDisabled = disabled || busy;

  return (
    <div className="tv-qty-stepper" role="group" aria-label="Adet kontrolü">
      <button
        type="button"
        className="tv-icon-btn tv-icon-btn--ghost"
        disabled={isDisabled}
        onClick={onDecrease}
        aria-label={quantity <= 1 ? 'Ürünü sepetten kaldır' : 'Adedi azalt'}
      >
        <IconMinus size={18} />
      </button>

      <span className="tv-qty-value" aria-live="polite" aria-atomic="true">
        {quantity}
      </span>

      <button
        type="button"
        className="tv-icon-btn tv-icon-btn--ghost"
        disabled={isDisabled}
        onClick={onIncrease}
        aria-label="Adedi artır"
      >
        <IconPlus size={18} />
      </button>

      <button
        type="button"
        className="tv-icon-btn tv-icon-btn--danger"
        disabled={isDisabled}
        onClick={onRemove}
        aria-label="Ürünü sepetten kaldır"
        title="Kaldır"
      >
        <IconTrash size={18} />
      </button>
    </div>
  );
}
