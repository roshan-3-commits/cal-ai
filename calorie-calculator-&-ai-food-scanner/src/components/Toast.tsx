import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, Copy, Sparkles, AlertCircle, Info, X, Utensils } from 'lucide-react';
import { ThemeMode } from '../types';

export type ToastType = 'success' | 'copy' | 'meal' | 'info' | 'error';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  toastSuccess: (title: string, description?: string) => void;
  toastCopy: (title?: string, description?: string) => void;
  toastMeal: (mealName: string, calories?: number) => void;
  toastInfo: (title: string, description?: string) => void;
  toastError: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
  theme?: ThemeMode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children, theme = 'dark' }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const isDark = theme === 'dark';

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, description, type = 'success', duration = 3000 }: Omit<ToastMessage, 'id'>) => {
      const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
      const newToast: ToastMessage = { id, title, description, type, duration };

      setToasts((prev) => [newToast, ...prev.slice(0, 3)]); // Keep max 4 toasts at once

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const toastSuccess = useCallback(
    (title: string, description?: string) => {
      showToast({ title, description, type: 'success' });
    },
    [showToast]
  );

  const toastCopy = useCallback(
    (title = 'URL Copied to Clipboard', description = 'Shareable link with your calorie results is ready to paste.') => {
      showToast({ title, description, type: 'copy' });
    },
    [showToast]
  );

  const toastMeal = useCallback(
    (mealName: string, calories?: number) => {
      const desc = calories ? `${calories} kcal logged to your Daily Tracker` : 'Added to Daily Tracker';
      showToast({
        title: `Logged: ${mealName}`,
        description: desc,
        type: 'meal',
        duration: 3500,
      });
    },
    [showToast]
  );

  const toastInfo = useCallback(
    (title: string, description?: string) => {
      showToast({ title, description, type: 'info' });
    },
    [showToast]
  );

  const toastError = useCallback(
    (title: string, description?: string) => {
      showToast({ title, description, type: 'error', duration: 4000 });
    },
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{
        showToast,
        toastSuccess,
        toastCopy,
        toastMeal,
        toastInfo,
        toastError,
      }}
    >
      {children}

      {/* Floating Bottom-Right Toast Stack */}
      <div
        aria-live="assertive"
        className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0"
      >
        {toasts.map((toast) => {
          const getIcon = () => {
            switch (toast.type) {
              case 'copy':
                return <Copy className="w-4 h-4 text-blue-400" />;
              case 'meal':
                return <Utensils className="w-4 h-4 text-emerald-400" />;
              case 'error':
                return <AlertCircle className="w-4 h-4 text-rose-400" />;
              case 'info':
                return <Info className="w-4 h-4 text-indigo-400" />;
              case 'success':
              default:
                return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
            }
          }

          const getBadgeColor = () => {
            switch (toast.type) {
              case 'copy':
                return isDark ? 'bg-blue-500/15 border-blue-500/30' : 'bg-blue-50 border-blue-200';
              case 'meal':
                return isDark ? 'bg-emerald-500/15 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200';
              case 'error':
                return isDark ? 'bg-rose-500/15 border-rose-500/30' : 'bg-rose-50 border-rose-200';
              default:
                return isDark ? 'bg-white/10 border-white/15' : 'bg-slate-100 border-slate-200';
            }
          };

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto w-full p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 transform translate-y-0 opacity-100 shadow-2xl backdrop-blur-2xl flex items-start gap-3 animate-fadeIn select-none ${
                isDark
                  ? 'bg-[#0f131a]/95 border-white/[0.12] text-white shadow-black/70'
                  : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-300/80'
              }`}
            >
              {/* Icon Container */}
              <div
                className={`p-2 rounded-xl border flex items-center justify-center shrink-0 ${getBadgeColor()}`}
              >
                {getIcon()}
              </div>

              {/* Text info */}
              <div className="flex-1 min-w-0 pr-1">
                <p className="text-xs sm:text-sm font-bold tracking-tight line-clamp-1">
                  {toast.title}
                </p>
                {toast.description && (
                  <p
                    className={`text-[11px] sm:text-xs mt-0.5 leading-relaxed line-clamp-2 ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    {toast.description}
                  </p>
                )}
              </div>

              {/* Dismiss Button */}
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className={`p-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
                  isDark
                    ? 'text-slate-400 hover:text-white hover:bg-white/10'
                    : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                }`}
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
