# Mobile Day 5 - AR Akisi Sertlestirme

## Uygulanan Iyilestirmeler

- Upload sirasinda progress gosterimi eklendi (`0-100%`).
- Sunucu kaynakli AR upload hatalari status koduna gore net mesajlara map edildi.
- AR upload kartinda dosya tip/boyut yardim metni kalici olarak gosterilir hale getirildi.
- Basarisiz upload sonrasi CTA metni otomatik `Retry Upload` olur.
- Secilen dosyayi tek tikla sifirlama (`Clear Selected File`) eklendi.
- Basarili upload sonrasi kart icinde kalici basari mesaji gosterilir.
- AR preview hatalari da status-kod bazli mesajlarla kullaniciya verilir.

## AR Kullanici Akisi Testi

1. Admin kullanici ile login ol.
2. `Products` sekmesinde `Admin AR Model Upload` bolumune git.
3. `Pick AR Model File` ile `.gltf/.glb/.usdz` bir dosya sec.
4. Yardim metninin gorundugunu dogrula (`Desteklenen formatlar... Maksimum 25MB`).
5. `Upload And Bind Model` tikla.
6. Progress metninin artarak gorundugunu dogrula (`Uploading X%`).
7. Basari sonrasi:
   - `Upload Successful` mesaji,
   - kartta `Model baglandi: ...` metni,
   - secili dosya alaninin sifirlanmasi,
   - urun listesinin yenilenmesi.
8. Hata alinirsa buton metninin `Retry Upload` oldugunu kontrol et.
9. `Clear Selected File` ile secimin temizlendigini dogrula.

## Hata Senaryosu Dogrulamasi

- `400`: format/boyut/icerik validasyonu uygun degil.
- `401`: session timeout.
- `403`: admin yetkisi yok.
- `404`: secili urun bulunamadi.
- `413`: dosya boyutu limit ustu.
- `415`: desteklenmeyen dosya tipi.
- `500`: sunucu hatasi.

Her senaryoda UI `arUploadErrorMessage` ile aciklayici metin gosterir.

## Test Notu

- `mobileFlow.integration.test.tsx` icerisinde dosya temizleme aksiyonu ile
  AR feedback state'lerinin sifirlanmasi dogrulandi.
