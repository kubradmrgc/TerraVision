import type { UserRoleId } from '../userRoles';

export type AdminUserDto = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRoleId;
  createdDate: string;
  updatedDate: string | null;
  isActive: boolean;
};

export type AdminUserListQuery = {
  page?: number;
  pageSize?: number;
  role?: UserRoleId;
  search?: string;
  includeInactive?: boolean;
};

export const USER_ROLE_LABELS_TR: Record<UserRoleId, string> = {
  1: 'Müşteri',
  2: 'Danışman',
  3: 'Yönetici'
};
