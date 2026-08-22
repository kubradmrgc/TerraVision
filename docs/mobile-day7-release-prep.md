# Mobile Day 7 - Release Hazirlik Gunu

## Hedef

Mobil istemci ve API tarafini release oncesi tekrarlanabilir ve denetlenebilir bir "go/no-go" akisina almak.

## Uygulananlar

- `clients/mobile-react-native/package.json` icine `release:check` scripti eklendi.
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test -- --watch=false --runInBand`
- `clients/mobile-react-native/README.md` icine release oncesi komut ve kapsam notu eklendi.
- CI tarafi bir onceki adimda bu kalite kapisini zaten uyguladigi icin yerel ve CI dogrulama uyumlu hale getirildi.
- `scripts/release-check.ps1`: repo kokunden `dotnet test` + mobil `npm run release:check`.
- CI mobil job: `npm run typecheck` / `lint` / `test` ayri yerine tek `npm run release:check`.
- Asagida **Ek: API manuel smoke** ile Scalar + PowerShell ornegi (auth + randevu akisi).

## Smoke ve release kontrol listesi

Otomatik (CI veya yerel, her PR / release adayinda):

1. **Backend testleri** — repo kokunden:
   ```bash
   dotnet test
   ```
   - Windows’ta mobil ile arka arkaya: `pwsh ./scripts/release-check.ps1` (once `dotnet test`, sonra `clients/mobile-react-native` icinde `npm run release:check`).
   - Entegrasyon: `SmokeTests` (login, health vb.), randevu durum guncelleme yetki matrisi (`AppointmentStatusUpdateAuthorizationTests`).
2. **Mobil kalite kapisi** — `clients/mobile-react-native` icinde:
   ```bash
   npm run release:check
   ```
   - TypeScript, ESLint, Jest (`--watch=false --runInBand`).

Konfigurasyon (ortama gore, release oncesi):

3. **API ayarlari**
   - `docs/production-config.md` dokumanina gore `JwtSettings__Secret` ve DB baglanti bilgileri dogrulansin.
   - JWT issuer/audience/secret ile mobil `src/config/env.ts` API taban adresi uyumlu olsun.

**Manuel smoke** (API ayakta + mobil veya Scalar/OpenAPI ile; fiziksel cihaz veya emulator):

4. **Kimlik**
   - Login (gecerli kullanici); basarisiz login mesaji.
   - Logout sonrasi korumali isteklerin reddi / oturum temizligi (mobilde yeniden login gerekir).
5. **Randevular**
   - **Musteri:** randevu olusturma (consultant ID + tarih + istege bagli not), liste ve filtre.
   - **Consultant / Admin:** randevu durumu guncelleme (Pending → Approved / Completed / Cancelled); musteri hesabinda durum butonlarinin kapali oldugunu dogrulayin.
6. **Ticaret ve realtime**
   - Products listeleme
   - Cart add / update / remove
   - Order olusturma
   - Realtime durum rozeti (connected / degraded / offline)
7. **Admin**
   - AR model upload + AR preview (admin hesabi)

8. **AR — ne durumda + smoke (sira: ticaret sonrasi, build oncesi)**
   - **Durum (kisa):**
     - API: urun bazli onizleme `GET /api/ar/products/{productId}/preview`, model yukleme `POST /api/media/ar-models` (admin); mobil README’de endpoint ozeti var.
     - Mobil: `ArPreviewModal` + `ArExperienceModal` akisi; `nativeArBridge` — `NativeModules.TerraVisionAr` **varsa** native `launchArSession`; **yoksa** Android’de Google Scene Viewer intent, iOS’ta HTTPS **USDZ** ile Quick Look / URL (glTF-only urunlerde iOS’ta native modul veya USDZ yuklemesi gerekir, aksi halde beklenen hata mesaji).
     - Otomatik: `arUploadValidation` + ilgili Jest’ler `release:check` icinde; native AR modulu repo icinde zorunlu degil, cihaz/build tarafinda baglanir.
   - **Manuel smoke:** admin ile gecerli formatta model yukle; AR uyumlu urunde preview acilsin; “Start Native AR” ile ya native modul ya fallback yolunun calistigini dogrula; iOS’ta glTF-only senaryoda kullaniciya dusen mesaji not et (beklenen sinir).

**Build teslim dogrulamasi**

9. Android: debug/release ayrimi ve API URL kontrolu
10. iOS: build config ve AR izinleri kontrolu

## Risk ve Not

- `react-test-renderer` tarafinda React 19 kaynakli uyarilar gorulebilir; test sonucu FAIL olmadigi surece kalite kapisi gecilir.
- Realtime ve AR akislari ag kosullarina hassas oldugu icin release gunu fiziksel cihazla minimum bir smoke turu onerilir; AR icin madde 8 ozellikle cihaz + HTTPS model erisimine baglidir.

## Ek: API manuel smoke (Scalar veya PowerShell)

API’yi `Development` ile calistiriyken OpenAPI + **Scalar** arayuzunu kullanin: tarayicida `http://localhost:5090/scalar/v1` veya `http://localhost:5090/scalar` (Scalar / OpenAPI surumune gore; taban URL `Properties/launchSettings.json` http profili ile uyumlu olmali) uzerinden `Auth` ve `Appointments` isteklerini deneyebilirsiniz.

Asagidaki **PowerShell** ornegi yeni kullanicilar kaydeder, musteri ile randevu acar, consultant token’i ile durumu **Approved (2)** yapar. `role`: `1` = Customer, `2` = Consultant, `3` = Admin.

```powershell
$BASE = "http://localhost:5090"   # launchSettings http profili
$suffix = [guid]::NewGuid().ToString("N").Substring(0, 10)

$rCons = Invoke-RestMethod -Method Post -Uri "$BASE/api/Auth/register" -ContentType "application/json" `
  -Body (@{ firstName="Sm"; lastName="Con"; email="smoke_cons_$suffix@test.local"; password="TestPwd!1"; role=2 } | ConvertTo-Json)
$consToken = $rCons.token
$consUserId = $rCons.userId

$rCust = Invoke-RestMethod -Method Post -Uri "$BASE/api/Auth/register" -ContentType "application/json" `
  -Body (@{ firstName="Sm"; lastName="Cust"; email="smoke_cust_$suffix@test.local"; password="TestPwd!1"; role=1 } | ConvertTo-Json)
$custToken = $rCust.token

$when = (Get-Date).ToUniversalTime().AddDays(1).ToString("o")
$createBody = @{ consultantId = $consUserId; appointmentDate = $when; notes = "manual smoke" } | ConvertTo-Json
$appt = Invoke-RestMethod -Method Post -Uri "$BASE/api/Appointments" `
  -Headers @{ Authorization = "Bearer $custToken" } -ContentType "application/json" -Body $createBody

$apptId = $appt.id
$statusBody = @{ id = $apptId; status = 2 } | ConvertTo-Json   # 2 = Approved
Invoke-RestMethod -Method Put -Uri "$BASE/api/appointments/$apptId/status" `
  -Headers @{ Authorization = "Bearer $consToken" } -ContentType "application/json" -Body $statusBody
```

Beklenen: register ve create **200** bandi; status guncelleme **200** ve yanitta guncel durum. Musteri token’i ile ayni `PUT` denemesi **403** olmalı (checklist madde 5).
