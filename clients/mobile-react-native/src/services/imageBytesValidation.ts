export type DetectedImageFormat = {
  ext: '.jpg' | '.png' | '.webp';
  mime: 'image/jpeg' | 'image/png' | 'image/webp';
};

const MAX_BYTES = 5 * 1024 * 1024;
const HEADER_BYTES = 16;

/** React Native Hermes often lacks Blob.prototype.arrayBuffer — use FileReader. */
async function readBlobPrefix(blob: Blob, byteCount: number): Promise<Uint8Array> {
  const slice = typeof blob.slice === 'function' ? blob.slice(0, byteCount) : blob;
  if (typeof slice.arrayBuffer === 'function') {
    return new Uint8Array(await slice.arrayBuffer());
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(new Uint8Array(reader.result));
        return;
      }
      reject(new Error('Fotoğraf okunamadı.'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('Fotoğraf okunamadı.'));
    reader.readAsArrayBuffer(slice);
  });
}

function readAscii(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.slice(start, start + length));
}

export function isHeicOrHeif(bytes: Uint8Array): boolean {
  if (bytes.length < 12) {
    return false;
  }
  if (readAscii(bytes, 4, 4) !== 'ftyp') {
    return false;
  }
  const brand = readAscii(bytes, 8, 4).toLowerCase();
  return (
    brand.startsWith('heic') ||
    brand.startsWith('heix') ||
    brand.startsWith('hevc') ||
    brand.startsWith('heif') ||
    brand === 'mif1' ||
    brand === 'msf1'
  );
}

export function detectImageFormat(bytes: Uint8Array): DetectedImageFormat | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { ext: '.jpg', mime: 'image/jpeg' };
  }

  const pngHeader = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length >= pngHeader.length && pngHeader.every((b, i) => bytes[i] === b)) {
    return { ext: '.png', mime: 'image/png' };
  }

  if (
    bytes.length >= 12 &&
    readAscii(bytes, 0, 4) === 'RIFF' &&
    readAscii(bytes, 8, 4) === 'WEBP'
  ) {
    return { ext: '.webp', mime: 'image/webp' };
  }

  return null;
}

export async function validateImageBlobForUpload(
  blob: Blob,
  suggestedName: string
): Promise<{ name: string; type: string } | { error: string }> {
  if (blob.size <= 0) {
    return { error: 'Fotoğraf okunamadı veya boş. Başka bir görsel deneyin.' };
  }
  if (blob.size > MAX_BYTES) {
    return { error: 'Fotoğraf en fazla 5 MB olabilir.' };
  }

  const header = await readBlobPrefix(blob, HEADER_BYTES);
  if (isHeicOrHeif(header)) {
    return {
      error:
        'HEIC formatı desteklenmiyor (Xiaomi/Redmi sık kullanır). Galeride JPG/PNG kaydedin veya başka fotoğraf seçin.'
    };
  }

  const detected = detectImageFormat(header);
  if (!detected) {
    return { error: 'Yalnızca JPG, PNG veya WebP yüklenebilir.' };
  }

  const base =
    suggestedName.replace(/\.[^./\\]+$/, '').trim() || `exchange-${Date.now()}`;
  return { name: `${base}${detected.ext}`, type: detected.mime };
}
