const MAX_AR_FILE_SIZE_BYTES = 25 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['.gltf', '.glb', '.usdz'];
const ALLOWED_MIME_TYPES = ['model/gltf+json', 'model/gltf-binary', 'model/vnd.usdz+zip', 'application/octet-stream'];
export const AR_UPLOAD_HELP_TEXT = 'Desteklenen formatlar: .gltf, .glb, .usdz (Maksimum 25MB)';

export type CandidateArFile = {
  name?: string | null;
  type?: string | null;
  size?: number | null;
};

export function validateArUploadFile(file: CandidateArFile): string | null {
  const name = (file.name ?? '').toLowerCase();
  const type = (file.type ?? '').toLowerCase();
  const hasAllowedExtension = ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
  const hasAllowedMime = !type || ALLOWED_MIME_TYPES.includes(type);

  if (!hasAllowedExtension) {
    return 'Desteklenen AR formatları: .gltf, .glb, .usdz';
  }
  if (!hasAllowedMime) {
    return 'Dosya tipi desteklenmiyor. Lütfen geçerli bir AR modeli seçin.';
  }
  if (typeof file.size === 'number' && file.size > MAX_AR_FILE_SIZE_BYTES) {
    return 'Dosya boyutu 25MB sınırını aşmamalı.';
  }
  return null;
}
