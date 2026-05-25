import { LoginPortal } from '@terravision/shared';

export type LoginPortalUiConfig = {
  portal: LoginPortal;
  pill: string;
  title: string;
  subtitle: string;
  features: string[];
  emailPlaceholder: string;
  submitLabel: string;
  notice?: string;
  footer?: string;
  defaultEmail: string;
  defaultPassword: string;
  useAdminHero?: boolean;
};

export const MOBILE_LOGIN_PORTALS: LoginPortalUiConfig[] = [
  {
    portal: 'customer',
    pill: 'Müşteri erişimi',
    title: 'Müşteri girişi',
    subtitle: 'Ürünleri inceleyin, sepetinizi yönetin ve siparişlerinizi takip edin.',
    features: ['Ürün kataloğu', 'Sepet ve ödeme', 'Sipariş geçmişi'],
    emailPlaceholder: 'ornek@terravision.com',
    submitLabel: 'Müşteri olarak giriş yap',
    defaultEmail: 'customer@terravision.com',
    defaultPassword: 'customer123',
    useAdminHero: false
  },
  {
    portal: 'consultant',
    pill: 'Saha danışmanı',
    title: 'Saha danışmanı girişi',
    subtitle: 'Randevularınızı görüntüleyin ve saha ziyaret durumlarını güncelleyin.',
    features: ['Randevu listesi', 'Durum güncelleme', 'Saha notları'],
    emailPlaceholder: 'danisman@terravision.com',
    submitLabel: 'Danışman olarak giriş yap',
    defaultEmail: 'consultant@terravision.com',
    defaultPassword: 'consultant123',
    useAdminHero: false
  },
  {
    portal: 'admin',
    pill: 'Yönetici erişimi',
    title: 'Yönetici girişi',
    subtitle: 'Sipariş yönetimi, envanter, AR içerik yükleme ve operasyon paneli.',
    features: ['Sipariş yönetimi', 'Dashboard', 'AR model yükleme'],
    emailPlaceholder: 'admin@terravision.com',
    submitLabel: 'Yönetici olarak giriş yap',
    notice: 'Bu alan yalnızca TerraVision yöneticilerine açıktır. Yetkisiz erişim kayıt altına alınır.',
    footer: 'Kısıtlı erişim',
    defaultEmail: 'admin@terravision.com',
    defaultPassword: 'admin123',
    useAdminHero: true
  }
];

export const MOBILE_STAFF_PORTALS: LoginPortal[] = ['consultant', 'admin'];

export function getMobileLoginPortalConfig(portal: LoginPortal): LoginPortalUiConfig {
  const found = MOBILE_LOGIN_PORTALS.find((item) => item.portal === portal);
  if (!found) {
    throw new Error(`Unknown login portal: ${portal}`);
  }
  return found;
}
