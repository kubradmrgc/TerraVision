'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import { tokenStore } from '@/services/tokenStore';

export type AdminGuardStatus = 'loading' | 'ready' | 'denied';

export function useAdminGuard() {
  const router = useRouter();
  const [status, setStatus] = useState<AdminGuardStatus>('loading');
  const [deniedMessage, setDeniedMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = tokenStore.getToken();
    if (!token) {
      router.replace('/login/admin');
      return;
    }

    if (!authService.isAdmin()) {
      setDeniedMessage('Bu sayfa yalnızca yöneticiler içindir.');
      setStatus('denied');
      return;
    }

    setStatus('ready');
  }, [router]);

  return { status, deniedMessage };
}
