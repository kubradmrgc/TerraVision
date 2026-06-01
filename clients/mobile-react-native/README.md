# TerraVision Mobile (React Native)

Bu klasor, TerraVision API ile konusan React Native (TypeScript) mobil istemci iskeletini icerir.
Admin AR model upload akisi icin `react-native-document-picker` kullanilir.
Admin urun secimi icin `@react-native-picker/picker` kullanilir.

## Kurulum

1. `npm install`
2. `src/config/env.ts` icindeki API adresini kendi backend URL'inize gore guncelleyin.
3. Android emulator veya gercek cihazdan API'ye ulasilabildigini dogrulayin.
4. `npx react-native run-android` veya `npx react-native run-ios`

## Android Studio + emülatör (Windows)

1. **Android Studio** kurulu olsun; **SDK Manager** ile en az bir **Android Platform** (compileSdk ile uyumlu, bkz. `android/build.gradle` icindeki `compileSdkVersion`) ve **Android SDK Build-Tools** yuklu olsun.
2. **Device Manager** ile bir **Virtual Device (AVD)** olusturup emülatörü bir kez acin.
3. Proje kokunde (bu klasorde) bir kez SDK yolunu yazdirin (Gradle icin `android/local.properties` uretir):
   - `npm run setup:android`
4. **Android Studio** ile acmak icin: **File → Open** → su klasoru secin:
   - `clients/mobile-react-native/android`
   Gradle sync tamamlaninca **Run** ile uygulamayi secili emülatore yukleyebilirsiniz (Metro ayri calisiyorsa daha hizli olur; asagiya bakin).
5. **Terminalden** calistirmak icin (Windows’ta eski `JAVA_HOME` JDK 8 ise Gradle 17 ister):
   - Bir terminal: `npm start` (Metro bundler)
   - Ikinci terminal: `npm run android:win` (Android Studio’nun **JBR / JDK 17** yolunu kullanir; `android/local.properties` icindeki SDK altinda **adb** icin `platform-tools` ve `emulator` klasorlerini PATH’e ekler)
   - Alternatif: Kalici olarak `JAVA_HOME`’u Android Studio JBR’ye yonlendirin, sonra `npm run android` yeterli olur.
   - **Gradle:** Bu projede wrapper **8.13** kullanilir (React Native’in **AGP 8.12** ile uyumu). Gradle **9.x** kullanildiginda `IBM_SEMERU` toolchain hatasi olusabilir; bu yuzden 8.13 sabitlendi.
6. Emülatorden bilgisayardaki API’ye baglanmak icin `env.ts` icinde cogu durumda `10.0.2.2` + port kullanilir (`localhost` emülatorde kendini gosterir).

## Icerik

- `src/services/apiClient.ts`: Axios istemcisi ve JWT header otomasyonu
- `src/features/profile/ProfileSection.tsx`: Profil/hesap ekrani (kullanici bilgisi, tema, cikis)
- `src/services/authService.ts`: login/register/logout akisi
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

Mobil kalite kapisi (bu klasorde):

```bash
npm run release:check
```

Bu komut sirasiyla TypeScript, ESLint ve Jest (`--watch=false --runInBand`) calistirir.

Tam stack release oncesi: repo kokunden `pwsh ./scripts/release-check.ps1` ( `dotnet test` + bu klasorde `npm run release:check` ); manuel auth/randevu/API smoke ve diger maddeler `docs/mobile-day7-release-prep.md` dosyasinda (Scalar + PowerShell ornegi dahil).
