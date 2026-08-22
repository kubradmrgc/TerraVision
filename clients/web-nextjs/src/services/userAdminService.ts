import { AdminUserDto, AdminUserListQuery, API_ROUTES } from '@terravision/shared';
import { apiClient } from './apiClient';
import type { PagedResult } from '../types/order';

export const userAdminService = {
  async getUsers(query: AdminUserListQuery): Promise<PagedResult<AdminUserDto>> {
    const { data } = await apiClient.get<PagedResult<AdminUserDto>>(API_ROUTES.usersAdmin, {
      params: query
    });
    return data;
  }
};
