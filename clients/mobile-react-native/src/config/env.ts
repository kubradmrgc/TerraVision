import { Platform } from 'react-native';
import { buildApiBaseUrl, buildSignalRHubUrl } from '@terravision/shared';

/**
 * API base URL for mobile.
 * - Android emulator: 10.0.2.2 → host machine
 * - iOS simulator: localhost
 * - Physical device: set TERRAVISION_API_URL to your PC LAN IP (e.g. http://192.168.1.5:5090)
 *
 * Override at build time via Metro/babel if you inject process.env.TERRAVISION_API_URL.
 */
declare const process: { env?: { TERRAVISION_API_URL?: string } };

function resolveConfiguredUrl(): string | undefined {
  const fromEnv = typeof process !== 'undefined' ? process.env?.TERRAVISION_API_URL : undefined;
  return fromEnv?.trim() || undefined;
}

function defaultHost(): string {
  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
}

const configured = resolveConfiguredUrl();
export const API_BASE_URL = configured ? buildApiBaseUrl(configured) : buildApiBaseUrl(defaultHost());
export const SIGNALR_HUB_URL = buildSignalRHubUrl(API_BASE_URL);
