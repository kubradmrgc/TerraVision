import { USER_ROLE } from '@terravision/shared';
import type { MobileSection } from '../app/types';

const ALL_SECTIONS: MobileSection[] = [
  'products',
  'cart',
  'orders',
  'appointments',
  'care',
  'exchange',
  'events',
  'profile'
];

/** Tabs for visitors browsing the catalog without signing in. */
export function guestBottomNavSections(): MobileSection[] {
  return ['products'];
}

/** Bottom tabs visible for the current role (orders/appointments live under Profil for customers). */
export function bottomNavSections(role: number | null): MobileSection[] {
  return ALL_SECTIONS.filter((section) => {
    if (section === 'care' && role !== USER_ROLE.Customer) {
      return false;
    }
    if (role === USER_ROLE.Customer && (section === 'orders' || section === 'appointments')) {
      return false;
    }
    return true;
  });
}
