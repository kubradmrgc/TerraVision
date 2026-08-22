import {
  API_ROUTES,
  CreateExchangeOfferRequest,
  CreateExchangeProductRequest,
  EXCHANGE_OFFER_STATUS,
  ExchangeOfferDto,
  ExchangeProductDto
} from '@terravision/shared';
import { apiClient } from './apiClient';
import type { UploadFileInput } from './mediaService';
import { postMultipartFile } from './uploadFileHelpers';

export const exchangeService = {
  async listProducts(params?: { condition?: number; swapOnly?: boolean }): Promise<ExchangeProductDto[]> {
    const { data } = await apiClient.get<ExchangeProductDto[]>(API_ROUTES.EXCHANGE.products, { params });
    return data;
  },

  async getMyProducts(): Promise<ExchangeProductDto[]> {
    const { data } = await apiClient.get<ExchangeProductDto[]>(API_ROUTES.EXCHANGE.myProducts);
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

  async createProduct(body: CreateExchangeProductRequest): Promise<ExchangeProductDto> {
    const { data } = await apiClient.post<ExchangeProductDto>(API_ROUTES.EXCHANGE.products, body);
    return data;
  },

  async createOffer(body: CreateExchangeOfferRequest): Promise<ExchangeOfferDto> {
    const { data } = await apiClient.post<ExchangeOfferDto>(API_ROUTES.EXCHANGE.offers, body);
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

  async uploadExchangeImage(file: UploadFileInput): Promise<string> {
    return postMultipartFile(API_ROUTES.mediaExchangeImages, file);
  }
};
