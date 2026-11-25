import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  type: 'success' | 'error';
  message: string;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0 pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-theme border shadow-lg transition-colors ${
            toast.type === 'success'
              ? 'bg-t-surface border-t-accent/50 text-t-text'
              : 'bg-t-danger-bg border-t-danger-text/50 text-t-text'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-t-success-text shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-t-danger-text shrink-0 mt-0.5" />
          )}
          <p className="text-xs leading-relaxed flex-1 text-t-text">{toast.message}</p>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss notification"
            className="text-t-text-subtle hover:text-t-text cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
