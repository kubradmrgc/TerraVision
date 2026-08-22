import { toStatusMessage } from '../../ui/httpError';

export function mapArSessionSaveError(error: unknown): string {
  return toStatusMessage(error, 'AR yerleşimi kaydedilemedi.', {
    400: 'Geçersiz AR oturum verisi. Ürün, ölçek veya ekran görüntüsünü kontrol edin.',
    401: 'Oturumunuz sona erdi. Lütfen tekrar giriş yapın.',
    403: 'Bu işlem yalnızca müşteri hesapları için açıktır.',
    404: 'AR uyumlu ürün bulunamadı.',
    413: 'Ekran görüntüsü boyutu limitin üzerinde.',
    415: 'Desteklenmeyen ekran görüntüsü formatı. PNG veya JPEG kullanın.',
    500: 'Sunucu hatası nedeniyle AR yerleşimi kaydedilemedi.'
  });
}
