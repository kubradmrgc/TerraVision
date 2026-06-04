import { Platform } from 'react-native';
import { buildApiBaseUrl, buildSignalRHubUrl } from '@terravision/shared';

export type ApiConnectMode = 'wifi' | 'usb' | 'emulator';

type LocalApiConfig = {
  API_URL_OVERRIDE?: string;
  API_CONNECT_MODE?: ApiConnectMode;
};

declare const process: { env?: { TERRAVISION_API_URL?: string } };

function loadLocalConfig(): LocalApiConfig {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('./api.config.local') as LocalApiConfig;
  } catch {
    return {};
  }
}

function resolveConfiguredUrl(): string | undefined {
  const fromProcess =
    typeof process !== 'undefined' ? process.env?.TERRAVISION_API_URL?.trim() : undefined;
  if (fromProcess) {
    return fromProcess;
  }
  const local = loadLocalConfig();
  const override = local.API_URL_OVERRIDE?.trim();
  if (override && local.API_CONNECT_MODE !== 'usb') {
    return override;
  }
  return undefined;
}

function defaultHost(): string {
  const local = loadLocalConfig();
  const mode = local.API_CONNECT_MODE ?? 'emulator';

  if (mode === 'usb') {
    return Platform.OS === 'android' ? '127.0.0.1' : 'localhost';
  }
  if (mode === 'wifi' && local.API_URL_OVERRIDE?.trim()) {
    return local.API_URL_OVERRIDE.trim();
  }
  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
}

const configured = resolveConfiguredUrl();
export const API_BASE_URL = configured ? buildApiBaseUrl(configured) : buildApiBaseUrl(defaultHost());
export const SIGNALR_HUB_URL = buildSignalRHubUrl(API_BASE_URL);

export function getApiConnectMode(): ApiConnectMode {
  return loadLocalConfig().API_CONNECT_MODE ?? 'emulator';
}
