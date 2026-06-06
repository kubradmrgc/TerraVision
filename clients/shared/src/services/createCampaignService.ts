import type { ApiHttpClient } from '../http/apiHttp';
import type {
  CampaignDetailDto,
  StoreCampaignDto,
  StorefrontDto,
  UpdateProductPromotionRequest,
  UpsertStoreCampaignRequest
} from '../types/campaign';
import type { ProductDto } from '../types/product';

export function createCampaignRoutes(prefix: string) {
  return {
    storefront: `${prefix}/campaigns/storefront`,
    storefrontById: (id: number) => `${prefix}/campaigns/storefront/${id}`,
    campaigns: `${prefix}/campaigns`,
    campaignById: (id: number) => `${prefix}/campaigns/${id}`,
    productPromotion: (productId: number) => `${prefix}/campaigns/products/${productId}/promotion`
  };
}

export function createCampaignService(client: ApiHttpClient, routes: ReturnType<typeof createCampaignRoutes>) {
  return {
    async getStorefront(): Promise<StorefrontDto> {
      const { data } = await client.get<StorefrontDto>(routes.storefront);
      return data;
    },
    async getStorefrontCampaign(id: number): Promise<CampaignDetailDto> {
      const { data } = await client.get<CampaignDetailDto>(routes.storefrontById(id));
      return data;
    },
    async getCampaigns(): Promise<StoreCampaignDto[]> {
      const { data } = await client.get<StoreCampaignDto[]>(routes.campaigns);
      return data;
    },
    async createCampaign(body: UpsertStoreCampaignRequest): Promise<StoreCampaignDto> {
      const { data } = await client.post<StoreCampaignDto>(routes.campaigns, body);
      return data;
    },
    async updateCampaign(id: number, body: UpsertStoreCampaignRequest): Promise<StoreCampaignDto> {
      const { data } = await client.put<StoreCampaignDto>(routes.campaignById(id), body);
      return data;
    },
    async deleteCampaign(id: number): Promise<void> {
      await client.delete(routes.campaignById(id));
    },
    async updateProductPromotion(productId: number, body: UpdateProductPromotionRequest): Promise<ProductDto> {
      const { data } = await client.put<ProductDto>(routes.productPromotion(productId), body);
      return data;
    }
  };
}
