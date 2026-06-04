import { Linking, NativeModules, Platform } from 'react-native';
import { ArPreviewResponse } from '../../types/ar';

const isHttpsUrl = (value: string) => /^https:\/\//i.test(value);

const buildAndroidSceneViewerUrl = (preview: ArPreviewResponse): string => {
  const encodedFile = encodeURIComponent(preview.modelUrl);
  const encodedTitle = encodeURIComponent(preview.productName);
  const fallbackUrl = encodeURIComponent(preview.modelUrl);

  return `intent://arvr.google.com/scene-viewer/1.0?file=${encodedFile}&mode=ar_only&title=${encodedTitle}#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;S.browser_fallback_url=${fallbackUrl};end;`;
};

const buildIosQuickLookUrl = (preview: ArPreviewResponse): string => {
  // Quick Look needs a publicly reachable https .usdz file.
  return preview.modelUrl;
};

type NativeArModule = {
  launchArSession: (
    modelUrl: string,
    modelFormat: string,
    placementHint: string,
    suggestedScale: number
  ) => Promise<void>;
};

const nativeArModule = NativeModules.TerraVisionAr as NativeArModule | undefined;

export async function launchNativeAr(preview: ArPreviewResponse): Promise<void> {
  if (!isHttpsUrl(preview.modelUrl)) {
    throw new Error('AR model URL\'si HTTPS olmalı ve internetten erişilebilir olmalı.');
  }

  if (Platform.OS === 'android') {
    if (nativeArModule?.launchArSession) {
      await nativeArModule.launchArSession(
        preview.modelUrl,
        preview.modelFormat,
        preview.placementHint,
        preview.suggestedScale
      );
      return;
    }

    const sceneViewerUrl = buildAndroidSceneViewerUrl(preview);
    const canOpen = await Linking.canOpenURL(sceneViewerUrl);
    if (!canOpen) {
      throw new Error('Google Scene Viewer could not be opened. Make sure ARCore/Google services are available.');
    }

    await Linking.openURL(sceneViewerUrl);
    return;
  }

  if (Platform.OS === 'ios') {
    if (preview.modelFormat.toLowerCase() !== 'usdz') {
      throw new Error('iOS Quick Look supports USDZ models. Upload a .usdz model for iOS AR.');
    }

    if (nativeArModule?.launchArSession) {
      await nativeArModule.launchArSession(
        preview.modelUrl,
        preview.modelFormat,
        preview.placementHint,
        preview.suggestedScale
      );
      return;
    }

    const quickLookUrl = buildIosQuickLookUrl(preview);
    const canOpen = await Linking.canOpenURL(quickLookUrl);
    if (!canOpen) {
      throw new Error('Quick Look could not be opened. Ensure the model URL is reachable over HTTPS.');
    }

    await Linking.openURL(quickLookUrl);
    return;
  }

  throw new Error(`Native AR is not supported on ${Platform.OS}.`);
}
