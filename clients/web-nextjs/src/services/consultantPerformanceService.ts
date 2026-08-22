import {
  API_ROUTES,
  ConsultantKpiDto,
  ConsultantPerformanceBoardDto
} from '@terravision/shared';
import { apiClient } from './apiClient';

export const consultantPerformanceService = {
  async getPerformanceBoard(): Promise<ConsultantPerformanceBoardDto> {
    const { data } = await apiClient.get<ConsultantPerformanceBoardDto>(
      API_ROUTES.appointmentsPerformanceBoard
    );
    return data;
  },

  async getMyPerformance(): Promise<ConsultantKpiDto> {
    const { data } = await apiClient.get<ConsultantKpiDto>(API_ROUTES.appointmentsMyPerformance);
    return data;
  }
};
