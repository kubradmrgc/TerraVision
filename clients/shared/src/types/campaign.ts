import type { ProductDto } from './product';

export interface StoreCampaignDto {
  id: number;
  title: string;
  subtitle?: string | null;
  badgeText?: string | null;
  sortOrder: number;
  isActive: boolean;
  startsAtUtc?: string | null;
  endsAtUtc?: string | null;
  productIds: number[];
}

export interface StorefrontDto {
  campaigns: StoreCampaignDto[];
  dealProducts: ProductDto[];
  featuredProducts: ProductDto[];
}

export interface UpsertStoreCampaignRequest {
  title: string;
  subtitle?: string | null;
  badgeText?: string | null;
  sortOrder: number;
  isActive: boolean;
  startsAtUtc?: string | null;
  endsAtUtc?: string | null;
  productIds: number[];
}

export interface UpdateProductPromotionRequest {
  compareAtPrice?: number | null;
  isFeatured: boolean;
  promoLabel?: string | null;
  promoSortOrder: number;
  promoStartsAtUtc?: string | null;
  promoEndsAtUtc?: string | null;
}
