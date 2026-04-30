/** TerraVision.Api varsayılanı: launch profile `http` → http://localhost:5090 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5090';
export const SIGNALR_HUB_URL = `${API_BASE_URL}/hubs/terravision`;
