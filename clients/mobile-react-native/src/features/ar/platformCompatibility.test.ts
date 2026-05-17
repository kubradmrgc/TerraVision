import {
  isArUploadFileNameSupported,
  isProductArAvailableOnPlatform
} from './platformCompatibility';
import { ProductDto } from '../../types/product';

const product = (overrides: Partial<ProductDto>): ProductDto => ({
  id: 1,
  name: 'Test Plant',
  description: 'Plant',
  price: 10,
  stockQuantity: 5,
  sku: 'plant-1',
  imageUrl: '',
  isArCompatible: true,
  categoryId: 1,
  ...overrides
});

describe('AR platform compatibility', () => {
  it('treats USDZ as iOS-only and GLTF as Android-only for bound product models', () => {
    expect(
      isProductArAvailableOnPlatform(product({ arModelFileName: 'plant.usdz' }), 'ios')
    ).toBe(true);
    expect(
      isProductArAvailableOnPlatform(product({ arModelFileName: 'plant.usdz' }), 'android')
    ).toBe(false);
    expect(
      isProductArAvailableOnPlatform(product({ arModelFileName: 'plant.gltf' }), 'android')
    ).toBe(true);
    expect(
      isProductArAvailableOnPlatform(product({ arModelFileName: 'plant.gltf' }), 'ios')
    ).toBe(false);
  });

  it('allows AR-compatible products without a bound model to use API platform fallbacks', () => {
    expect(isProductArAvailableOnPlatform(product({ arModelFileName: undefined }), 'ios')).toBe(true);
    expect(isProductArAvailableOnPlatform(product({ arModelFileName: undefined }), 'android')).toBe(true);
  });

  it('rejects upload filenames that do not match the current platform format', () => {
    expect(isArUploadFileNameSupported('plant.usdz', 'ios')).toBe(true);
    expect(isArUploadFileNameSupported('plant.gltf', 'ios')).toBe(false);
    expect(isArUploadFileNameSupported('plant.gltf', 'android')).toBe(true);
    expect(isArUploadFileNameSupported('plant.usdz', 'android')).toBe(false);
    expect(isArUploadFileNameSupported('plant', 'android')).toBe(false);
  });
});
