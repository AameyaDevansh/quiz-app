'use client';

import { useCallback, useState } from 'react';

export interface ToastItem {
  id: number;
  message: string;
  variant: 'error' | 'info';
}

const AUTO_DISMISS_MS = 4000;

export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, variant: ToastItem['variant'] = 'error') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, variant }]);
    setTimeout(() => {
      setToasts((t) => t.filter((toast) => toast.id !== id));
    }, AUTO_DISMISS_MS);
  }, []);

  return { toasts, showToast };
}

export function ToastStack({ toasts }: { toasts: ToastItem[] }) {
  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', top: '1.25rem', left: '50%', transform: 'translateX(-50%)',
      zIndex: 200, display: 'flex', flexDirection: 'column', gap: '0.5rem',
      alignItems: 'center', pointerEvents: 'none',
    }}>
      {toasts.map((t) => (
        <div key={t.id} className="animate-pop-in" style={{
          pointerEvents: 'auto',
          padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-sm)',
          background: t.variant === 'error' ? 'var(--red-dim)' : 'var(--surface-2)',
          border: '1px solid',
          borderColor: t.variant === 'error' ? 'var(--red)' : 'var(--border-bright)',
          color: '#fff', fontWeight: 600, fontSize: '0.9rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
          maxWidth: 360, textAlign: 'center',
        }}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
