import { Platform } from 'react-native';
import { errorCodes, isErrorWithCode, pick, types } from '@react-native-documents/picker';
import { launchImageLibrary } from 'react-native-image-picker';
import {
  resolveGalleryAssetForUpload,
  resolvePickerImageForUpload,
  type PickGalleryResult
} from './uploadFileHelpers';

/** Android: sistem dosya/galeri seçici (izin gerekmez). iOS: fotoğraf kütüphanesi. */
async function pickWithDocumentPicker(): Promise<PickGalleryResult> {
  const [file] = await pick({ type: [types.images], allowMultiSelection: false, mode: 'import' });
  if (!file) {
    return { cancelled: true };
  }
  const resolved = await resolvePickerImageForUpload(file);
  if ('error' in resolved) {
    return { error: resolved.error };
  }
  return { file: resolved };
}

async function pickWithImageLibrary(): Promise<PickGalleryResult> {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    selectionLimit: 1,
    quality: 0.8,
    maxWidth: 2048,
    maxHeight: 2048
  });

  if (result.didCancel) {
    return { cancelled: true };
  }
  if (result.errorCode) {
    return { error: result.errorMessage ?? 'Galeri açılamadı.' };
  }

  return resolveGalleryAssetForUpload(result.assets?.[0]);
}

export async function pickGalleryPhotoForUpload(): Promise<PickGalleryResult> {
  try {
    if (Platform.OS === 'android') {
      return await pickWithDocumentPicker();
    }
    return await pickWithImageLibrary();
  } catch (error) {
    if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) {
      return { cancelled: true };
    }
    const message = error instanceof Error ? error.message : 'Fotoğraf seçilemedi.';
    return { error: message };
  }
}
