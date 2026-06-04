import { Platform } from 'react-native';
import { keepLocalCopy, type DocumentPickerResponse } from '@react-native-documents/picker';
import type { Asset } from 'react-native-image-picker';
import { API_BASE_URL } from '../config/env';
import { tokenStore } from './tokenStore';
import type { UploadFileInput } from './mediaService';
import { normalizeImageUploadMeta } from './imageUploadMeta';
import { validateImageBlobForUpload } from './imageBytesValidation';
import { resolveMediaPublicUrl } from './mediaPublicUrl';

export function ensureFileUri(uri: string): string {
  const trimmed = uri.trim();
  if (
    trimmed.startsWith('file://') ||
    trimmed.startsWith('content://') ||
    /^https?:\/\//i.test(trimmed)
  ) {
    return trimmed;
  }
  return `file://${trimmed.replace(/^\/+/, '')}`;
}

export class MultipartUploadError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'MultipartUploadError';
    this.status = status;
  }
}

export async function readUploadBlob(file: UploadFileInput): Promise<Blob> {
  const response = await fetch(ensureFileUri(file.uri));
  if (!response.ok) {
    throw new Error('Fotoğraf dosyası okunamadı.');
  }
  return response.blob();
}

function parseUploadErrorBody(bodyText: string): string {
  const trimmed = bodyText.trim();
  if (!trimmed) {
    return '';
  }
  try {
    const json = JSON.parse(trimmed) as { message?: string; title?: string; detail?: string };
    return (json.message ?? json.title ?? json.detail ?? trimmed).trim();
  } catch {
    return trimmed;
  }
}

async function copyUriToCache(uri: string, fileName: string): Promise<string | { error: string }> {
  const copies = await keepLocalCopy({
    destination: 'cachesDirectory',
    files: [{ uri, fileName }]
  });
  const copy = copies[0];
  if (!copy || copy.status !== 'success') {
    return {
      error: copy?.status === 'error' ? copy.copyError : 'Fotoğraf hazırlanamadı.'
    };
  }
  return ensureFileUri(copy.localUri);
}

export async function prepareLocalImageUri(
  uri: string,
  fileName: string
): Promise<string | { error: string }> {
  if (Platform.OS === 'android' && uri.startsWith('content://')) {
    return copyUriToCache(uri, fileName);
  }
  return ensureFileUri(uri);
}

export type PickGalleryResult =
  | { cancelled: true }
  | { error: string }
  | { file: UploadFileInput };

export async function resolveGalleryAssetForUpload(
  asset: Asset | undefined
): Promise<PickGalleryResult> {
  if (!asset?.uri) {
    return { error: 'Fotoğraf seçilemedi. Tekrar deneyin.' };
  }

  const meta = normalizeImageUploadMeta(
    asset.fileName ?? `exchange-${Date.now()}.jpg`,
    asset.type
  );
  if ('error' in meta) {
    return meta;
  }

  const prepared = await prepareLocalImageUri(asset.uri, meta.name);
  if (typeof prepared !== 'string') {
    return prepared;
  }

  return { file: { uri: prepared, name: meta.name, type: meta.type } };
}

export async function resolvePickerImageForUpload(
  file: DocumentPickerResponse
): Promise<UploadFileInput | { error: string }> {
  if (!file.uri) {
    return { error: 'Fotoğraf seçilemedi. Tekrar deneyin.' };
  }

  const meta = normalizeImageUploadMeta(file.name, file.type);
  if ('error' in meta) {
    return meta;
  }

  const prepared = await prepareLocalImageUri(file.uri, meta.name);
  if (typeof prepared !== 'string') {
    return prepared;
  }

  return { uri: prepared, name: meta.name, type: meta.type };
}

/** Multipart upload via fetch + local file URI (reliable on Android; avoids empty axios bodies). */
export async function postMultipartFile(
  path: string,
  file: UploadFileInput,
  fieldName = 'file'
): Promise<string> {
  const blob = await readUploadBlob(file);
  const validated = await validateImageBlobForUpload(blob, file.name);
  if ('error' in validated) {
    throw new MultipartUploadError(400, validated.error);
  }

  const uploadFile: UploadFileInput = {
    uri: ensureFileUri(file.uri),
    name: validated.name,
    type: validated.type
  };

  const formData = new FormData();
  formData.append(fieldName, {
    uri: uploadFile.uri,
    name: uploadFile.name,
    type: uploadFile.type
  } as unknown as Blob);

  const token = await tokenStore.getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData
  });

  const bodyText = await response.text();
  if (!response.ok) {
    const message =
      parseUploadErrorBody(bodyText) || `Yükleme başarısız (${response.status})`;
    throw new MultipartUploadError(response.status, message);
  }

  const data = JSON.parse(bodyText) as { url?: string; Url?: string };
  const uploaded = data.url ?? data.Url;
  if (!uploaded) {
    throw new Error('Sunucu fotoğraf adresi döndürmedi.');
  }
  return resolveMediaPublicUrl(uploaded);
}
