import { API_ROUTES, type AppointmentDto, type CreateAppointmentRequest, type AppointmentStatus } from '@terravision/shared';
import { apiClient } from './apiClient';

export const appointmentService = {
  async getCustomerAppointments(): Promise<AppointmentDto[]> {
    const { data } = await apiClient.get<AppointmentDto[]>(API_ROUTES.appointmentsCustomer);
    return data;
  },

  async create(payload: CreateAppointmentRequest): Promise<AppointmentDto> {
    const { data } = await apiClient.post<AppointmentDto>(API_ROUTES.appointments, payload);
    return data;
  },

  async updateStatus(id: number, status: AppointmentStatus): Promise<AppointmentDto> {
    const { data } = await apiClient.put<AppointmentDto>(API_ROUTES.appointmentStatus(id), { id, status });
    return data;
  }
};
