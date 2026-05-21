import { ArPreviewResponse } from '../../types/ar';

let mockPlatformOS = 'ios';
let mockNativeModules: Record<string, unknown> = {};
const mockCanOpenURL = jest.fn();
const mockOpenURL = jest.fn();

jest.mock('react-native', () => ({
  Platform: {
    get OS() {
      return mockPlatformOS;
    }
  },
  NativeModules: mockNativeModules,
  Linking: {
    canOpenURL: (...args: unknown[]) => mockCanOpenURL(...args),
    openURL: (...args: unknown[]) => mockOpenURL(...args)
  }
}));

const preview: ArPreviewResponse = {
  productId: 7,
  productName: 'Oak Table',
  modelUrl: 'https://cdn.example.com/oak-table.usdz',
  modelFormat: 'usdz',
  placementHint: 'ground',
  suggestedScale: 1
};

const loadBridge = (
  platform: 'ios' | 'android',
  nativeModule?: { launchArSession: jest.Mock }
) => {
  jest.resetModules();
  mockPlatformOS = platform;
  mockNativeModules = nativeModule ? { TerraVisionAr: nativeModule } : {};

  return require('./nativeArBridge') as typeof import('./nativeArBridge');
};

describe('launchNativeAr', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNativeModules = {};
    mockPlatformOS = 'ios';
  });

  it('delegates iOS USDZ previews to the native AR module', async () => {
    const nativeModule = { launchArSession: jest.fn().mockResolvedValue(undefined) };
    const { launchNativeAr } = loadBridge('ios', nativeModule);

    await launchNativeAr(preview);

    expect(nativeModule.launchArSession).toHaveBeenCalledWith(
      preview.modelUrl,
      preview.modelFormat,
      preview.placementHint,
      preview.suggestedScale
    );
    expect(mockOpenURL).not.toHaveBeenCalled();
  });

  it('rejects non-USDZ iOS previews before invoking native AR', async () => {
    const nativeModule = { launchArSession: jest.fn().mockResolvedValue(undefined) };
    const { launchNativeAr } = loadBridge('ios', nativeModule);

    await expect(
      launchNativeAr({
        ...preview,
        modelUrl: 'https://cdn.example.com/oak-table.gltf',
        modelFormat: 'gltf'
      })
    ).rejects.toThrow('iOS Quick Look supports USDZ models');

    expect(nativeModule.launchArSession).not.toHaveBeenCalled();
  });
});
