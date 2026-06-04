import { normalizeImageUploadMeta } from '../src/services/imageUploadMeta';

describe('normalizeImageUploadMeta', () => {
  it('rejects HEIC images with a clear message', () => {
    const result = normalizeImageUploadMeta('photo.HEIC', 'image/heic');
    expect(result).toEqual({ error: 'HEIC formatı desteklenmiyor. Lütfen JPG veya PNG seçin.' });
  });

  it('accepts common jpeg extensions', () => {
    const result = normalizeImageUploadMeta('listing.jpg', 'image/jpeg');
    expect(result).toEqual({ name: 'listing.jpg', type: 'image/jpeg' });
  });

  it('falls back to jpg when extension is unknown', () => {
    const result = normalizeImageUploadMeta('scan.bmp', 'image/bmp');
    expect(result).toMatchObject({ type: 'image/jpeg' });
    if ('name' in result) {
      expect(result.name).toMatch(/^exchange-\d+\.jpg$/);
    }
  });
});
