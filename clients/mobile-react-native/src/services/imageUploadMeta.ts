const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

export function normalizeImageUploadMeta(
  name: string | null | undefined,
  mimeType: string | null | undefined
): { name: string; type: string } | { error: string } {
  const rawName = name?.trim() || `exchange-${Date.now()}.jpg`;
  const dot = rawName.lastIndexOf('.');
  const ext = dot >= 0 ? rawName.slice(dot).toLowerCase() : '.jpg';

  const mime = mimeType?.toLowerCase() ?? '';
  if (
    ext === '.heic' ||
    ext === '.heif' ||
    mime.includes('heic') ||
    mime.includes('heif')
  ) {
    return { error: 'HEIC formatı desteklenmiyor. Lütfen JPG veya PNG seçin.' };
  }

  if (!ALLOWED_IMAGE_EXTENSIONS.has(ext)) {
    return { name: `exchange-${Date.now()}.jpg`, type: 'image/jpeg' };
  }

  const type =
    mimeType ??
    (ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg');
  return { name: rawName, type };
}
