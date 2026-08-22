import {
  API_ROUTES,
  CreateExchangeOfferRequest,
  CreateExchangeProductRequest,
  EXCHANGE_OFFER_STATUS,
  ExchangeOfferDto,
  ExchangeProductDto,
  UpdateExchangeProductRequest
} from '@terravision/shared';
import { apiClient } from './apiClient';

export const exchangeService = {
  async listProducts(params?: { condition?: number; swapOnly?: boolean }): Promise<ExchangeProductDto[]> {
    const { data } = await apiClient.get<ExchangeProductDto[]>(API_ROUTES.EXCHANGE.products, { params });
    return data;
  },

  async getProduct(id: number): Promise<ExchangeProductDto> {
    const { data } = await apiClient.get<ExchangeProductDto>(API_ROUTES.EXCHANGE.productById(id));
    return data;
  },

  async getMyProducts(): Promise<ExchangeProductDto[]> {
    const { data } = await apiClient.get<ExchangeProductDto[]>(API_ROUTES.EXCHANGE.myProducts);
    return data;
  },

  async createProduct(body: CreateExchangeProductRequest): Promise<ExchangeProductDto> {
    const { data } = await apiClient.post<ExchangeProductDto>(API_ROUTES.EXCHANGE.products, body);
    return data;
  },

  async updateProduct(body: UpdateExchangeProductRequest): Promise<ExchangeProductDto> {
    const { data } = await apiClient.put<ExchangeProductDto>(
      API_ROUTES.EXCHANGE.productById(body.id),
      body
    );
    return data;
  },

  async deleteProduct(id: number): Promise<void> {
    await apiClient.delete(API_ROUTES.EXCHANGE.productById(id));
  },

  async createOffer(body: CreateExchangeOfferRequest): Promise<ExchangeOfferDto> {
    const { data } = await apiClient.post<ExchangeOfferDto>(API_ROUTES.EXCHANGE.offers, body);
    return data;
  },

  async getReceivedOffers(): Promise<ExchangeOfferDto[]> {
    const { data } = await apiClient.get<ExchangeOfferDto[]>(API_ROUTES.EXCHANGE.offersReceived);
    return data;
  },

  async getSentOffers(): Promise<ExchangeOfferDto[]> {
    const { data } = await apiClient.get<ExchangeOfferDto[]>(API_ROUTES.EXCHANGE.offersSent);
    return data;
  },

  async acceptOffer(id: number): Promise<ExchangeOfferDto> {
    const { data } = await apiClient.put<ExchangeOfferDto>(API_ROUTES.EXCHANGE.offerStatus(id), {
      id,
      status: EXCHANGE_OFFER_STATUS.Accepted
    });
    return data;
  },

  async rejectOffer(id: number): Promise<ExchangeOfferDto> {
    const { data } = await apiClient.put<ExchangeOfferDto>(API_ROUTES.EXCHANGE.offerStatus(id), {
      id,
      status: EXCHANGE_OFFER_STATUS.Rejected
    });
    return data;
  },

  async uploadImage(file: File): Promise<string> {
    const form = new FormData();
    form.append('file', file);
    const { data } = await apiClient.post<{ url: string }>(API_ROUTES.mediaExchangeImages, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data.url;
  }
};
