import {
  API_ROUTES,
  AddPlantToGardenRequest,
  CareAssistantChatRequest,
  CareAssistantChatResponse,
  CareCatalogPlantDto,
  CareCatalogLoadResult,
  CompleteCareActionRequest,
  CareActionType,
  MyPlantCareCalendarResponse,
  PlantCareCalendarDto,
  fetchCareCatalogWithFallback
} from '@terravision/shared';
import { apiClient } from './apiClient';
import { productService } from './productService';

export const careService = {
  async getMyCalendar(): Promise<MyPlantCareCalendarResponse> {
    const { data } = await apiClient.get<MyPlantCareCalendarResponse>(API_ROUTES.careMyCalendar);
    return data;
  },

  async getCatalogPlants(gardenPlants: PlantCareCalendarDto[] = []): Promise<CareCatalogPlantDto[]> {
    const { plants } = await careService.getCatalogPlantsWithMeta(gardenPlants);
    return plants;
  },

  async getCatalogPlantsWithMeta(
    gardenPlants: PlantCareCalendarDto[] = []
  ): Promise<CareCatalogLoadResult> {
    return fetchCareCatalogWithFallback({
      fetchCatalog: async () => {
        const { data } = await apiClient.get<CareCatalogPlantDto[]>(API_ROUTES.careCatalogPlants);
        return data;
      },
      fetchProducts: () => productService.getProducts(),
      gardenPlants
    });
  },

  async addPlantToGarden(productId: number): Promise<PlantCareCalendarDto> {
    const body: AddPlantToGardenRequest = { productId };
    const { data } = await apiClient.post<PlantCareCalendarDto>(API_ROUTES.careAddToGarden, body);
    return data;
  },

  async completeAction(calendarId: number, actionType: CareActionType): Promise<PlantCareCalendarDto> {
    const body: CompleteCareActionRequest = { actionType };
    const { data } = await apiClient.post<PlantCareCalendarDto>(
      API_ROUTES.careCompleteAction(calendarId),
      body
    );
    return data;
  },

  async assistantChat(request: CareAssistantChatRequest): Promise<CareAssistantChatResponse> {
    const { data } = await apiClient.post<CareAssistantChatResponse>(
      API_ROUTES.careAssistantChat,
      request
    );
    return data;
  }
};
