# Mobil uygulamayı fiziksel cihazda çalıştırma

TerraVision mobil istemci: **React Native** (`clients/mobile-react-native`). Expo değil; Android Studio + USB veya Wi-Fi ile kurulum gerekir.

## Ön koşullar

| Bileşen | Durum |
|--------|--------|
| Node.js 22+ | `package.json` engines |
| Android Studio + SDK | Emülatör veya gerçek cihaz |
| USB hata ayıklama (Android) | Telefonda geliştirici seçenekleri |
| API | `dotnet run --launch-profile http` (port **5090**, tüm ağ arayüzleri) |
| Aynı Wi-Fi | Telefon ve bilgisayar aynı ağda (Wi-Fi modu) |

## Hızlı kurulum (Windows)

### 1. API’yi başlatın (proje kökü)

```powershell
cd c:\Users\hp\Desktop\TerraVision.Api
dotnet run --launch-profile http
```

Tarayıcıdan test: `http://localhost:5090/api/products`

### 2. Mobil bağımlılıklar ve cihaz ayarı

```powershell
cd clients\mobile-react-native
npm install
npm run setup:device
```

`setup:device` şunları yapar:

- Bilgisayarınızın **yerel IP** adresini bulur
- `src/config/api.config.local.ts` dosyasını oluşturur
- USB ile bağlı Android varsa **adb reverse** (Metro + API portları)

### 3. Metro (ayrı terminal)

```powershell
cd clients\mobile-react-native
npm start
```

Port: **8082** (varsayılan).

### 4. Uygulamayı telefona yükleyin

Telefon USB ile bağlı, ekran kilidi açık, “USB debugging” onaylı:

```powershell
cd clients\mobile-react-native
npm run android:win
```

İlk derleme 5–15 dakika sürebilir.

## Bağlantı modları

| Mod | Ne zaman | Ayar |
|-----|----------|------|
| **Wi-Fi** (önerilen) | Telefon ve PC aynı ağda | `API_CONNECT_MODE = 'wifi'` + `API_URL_OVERRIDE = 'http://PC_IP:5090'` (`setup:device` yazar) |
| **USB** | Sadece kablo, adb reverse | `API_CONNECT_MODE = 'usb'` — API adresi `localhost` (reverse ile PC’ye gider) |
| **Emülatör** | Android Emulator | `api.config.local.ts` silin veya `emulator`; varsayılan `10.0.2.2` |

Örnek dosya: `src/config/api.config.example.ts`

## Sık sorunlar

| Belirti | Çözüm |
|--------|--------|
| `INSTALL_FAILED_USER_RESTRICTED` | Xiaomi: **Geliştirici seçenekleri** → **USB ile yükleme** (Mi hesabı gerekebilir) **Açık**; **USB hata ayıklama (güvenlik)** → bu PC’ye izin. Play Protect’i kapatmak yetmez. Alternatif: PC’den APK’yı `Download/TerraVision-debug.apk` olarak kopyalayıp telefonda **Dosyalar** ile açıp yükleyin |
| `No matching ABIs` | `npm run android:win` telefon için **arm64-v8a** derler (`--active-arch-only`) |
| Kırmızı ekran / Metro | `npm start` çalışıyor mu? `adb reverse` için `npm run setup:device` |
| API’ye ulaşılamıyor | API çalışıyor mu? Windows Güvenlik Duvarı’nda **5090** izni |
| Yanlış IP | `npm run setup:device` tekrar çalıştırın |
| Gradle / JDK | `npm run android:win` (JDK 17) veya `JAVA_HOME` → Android Studio JBR |

## Demo giriş

- Müşteri: `customer@terravision.com` / `customer123`
- Admin: `admin@terravision.com` / `admin123`

## iOS fiziksel cihaz

macOS + Xcode gerekir. `api.config.local.ts` içinde Mac’in yerel IP’si ile `API_URL_OVERRIDE` ayarlayın; `npm run ios`.
