import { CheckCircle2, AlertTriangle } from 'lucide-react';

export interface Toast {
  id: string;
  text: string;
  tone: 'ok' | 'err';
}

export function Toasts({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.tone}`}>
          {t.tone === 'ok' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {t.text}
        </div>
      ))}
    </div>
  );
}
