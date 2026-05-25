'use client';

import { IconCartPlus } from '@/components/icons/CartIcons';

type Props = {
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
  label?: string;
  loadingLabel?: string;
  compact?: boolean;
};

export function AddToCartButton({
  loading,
  disabled,
  onClick,
  label = 'Sepete ekle',
  loadingLabel = 'Ekleniyor…',
  compact = false
}: Props) {
  return (
    <button
      type="button"
      className={`tv-cart-add-btn${compact ? ' tv-cart-add-btn--compact' : ''}`}
      disabled={disabled || loading}
      onClick={onClick}
      aria-busy={loading}
    >
      <IconCartPlus size={compact ? 18 : 20} />
      <span>{loading ? loadingLabel : label}</span>
    </button>
  );
}
