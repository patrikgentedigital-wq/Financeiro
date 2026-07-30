import React from 'react';
import { ToastNotification } from '../types';

interface ToastContainerProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-animate pointer-events-auto p-4 rounded-2xl shadow-xl border flex items-center justify-between gap-3 backdrop-blur-md text-xs font-semibold ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200 shadow-emerald-900/30'
              : toast.type === 'danger'
              ? 'bg-rose-950/90 border-rose-500/40 text-rose-200 shadow-rose-900/30'
              : 'bg-purple-950/90 border-purple-500/40 text-purple-200 shadow-purple-900/30'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-lg shrink-0">
              {toast.type === 'success'
                ? 'check_circle'
                : toast.type === 'danger'
                ? 'delete'
                : 'info'}
            </span>
            <span>{toast.message}</span>
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            aria-label="Fechar notificação"
            className="p-1 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors text-gray-300 hover:text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b]"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      ))}
    </div>
  );
};
