import {
  detectImageFormat,
  isHeicOrHeif,
  validateImageBlobForUpload
} from '../src/services/imageBytesValidation';

describe('imageBytesValidation', () => {
  it('detects JPEG magic', () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
    expect(detectImageFormat(bytes)?.ext).toBe('.jpg');
  });

  it('detects HEIC ftyp brand', () => {
    const bytes = new Uint8Array(16);
    bytes.set([0x66, 0x74, 0x79, 0x70], 4);
    bytes.set([0x68, 0x65, 0x69, 0x63], 8);
    expect(isHeicOrHeif(bytes)).toBe(true);
  });

  it('rejects empty blob', async () => {
    const blob = new Blob([], { type: 'image/jpeg' });
    const result = await validateImageBlobForUpload(blob, 'photo.jpg');
    expect(result).toEqual({ error: 'Fotoğraf okunamadı veya boş. Başka bir görsel deneyin.' });
  });
});
