import { tokenStore } from '../../services/tokenStore';

export async function hasStoredSession(): Promise<boolean> {
  const token = await tokenStore.getToken();
  return Boolean(token);
}
