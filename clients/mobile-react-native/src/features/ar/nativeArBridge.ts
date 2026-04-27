import { NativeModules, Platform } from 'react-native';
import { ArPreviewResponse } from '../../types/ar';

type NativeArModule = {
  launchArSession: (params: {
    modelUrl: string;
    modelFormat: string;
    placementHint: string;
    suggestedScale: number;
  }) => Promise<void>;
};

const nativeArModule = NativeModules.TerraVisionAr as NativeArModule | undefined;

export async function launchNativeAr(preview: ArPreviewResponse): Promise<void> {
  if (!nativeArModule?.launchArSession) {
    throw new Error(
      `Native AR bridge is not configured for ${Platform.OS}. Expected NativeModules.TerraVisionAr.launchArSession(...)`
    );
  }

  await nativeArModule.launchArSession({
    modelUrl: preview.modelUrl,
    modelFormat: preview.modelFormat,
    placementHint: preview.placementHint,
    suggestedScale: preview.suggestedScale
  });
}
