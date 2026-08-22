import { LoginPortal } from '@terravision/shared';

export type LoginPanelProps = {
  portal: LoginPortal;
  pill: string;
  title: string;
  subtitle: string;
  features: string[];
  emailLabel?: string;
  submitLabel: string;
  alternateLinks: { href: string; label: string }[];
  defaultEmail?: string;
  defaultPassword?: string;
  redirectPath: string;
  loginHref: string;
};

export const WEB_LOGIN_PANELS: Record<LoginPortal, Omit<LoginPanelProps, 'portal'>> = {
  customer: {
    pill: 'Müşteri erişimi',
    title: 'Müşteri girişi',
    subtitle: 'Ürünleri inceleyin, sepetinizi yönetin ve siparişlerinizi takip edin.',
    features: ['Ürün kataloğu', 'Sepet ve ödeme', 'Sipariş geçmişi'],
    submitLabel: 'Müşteri olarak giriş yap',
    alternateLinks: [
      { href: '/login/admin', label: 'Yönetici girişi' },
      { href: '/login/consultant', label: 'Saha danışmanı girişi' }
    ],
    defaultEmail: 'customer@terravision.com',
    defaultPassword: 'customer123',
    redirectPath: '/',
    loginHref: '/login'
  },
  admin: {
    pill: 'Yönetici erişimi',
    title: 'Yönetici girişi',
    subtitle: 'Sipariş yönetimi, envanter, AR içerik yükleme ve operasyon paneli.',
    features: ['Sipariş yönetimi', 'Dashboard', 'AR model yükleme'],
    submitLabel: 'Yönetici olarak giriş yap',
    alternateLinks: [
      { href: '/login', label: 'Müşteri girişi' },
      { href: '/login/consultant', label: 'Saha danışmanı girişi' }
    ],
    defaultEmail: 'admin@terravision.com',
    defaultPassword: 'admin123',
    redirectPath: '/admin/orders',
    loginHref: '/login/admin'
  },
  consultant: {
    pill: 'Saha danışmanı',
    title: 'Saha danışmanı girişi',
    subtitle: 'Randevularınızı görüntüleyin ve saha ziyaret durumlarını güncelleyin.',
    features: ['Randevu listesi', 'Durum güncelleme', 'Saha notları'],
    submitLabel: 'Danışman olarak giriş yap',
    alternateLinks: [
      { href: '/login', label: 'Müşteri girişi' },
      { href: '/login/admin', label: 'Yönetici girişi' }
    ],
    defaultEmail: 'consultant@terravision.com',
    defaultPassword: 'consultant123',
    redirectPath: '/products',
    loginHref: '/login/consultant'
  }
};

export const WEB_PORTAL_ORDER: LoginPortal[] = ['customer', 'consultant', 'admin'];

export const WEB_STAFF_PORTALS: LoginPortal[] = ['consultant', 'admin'];
