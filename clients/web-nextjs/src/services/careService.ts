import {
  API_ROUTES,
  CompleteCareActionRequest,
  CareActionType,
  MyPlantCareCalendarResponse,
  PlantCareCalendarDto
} from '@terravision/shared';
import { apiClient } from './apiClient';

export const careService = {
  async getMyCalendar(): Promise<MyPlantCareCalendarResponse> {
    const { data } = await apiClient.get<MyPlantCareCalendarResponse>(API_ROUTES.careMyCalendar);
    return data;
  },

  async completeAction(calendarId: number, actionType: CareActionType): Promise<PlantCareCalendarDto> {
    const body: CompleteCareActionRequest = { actionType };
    const { data } = await apiClient.post<PlantCareCalendarDto>(
      API_ROUTES.careCompleteAction(calendarId),
      body
    );
    return data;
  }
};
