'use client';

import Link from 'next/link';
import { dealBadgeLabel, formatTryCurrency } from '@terravision/shared';
import { OptimizedMediaImage } from '@/components/OptimizedMediaImage';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import type { ProductDto } from '@/types/product';

type Props = {
  product: ProductDto;
  onAdd: () => void;
  adding?: boolean;
};

export function MarketplaceProductCard({ product, onAdd, adding = false }: Props): React.JSX.Element {
  const badge = dealBadgeLabel(product);
  const inStock = product.stockQuantity > 0;

  return (
    <article className="tv-card tv-marketplace-card">
      <Link href={`/products/${product.id}`} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div className="tv-marketplace-image-wrap">
          {badge ? <span className="tv-marketplace-discount-badge">{badge}</span> : null}
          {product.imageUrl ? (
            <OptimizedMediaImage
              src={product.imageUrl}
              alt={product.name}
              width={320}
              height={320}
              sizes="(max-width: 600px) 50vw, 200px"
              className="tv-marketplace-card-image"
            />
          ) : (
            <div className="tv-marketplace-card-image" style={{ display: 'grid', placeItems: 'center' }}>
              <span className="tv-muted">Görsel yok</span>
            </div>
          )}
        </div>
        <div className="tv-marketplace-card-body">
          <p className="tv-marketplace-card-title">{product.name}</p>
          <div className="tv-marketplace-price-row">
            <span className="tv-marketplace-price">{formatTryCurrency(product.price)}</span>
            {product.compareAtPrice != null && product.compareAtPrice > product.price ? (
              <span className="tv-marketplace-compare">{formatTryCurrency(product.compareAtPrice)}</span>
            ) : null}
          </div>
          {!inStock ? <span className="tv-muted">Tükendi</span> : null}
        </div>
      </Link>
      <div style={{ padding: '0 12px 12px' }}>
        <AddToCartButton loading={adding} disabled={!inStock} onClick={onAdd} />
      </div>
    </article>
  );
}
