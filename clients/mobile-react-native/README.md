# TerraVision Mobile (React Native)

Bu klasor, TerraVision API ile konusan React Native (TypeScript) mobil istemci iskeletini icerir.
Admin AR model upload akisi icin `react-native-document-picker` kullanilir.
Admin urun secimi icin `@react-native-picker/picker` kullanilir.

## Kurulum

1. `npm install`
2. `src/config/env.ts` icindeki API adresini kendi backend URL'inize gore guncelleyin.
3. Android emulator veya gercek cihazdan API'ye ulasilabildigini dogrulayin.
4. `npx react-native run-android` veya `npx react-native run-ios`

## Icerik

- `src/services/apiClient.ts`: Axios istemcisi ve JWT header otomasyonu
- `src/services/authService.ts`: login/logout akisi
- `src/services/realtimeService.ts`: SignalR baglantisi (`cart.changed` dinleme)
- `src/services/cartService.ts`: Gercek cart endpoint akisi (`/api/cart/*`)
- `src/services/orderService.ts`: Siparis olusturma ve siparis listeleme (`/api/orders/*`)
- `src/services/arService.ts`: AR preview endpoint cagri servisi (`/api/ar/*`)
- `src/services/mediaService.ts`: Admin AR model upload + urune baglama servisi
- `src/features/ar/ArPreviewModal.tsx`: AR preview icin modal ekran bileseni
- `src/features/ar/ArExperienceModal.tsx`: Native AR baslatma aksiyonu icin modal
- `src/features/ar/nativeArBridge.ts`: iOS/Android native AR module bridge
- `src/features/cart/cartRealtimeExample.ts`: Sepet event abonelik ornegi
- `App.tsx`: Login + urun listeleme + realtime cart event demo akisi

## Notlar

- Sepete ekleme artik dogrudan `POST /api/cart/items` ile yapilir.
- Sepet adet guncelleme: `PUT /api/cart/items`
- Sepetten urun silme: `DELETE /api/cart/items/{productId}`
- Sepeti temizleme: `DELETE /api/cart/me`
- Cart degisiklik event'i backend tarafinda cart servisinden otomatik SignalR broadcast edilir.
- Siparis eventleri (`order.created`, `order.status.changed`) mobilde real-time dinlenir.
- AR uyumlu urunler icin `GET /api/ar/products/{productId}/preview?platform=android|ios` endpoint'i kullanilir.
- Native AR baslatma icin Android ve iOS tarafinda `TerraVisionAr.launchArSession(...)` native module'u implement edilmelidir.
- Admin kullanicilar App icindeki "Admin AR Model Upload" panelinde dosya secip `POST /api/media/ar-models?productId=...` akisini test edebilir.
- Varsayilan olarak mevcut AR modeli olan urun overwrite edilmez. Gerekirse backend endpoint'inde `overwrite=true` parametresi kullanilabilir.

## Release Hazirlik (Gün 7)

Release oncesinde mobil istemci icin kalite kapisini tek komutla dogrulayabilirsiniz:

```bash
npm run release:check
```

Bu komut sirasiyla:
- TypeScript tip kontrolu
- ESLint kontrolu
- Jest testleri (`--watch=false --runInBand`)

detaylarini calistirir.
