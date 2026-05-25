'use client';

import { useEffect, useState } from 'react';
import { authService } from '@/services/authService';
import { realtimeService } from '@/services/realtimeService';
import { tokenStore } from '@/services/tokenStore';

export function AdminInventoryAlertBanner() {
  const [alert, setAlert] = useState<string | null>(null);

  useEffect(() => {
    if (!authService.isAdmin() || !tokenStore.getToken()) {
      return;
    }

    void realtimeService.connect();
    const unsubscribe = realtimeService.onProductLowStock((event) => {
      setAlert(event.message);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (!alert) {
    return null;
  }

  return (
    <div
      className="tv-admin-inventory-alert"
      role="alert"
      style={{
        marginBottom: 16,
        padding: '12px 16px',
        borderRadius: 10,
        border: '1px solid #f59e0b',
        background: '#fffbeb',
        color: '#92400e',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12
      }}
    >
      <span>
        <strong>Akıllı Envanter:</strong> {alert}
      </span>
      <button
        type="button"
        onClick={() => setAlert(null)}
        aria-label="Uyarıyı kapat"
        style={{
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          color: 'inherit',
          fontSize: '1.1rem',
          lineHeight: 1
        }}
      >
        ×
      </button>
    </div>
  );
}
