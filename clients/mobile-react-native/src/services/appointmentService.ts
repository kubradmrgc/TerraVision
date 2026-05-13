import { apiClient } from './apiClient';
import { AppointmentDto, CreateAppointmentRequest, AppointmentStatus } from '../types/appointment';

export const appointmentService = {
  async getMyAppointments(role: number): Promise<AppointmentDto[]> {
    const endpoint = role === 1 ? '/api/appointments/customer' : '/api/appointments/consultant';
    const { data } = await apiClient.get<AppointmentDto[]>(endpoint);
    return data;
  },

  async create(payload: CreateAppointmentRequest): Promise<AppointmentDto> {
    const { data } = await apiClient.post<AppointmentDto>('/api/appointments', payload);
    return data;
  },

  async updateStatus(id: number, status: AppointmentStatus): Promise<AppointmentDto> {
    const { data } = await apiClient.put<AppointmentDto>(`/api/appointments/${id}/status`, { id, status });
    return data;
  }
};
