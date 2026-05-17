import { Platform } from 'react-native';
import { ProductDto } from '../../types/product';

export type ArPlatform = 'android' | 'ios';

const supportedFormatByPlatform: Record<ArPlatform, 'gltf' | 'usdz'> = {
  android: 'gltf',
  ios: 'usdz'
};

const documentTypesByPlatform: Record<ArPlatform, string[]> = {
  android: ['model/gltf+json', 'application/octet-stream'],
  ios: ['model/vnd.usdz+zip', 'application/octet-stream']
};

const getCurrentArPlatform = (): ArPlatform => (Platform.OS === 'ios' ? 'ios' : 'android');

const getFileExtension = (fileName?: string | null): string | null => {
  if (!fileName) {
    return null;
  }

  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex < 0 || lastDotIndex === fileName.length - 1) {
    return null;
  }

  return fileName.slice(lastDotIndex + 1).toLowerCase();
};

export const getSupportedArModelExtension = (
  platform: ArPlatform = getCurrentArPlatform()
): 'gltf' | 'usdz' => supportedFormatByPlatform[platform];

export const getArUploadDocumentTypes = (
  platform: ArPlatform = getCurrentArPlatform()
): string[] => documentTypesByPlatform[platform];

export const isArUploadFileNameSupported = (
  fileName: string,
  platform: ArPlatform = getCurrentArPlatform()
): boolean => getFileExtension(fileName) === getSupportedArModelExtension(platform);

export const isProductArAvailableOnPlatform = (
  product: ProductDto,
  platform: ArPlatform = getCurrentArPlatform()
): boolean => {
  if (!product.isArCompatible) {
    return false;
  }

  const boundModelExtension = getFileExtension(product.arModelFileName);
  return boundModelExtension === null || boundModelExtension === getSupportedArModelExtension(platform);
};
