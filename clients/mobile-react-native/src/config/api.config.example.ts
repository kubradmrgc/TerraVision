/**
 * Bu dosyayı `api.config.local.ts` olarak kopyalayın (git'e eklenmez).
 * `npm run setup:device` komutu bunu otomatik oluşturur.
 */
export const API_CONNECT_MODE = 'wifi' as 'wifi' | 'usb' | 'emulator';

/** Wi-Fi modunda: bilgisayarınızın yerel IP'si (ör. http://192.168.1.42:5090) */
export const API_URL_OVERRIDE = 'http://192.168.1.42:5090';
