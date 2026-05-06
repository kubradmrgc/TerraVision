# Mobile Day 4 - Cart/Order UX Checklist

## UX Uyumluluk Checklist'i

- [x] Cart aksiyon butonlarinda (`place order`, `clear`, `+/-`, `remove`) ortak disabled/loading davranisi var.
- [x] Sepet bosken siparis/temizleme butonlari pasif (yanlis tiklamayi engelleme).
- [x] Mutasyon surerken tekrar tiklamalari engelleyen tek pattern kullaniliyor.
- [x] Status code bazli aciklayici hata mesajlari var (401, 400, 404, 409, 500).
- [x] Cart ekraninda empty/loading/error varyantlari tek tip mesaj bileseniyle gosteriliyor.
- [x] Orders ekraninda empty/loading/error varyantlari tek tip mesaj bileseniyle gosteriliyor.
- [x] Siparis basarili oldugunda:
  - order + cart query invalidate edilir,
  - kullanici otomatik `orders` sekmesine yonlendirilir,
  - ustte tek seferlik basari mesaji gosterilir.
- [x] Cart ve order hatalari controller katmaninda ayrik state ile yonetiliyor.

## Before / After (Ekran Bazli)

### Cart

**Before**
- Butonlar her islemde aktifti, cift tik ile tekrar istek atilabiliyordu.
- Sepet bosken dahi `place order` denenebiliyordu.
- Empty metni yonlendirici degildi.

**After**
- Tum cart butonlari mutasyon boyunca disabled + islem metni davranisina sahip.
- Sepet bosken `place order` ve `clear cart` pasif.
- Bos durumda yonlendirici mesaj var: urunler sekmesinden ekleme akisina yonlendiriyor.
- Status-bazli aciklayici mesajlar gosteriliyor:
  - 400: gecersiz istek
  - 401: session timeout
  - 404: urun yok
  - 409: stok yetersiz
  - 500: sunucu hatasi

### Orders

**Before**
- Siparisler yalnizca tek satir metin listesi olarak gorunuyordu.
- Empty/loading/error ayrimi vardi ama bilgi yogunlugu dusuktu.

**After**
- Her siparis kart benzeri blokta: `id`, `durum`, `toplam` olarak daha okunur.
- Empty metni aksiyon odakli hale getirildi.
- `loading`, `error`, `empty`, `list` durumlari net.

## Test Notlari

- `mobileFlow.integration.test.tsx` kapsaminda:
  - cart hata mesaji haritalama,
  - order hata mesaji haritalama,
  - order basarisi sonrasi `orders` sekmesine yonlenme + basari mesaji
    senaryolari dogrulandi.
