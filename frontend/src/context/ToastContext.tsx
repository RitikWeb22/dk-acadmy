import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import styles from './Toast.module.scss';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const recentToastsRef = useRef<Map<string, number>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    if (!message || typeof message !== 'string') return;
    const trimmed = message.trim();
    if (!trimmed) return;

    // Suppress deletion broadcast popups platform-wide (administrative events should not flood toast popups)
    if (
      trimmed.includes('permanently removed by Academic Administration') ||
      trimmed.includes('Academic Administration') ||
      trimmed.includes('was permanently deleted') ||
      trimmed.includes('was removed from the system')
    ) {
      return;
    }

    const now = Date.now();

    // Throttle deletion toasts to at most 1 every 3 seconds
    if (trimmed.toLowerCase().includes('deleted')) {
      const lastDelete = recentToastsRef.current.get('global_last_delete') || 0;
      if (now - lastDelete < 3000) {
        return;
      }
      recentToastsRef.current.set('global_last_delete', now);
    }

    // Deduplicate: ignore identical messages within 4 seconds
    const normalizedKey = `${type}_${trimmed.toLowerCase().replace(/\s+/g, ' ').slice(0, 120)}`;
    const lastSeen = recentToastsRef.current.get(normalizedKey) || 0;
    if (now - lastSeen < 4000) {
      return;
    }
    recentToastsRef.current.set(normalizedKey, now);

    // Housekeeping: clean up old timestamps
    if (recentToastsRef.current.size > 50) {
      for (const [k, v] of recentToastsRef.current.entries()) {
        if (now - v > 15000) recentToastsRef.current.delete(k);
      }
    }

    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Strictly keep at most 1 toast on screen to completely prevent toast spam and stacking
    setToasts([{ id, message: trimmed, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  // Global listener for live real-time notifications
  useEffect(() => {
    const handleLiveToast = (e: any) => {
      const { title, message, type = 'info' } = e.detail || {};
      if (title || message) {
        const full = title && message ? `${title}\n${message}` : (message || title);
        showToast(full, type);
      }
    };

    window.addEventListener('dk_live_toast', handleLiveToast);
    return () => window.removeEventListener('dk_live_toast', handleLiveToast);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div className={styles.toastContainer} aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${styles.toastItem} ${styles[toast.type] || styles.info}`}
            role="alert"
          >
            <div className={styles.toastIcon}>
              {toast.type === 'success' && <CheckCircle2 size={18} />}
              {toast.type === 'error' && <AlertCircle size={18} />}
              {toast.type === 'warning' && <AlertTriangle size={18} />}
              {toast.type === 'info' && <Info size={18} />}
            </div>
            <div className={styles.toastMessage}>{toast.message}</div>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss toast notification"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    // Graceful fallback if invoked outside provider
    return {
      showToast: (msg: string) => console.log('[Toast]:', msg),
      removeToast: () => {}
    };
  }
  return context;
};
