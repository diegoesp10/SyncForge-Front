import { CheckCircle2, AlertTriangle } from 'lucide-react';

export interface Toast {
  id: string;
  text: string;
  tone: 'ok' | 'err';
  /** Acción opcional junto al mensaje, p. ej. "Deshacer" al mover a la papelera */
  action?: { label: string; onClick: () => void };
}

export function Toasts({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.tone}`}>
          {toast.tone === 'ok' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{toast.text}</span>
          {toast.action && (
            <button
              className="toast-action"
              onClick={() => {
                toast.action!.onClick();
                onDismiss(toast.id);
              }}
            >
              {toast.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
