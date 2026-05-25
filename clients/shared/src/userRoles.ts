export const USER_ROLE = {
  Customer: 1,
  Consultant: 2,
  Admin: 3
} as const;

export type UserRoleId = (typeof USER_ROLE)[keyof typeof USER_ROLE];

export type LoginPortal = 'customer' | 'admin' | 'consultant';

export function roleMatchesPortal(role: number, portal: LoginPortal): boolean {
  switch (portal) {
    case 'customer':
      return role === USER_ROLE.Customer;
    case 'admin':
      return role === USER_ROLE.Admin;
    case 'consultant':
      return role === USER_ROLE.Consultant;
    default:
      return false;
  }
}

export function portalRoleMismatchMessage(portal: LoginPortal): string {
  switch (portal) {
    case 'customer':
      return 'Bu hesap müşteri hesabı değil. Yönetici veya danışman girişini kullanın.';
    case 'admin':
      return 'Bu hesabın yönetici yetkisi yok. Müşteri girişini kullanın.';
    case 'consultant':
      return 'Bu hesap saha danışmanı hesabı değil. Uygun giriş sayfasını seçin.';
    default:
      return 'Hesap türü bu giriş sayfasıyla eşleşmiyor.';
  }
}
