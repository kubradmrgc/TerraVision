import { toStatusMessage } from '../../ui/httpError';

export function mapArSessionSaveError(error: unknown): string {
  return toStatusMessage(error, 'AR yerlesimi kaydedilemedi.', {
    400: 'Gecersiz AR oturum verisi. Urun, olcek veya ekran goruntusunu kontrol edin.',
    401: 'Oturumunuz sona erdi. Lutfen tekrar giris yapin.',
    403: 'Bu islem yalnizca musteri hesaplari icin aciktir.',
    404: 'AR uyumlu urun bulunamadi.',
    413: 'Ekran goruntusu boyutu limitin uzerinde.',
    415: 'Desteklenmeyen ekran goruntusu formati. PNG veya JPEG kullanin.',
    500: 'Sunucu hatasi nedeniyle AR yerlesimi kaydedilemedi.'
  });
}
