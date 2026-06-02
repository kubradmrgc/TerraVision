'use client';

import { useCallback, useEffect, useState } from 'react';
import { USER_ROLE } from '@terravision/shared';
import { AUTH_CHANGED_EVENT } from '@/constants/authEvents';
import { authService } from '@/services/authService';
import { tokenStore } from '@/services/tokenStore';

export type AuthSession = {
  ready: boolean;
  isAuthenticated: boolean;
  role: number | null;
  isCustomer: boolean;
  isAdmin: boolean;
  isConsultant: boolean;
};

export function useAuthSession(): AuthSession {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<number | null>(null);

  const sync = useCallback(() => {
    setToken(tokenStore.getToken());
    setRole(authService.getRole());
    setReady(true);
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener(AUTH_CHANGED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [sync]);

  return {
    ready,
    isAuthenticated: Boolean(token),
    role,
    isCustomer: role === USER_ROLE.Customer,
    isAdmin: role === USER_ROLE.Admin,
    isConsultant: role === USER_ROLE.Consultant
  };
}
