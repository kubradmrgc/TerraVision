import { API_BASE_URL } from '@/config/env';

export const HOME_SHOWCASE = [
  {
    src: `${API_BASE_URL}/assets/product-images/monstera-deliciosa.jpg`,
    name: 'Monstera Deliciosa',
    tag: 'İç mekan',
    alt: 'Monstera Deliciosa iç mekan bitkisi — TerraVision ürün kataloğu'
  },
  {
    src: `${API_BASE_URL}/assets/product-images/fiddle-leaf-fig.jpg`,
    name: 'Keman Yapraklı İncir',
    tag: 'Popüler',
    alt: 'Keman yapraklı incir (Fiddle Leaf Fig) — popüler salon bitkisi'
  },
  {
    src: `${API_BASE_URL}/assets/product-images/lavender-pot.jpg`,
    name: 'Lavanta Saksı',
    tag: 'Bahçe',
    alt: 'Lavanta saksı bitkisi — bahçe ve balkon için TerraVision'
  }
] as const;

export const HOME_FEATURES = [
  {
    icon: 'leaf',
    title: 'Zengin ürün kataloğu',
    desc: 'İç ve dış mekan bitkileri, saksılar ve bahçe ürünlerini tek platformda keşfedin.'
  },
  {
    icon: 'cart',
    title: 'Kolay sepet ve sipariş',
    desc: 'Sepetinizi anında güncelleyin, siparişlerinizi güvenle tamamlayın ve takip edin.'
  },
  {
    icon: 'ar',
    title: 'AR ile önizleme',
    desc: 'Uyumlu ürünlerde artırılmış gerçeklik ile bitkileri alanınızda görüntüleyin.'
  }
] as const;

export const HOME_CATEGORIES = [
  { label: 'Tüm ürünler', href: '/products' },
  { label: 'TerraTakas', href: '/marketplace' },
  { label: 'Kampanyalar', href: '/products' },
  { label: 'Hesap oluştur', href: '/register' }
] as const;

export const HOME_FAQ = [
  {
    question: 'TerraVision nedir?',
    answer:
      'TerraVision, bitki ve bahçe ürünlerini online keşfetmenizi, sepete eklemenizi ve siparişinizi takip etmenizi sağlayan müşteri odaklı bir platformdur. Web ve mobilde aynı hesapla kullanılabilir.'
  },
  {
    question: 'AR ile bitki önizleme nasıl çalışır?',
    answer:
      'AR uyumlu ürünlerde artırılmış gerçeklik modu ile bitkinin boyutunu ve görünümünü kendi alanınızda deneyebilirsiniz. Uyumlu ürünler katalogda işaretlenir.'
  },
  {
    question: 'Siparişimi nasıl takip ederim?',
    answer:
      'Müşteri hesabınızla giriş yaptıktan sonra profil alanındaki siparişler bölümünden durumunu görüntüleyebilirsiniz.'
  },
  {
    question: 'TerraTakas nedir?',
    answer:
      'TerraTakas, bitki sahiplerinin ilan vererek takas veya teklif sürecini yönetebildiği pazar alanıdır. Detaylar için TerraTakas sayfasını ziyaret edin.'
  }
] as const;

export const HOME_STATS = [
  { value: '3+', label: 'Kategori', hint: 'İç mekan, bahçe ve daha fazlası' },
  { value: 'AR', label: 'Ürün önizleme', hint: 'Uyumlu ürünlerde canlı deneme' },
  { value: '7/24', label: 'Online katalog', hint: 'Dilediğiniz zaman göz atın' },
  { value: 'Güvenli', label: 'Sipariş takibi', hint: 'Profilden anlık durum' }
] as const;

export const STEPS_GUEST = [
  { step: '1', title: 'Giriş yapın', desc: 'Müşteri hesabınızla platforma erişin.' },
  { step: '2', title: 'Ürün seçin', desc: 'Kataloğu inceleyin, sepete ekleyin.' },
  { step: '3', title: 'Sipariş verin', desc: 'Ödemenizi tamamlayın ve siparişinizi izleyin.' }
] as const;

export const STEPS_CUSTOMER = [
  { step: '1', title: 'Ürün seçin', desc: 'Kataloğu inceleyin, sepete ekleyin.' },
  { step: '2', title: 'Sipariş verin', desc: 'Ödemenizi tamamlayın ve siparişinizi izleyin.' },
  { step: '3', title: 'Profilinizi yönetin', desc: 'AR odaları, bahçe ve TerraTakas alanlarını kullanın.' }
] as const;
