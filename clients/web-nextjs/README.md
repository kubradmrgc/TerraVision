# TerraVision Web (Next.js)

Bu klasor TerraVision API icin Next.js/TypeScript istemci servis taslagini icerir.

## Kurulum

1. `npm install`
2. `.env.local` dosyasina `NEXT_PUBLIC_API_BASE_URL=https://localhost:7065` ekleyin (veya `.env.local.example` dosyasini kopyalayin).
3. `npm run dev`

## Sayfalar

- `/` — yönlendirme ve bağlantılar
- `/login` — e-posta/şifre ile giriş
- `/products` — ürün listesi, sepete ekle
- `/cart` — sepet, adet, temizle, SignalR canlı olaylar, çıkış
- `/admin/orders` — admin için tüm siparişleri listeleme ve durum güncelleme

## Servisler

- `src/services/apiClient.ts`: Axios + JWT + refresh token retry
- `src/services/authService.ts`: login/logout
- `src/services/productService.ts`: urun listeleme
- `src/services/cartService.ts`: sepet CRUD operasyonlari
- `src/services/orderService.ts`: siparis olusturma, kullanici siparisleri, admin siparis yonetimi
- `src/services/arService.ts`: AR preview endpoint entegrasyonu
- `src/services/realtimeService.ts`: SignalR (`cart.changed`, `order.created`, `order.status.changed`) dinleme

## Not

Bu klasor servis odakli bir temel katman sunar. UI sayfalari ve state yonetimi (React Query/Zustand vb.) bir sonraki adimda eklenebilir.
