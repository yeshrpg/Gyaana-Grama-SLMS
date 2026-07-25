import { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';

const ToastContext = createContext(null);
export { ToastContext };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message, duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = ({ message, type }) => addToast(type, message);

  const toastFns = {
    showToast,
    success: (message, duration) => addToast('success', message, duration),
    error: (message, duration) => addToast('error', message, duration),
    info: (message, duration) => addToast('info', message, duration),
    warning: (message, duration) => addToast('warning', message, duration),
  };

  const icons = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const bgColors = {
    success: 'bg-green-900/90 border-green-700 text-green-100',
    error: 'bg-red-900/90 border-red-700 text-red-100',
    warning: 'bg-amber-900/90 border-amber-700 text-amber-100',
    info: 'bg-blue-900/90 border-blue-700 text-blue-100',
  };

  const iconColors = {
    success: 'text-green-400',
    error: 'text-red-400',
    warning: 'text-amber-400',
    info: 'text-blue-400',
  };

  const toastElements = toasts.map(({ id, type, message }) => {
    const Icon = icons[type];
    return (
      <div
        key={id}
        className={`
          flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg shadow-black/30
          min-w-[280px] max-w-[360px] text-sm
          ${bgColors[type]}
          animate-[slideIn_200ms_ease-out]
        `}
        style={{ animation: 'slideIn 200ms ease-out' }}
      >
        <Icon className={`h-5 w-5 flex-shrink-0 ${iconColors[type]}`} />
        <span className="flex-1">{message}</span>
        <button
          onClick={() => removeToast(id)}
          className="opacity-60 hover:opacity-100 p-0.5 rounded flex-shrink-0 transition-opacity duration-150"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  });

  return (
    <ToastContext.Provider value={toastFns}>
      {children}
      {toasts.length > 0 && createPortal(
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2" role="region" aria-label="Notifications">
          {toastElements}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
