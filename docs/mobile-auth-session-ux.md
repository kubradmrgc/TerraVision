# Mobile Auth Session UX

Bu dokuman mobil istemcide auth/session davranisini standartlastirir.

## Tek Tip Kullanici Mesajlari

- Login hatasi: `Email veya sifre gecersiz olabilir.`
- Session timeout / 401: `Oturumunuz sonlandi. Lutfen tekrar giris yapin.`
- Session restore partial token: `Oturum bilgisi eksik bulundu. Lutfen tekrar giris yapin.`

Mesajlar merkezi olarak `clients/mobile-react-native/src/features/auth/session.ts` dosyasinda tutulur.

## Session Restore Akisi

Uygulama acilisinda access + refresh token birlikte kontrol edilir:

1. Ikisi de varsa: session `active` kabul edilir, kullanici loginli acilir.
2. Ikisi de yoksa: session `none`, login ekraninda kalinir.
3. Sadece biri varsa: session `partial`, tokenlar temizlenir ve standart mesaj gosterilir.

## 401 / Unauthorized Akisi

- `apiClient` interceptor refresh denemesinden sonra hala 401 alirsa tokenlari temizler.
- `onUnauthorized` callback'i calisir.
- Controller tarafinda:
  - Query cache temizlenir.
  - Realtime baglantisi kapanir.
  - Realtime status `offline` olur.
  - Kullanici login ekranina dusurulur.
  - Tek seferlik session timeout mesaji gosterilir.

## Logout Akisi

- `authService.logout()` cagrilir.
- Realtime baglantisi kapatilir.
- Query cache temizlenir.
- Uygulama state'i resetlenir.
- Kullanici tercihleri korunur:
  - theme mode
  - email alaninda son girilen deger

## Test Senaryolari

- `__tests__/authSession.test.ts`
  - active / none / partial session restore durumlari
  - partial durumda token temizleme davranisi
  - logout state reset fonksiyonu (theme+email korunumu)
  - standart auth mesajlari
