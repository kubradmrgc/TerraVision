import { USER_ROLE } from '@terravision/shared';
import type { MobileSection } from '../app/types';

const ALL_SECTIONS: MobileSection[] = [
  'products',
  'ar',
  'cart',
  'orders',
  'appointments',
  'care',
  'exchange',
  'chat',
  'events',
  'profile'
];

/** Tabs for visitors browsing the catalog without signing in. */
export function guestBottomNavSections(): MobileSection[] {
  return ['products'];
}

/** Bottom tabs visible for the current role (cart/profile are in the header; orders/appointments live under Profil for customers). */
export function bottomNavSections(role: number | null): MobileSection[] {
  return ALL_SECTIONS.filter((section) => {
    if (section === 'cart' || section === 'profile') {
      return false;
    }
    if ((section === 'care' || section === 'ar') && role !== USER_ROLE.Customer) {
      return false;
    }
    if (role === USER_ROLE.Customer && (section === 'orders' || section === 'appointments')) {
      return false;
    }
    return true;
  });
}
