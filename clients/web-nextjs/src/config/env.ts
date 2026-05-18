import { buildApiBaseUrl, buildSignalRHubUrl } from '@terravision/shared';

/** TerraVision.Api default: launch profile `http` → http://localhost:5090 */
const configured = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5090';

export const API_BASE_URL = buildApiBaseUrl(configured);
export const SIGNALR_HUB_URL = buildSignalRHubUrl(API_BASE_URL);
