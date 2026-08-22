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

/** First linked product (e.g. single-product shortcut). */
export function primaryCampaignProductId(campaign: Pick<StoreCampaignDto, 'productIds'>): number | null {
  const id = campaign.productIds[0];
  return typeof id === 'number' && Number.isFinite(id) && id > 0 ? id : null;
}

/** Web path to campaign product list page; null when no products linked. */
export function campaignListPath(campaign: Pick<StoreCampaignDto, 'id' | 'productIds'>): string | null {
  if (!campaign.productIds.length) return null;
  return `/campaigns/${campaign.id}`;
}

export interface CampaignDetailDto {
  campaign: StoreCampaignDto;
  products: ProductDto[];
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
