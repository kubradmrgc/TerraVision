import { API_ROUTES, createCampaignService } from '@terravision/shared';
import { apiClient } from './apiClient';

export const campaignService = createCampaignService(apiClient, {
  storefront: API_ROUTES.campaignsStorefront,
  storefrontById: API_ROUTES.campaignsStorefrontById,
  campaigns: API_ROUTES.campaigns,
  campaignById: API_ROUTES.campaignById,
  productPromotion: API_ROUTES.productPromotion
});
