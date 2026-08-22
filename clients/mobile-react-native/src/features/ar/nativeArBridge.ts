import { Alert, Linking, NativeModules, Platform } from 'react-native';
import { ArPreviewResponse } from '../../types/ar';
import { isDevReachableModelUrl, resolveArModelUrl } from './arModelUrl';

const isHttpsUrl = (value: string) => /^https:\/\//i.test(value);

const canLaunchModelUrl = (value: string) =>
  isHttpsUrl(value) || (__DEV__ && isDevReachableModelUrl(value));

const SCENE_VIEWER_PACKAGE = 'com.google.android.googlequicksearchbox';
const GOOGLE_APP_PLAY_STORE = 'market://details?id=com.google.android.googlequicksearchbox';
/** Public HTTPS tree used for Scene Viewer camera AR when dev model is LAN/http only. */
const DEV_HTTPS_AR_DEMO_MODEL =
  'https://static.poly.pizza/7f84a768-ac30-48d4-9c5d-f760492e7867.glb';

const resolveSceneViewerModelUrl = (modelUrl: string): string => {
  if (isHttpsUrl(modelUrl)) {
    return modelUrl;
  }
  if (__DEV__ && isDevReachableModelUrl(modelUrl)) {
    return DEV_HTTPS_AR_DEMO_MODEL;
  }
  return modelUrl;
};

const buildAndroidSceneViewerUrl = (preview: ArPreviewResponse): string => {
  const modelUrl = resolveSceneViewerModelUrl(preview.modelUrl);
  const encodedFile = encodeURIComponent(modelUrl);
  const encodedTitle = encodeURIComponent(preview.productName);
  const fallbackUrl = encodeURIComponent(modelUrl);

  return `intent://arvr.google.com/scene-viewer/1.0?file=${encodedFile}&mode=3d_preferred&title=${encodedTitle}#Intent;scheme=https;package=${SCENE_VIEWER_PACKAGE};action=android.intent.action.VIEW;S.browser_fallback_url=${fallbackUrl};end;`;
};

const buildIosQuickLookUrl = (preview: ArPreviewResponse): string => {
  // Quick Look needs a publicly reachable https .usdz file.
  return preview.modelUrl;
};

type NativeArModule = {
  getArEnvironmentStatus?: () => Promise<{
    arCoreInstalled: boolean;
    arCoreVersion: string;
    googleAppInstalled: boolean;
    googleAppVersion: string;
    googleAppUpdateRecommended: boolean;
  }>;
  launchArSession: (
    modelUrl: string,
    modelFormat: string,
    placementHint: string,
    suggestedScale: number,
    productTitle: string
  ) => Promise<void>;
};

const nativeArModule = NativeModules.TerraVisionAr as NativeArModule | undefined;

async function confirmAndroidArLaunch(): Promise<boolean> {
  const status = nativeArModule?.getArEnvironmentStatus
    ? await nativeArModule.getArEnvironmentStatus().catch(() => null)
    : null;

  const updateHint = status?.googleAppUpdateRecommended
    ? '\n\nGoogle uygulamanız eski bir sürümde (AR hatası bilinen aralık). Play Store\'dan Google uygulamasını güncelleyin.'
    : '';

  return new Promise((resolve) => {
    Alert.alert(
      'Kamera ile AR',
      `Scene Viewer açılacak. Siyah veya koyu 3D ekranda modeli gördükten sonra alttaki "Ortamınızda görüntüleyin" düğmesine dokunun ve kamera iznini verin.${updateHint}`,
      [
        { text: 'İptal', style: 'cancel', onPress: () => resolve(false) },
        ...(status?.googleAppUpdateRecommended
          ? [
              {
                text: 'Google uygulamasını güncelle',
                onPress: () => {
                  Linking.openURL(GOOGLE_APP_PLAY_STORE).catch(() => undefined);
                  resolve(false);
                }
              }
            ]
          : []),
        { text: 'Devam', onPress: () => resolve(true) }
      ]
    );
  });
}

export async function launchNativeAr(preview: ArPreviewResponse): Promise<void> {
  const modelUrl = resolveArModelUrl(preview.modelUrl);
  if (!canLaunchModelUrl(modelUrl)) {
    throw new Error(
      'AR model adresi geçersiz. Geliştirmede API\'nin çalıştığından ve üründe AR modeli yüklü olduğundan emin olun.'
    );
  }

  if (Platform.OS === 'android') {
    const confirmed = await confirmAndroidArLaunch();
    if (!confirmed) {
      return;
    }

    if (nativeArModule?.launchArSession) {
      await nativeArModule.launchArSession(
        modelUrl,
        preview.modelFormat,
        preview.placementHint,
        preview.suggestedScale,
        preview.productName
      );
      return;
    }

    const sceneViewerUrl = buildAndroidSceneViewerUrl({ ...preview, modelUrl });
    const canOpen = await Linking.canOpenURL(sceneViewerUrl);
    if (!canOpen) {
      throw new Error(
        'Google Scene Viewer açılamadı. Google uygulaması ve Google Play Hizmetleri for AR (ARCore) yüklü olmalı.'
      );
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
        modelUrl,
        preview.modelFormat,
        preview.placementHint,
        preview.suggestedScale,
        preview.productName
      );
      return;
    }

    const quickLookUrl = buildIosQuickLookUrl({ ...preview, modelUrl });
    const canOpen = await Linking.canOpenURL(quickLookUrl);
    if (!canOpen) {
      throw new Error('Quick Look could not be opened. Ensure the model URL is reachable over HTTPS.');
    }

    await Linking.openURL(quickLookUrl);
    return;
  }

  throw new Error(`Native AR is not supported on ${Platform.OS}.`);
}
