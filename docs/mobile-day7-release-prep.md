# Mobile Day 7 - Release Hazirlik Gunu

## Hedef

Mobil istemciyi release oncesi tekrarlanabilir ve denetlenebilir bir "go/no-go" akisina almak.

## Uygulananlar

- `clients/mobile-react-native/package.json` icine `release:check` scripti eklendi.
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test -- --watch=false --runInBand`
- `clients/mobile-react-native/README.md` icine release oncesi komut ve kapsam notu eklendi.
- CI tarafi bir onceki adimda bu kalite kapisini zaten uyguladigi icin yerel ve CI dogrulama uyumlu hale getirildi.

## Release Gununde Kontrol Listesi

1. API ayarlari:
   - `docs/production-config.md` dokumanina gore `JwtSettings__Secret` ve DB baglanti bilgileri dogrulansin.
2. Mobil kalite kapisi:
   - `clients/mobile-react-native` icinde `npm run release:check`.
3. Manuel smoke:
   - Login
   - Products listeleme
   - Cart add/update/remove
   - Order olusturma
   - Realtime durum rozeti (connected/degraded/offline)
   - Admin AR upload + AR preview
4. Build teslim dogrulamasi:
   - Android: debug/release ayrimi ve API URL kontrolu
   - iOS: build config ve AR izinleri kontrolu

## Risk ve Not

- `react-test-renderer` tarafinda React 19 kaynakli uyarilar gorulebilir; test sonucu FAIL olmadigi surece kalite kapisi gecilir.
- Realtime ve AR akislari ag kosullarina hassas oldugu icin release gunu fiziksel cihazla minimum bir smoke turu onerilir.
