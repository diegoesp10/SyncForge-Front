import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader } from './Loader';

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  onClick: () => Promise<unknown> | void;
  icon?: ReactNode;
  busyLabel?: string;
  /** Duración mínima del estado de carga, para que el loader se vea aunque la respuesta sea inmediata */
  minMs?: number;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Botón que espera a su acción asíncrona mostrando el loader y bloqueando dobles clics. */
export function AsyncButton({ onClick, icon, busyLabel, minMs = 500, children, className = '', disabled, ...rest }: Props) {
  const [busy, setBusy] = useState(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await Promise.all([onClick(), wait(minMs)]);
    } catch {
      /* quien llama muestra el error */
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  return (
    <button
      {...rest}
      className={`${className} ${busy ? 'is-busy' : ''}`}
      disabled={disabled || busy}
      aria-busy={busy}
      onClick={run}
    >
      {busy ? <Loader size="sm" /> : icon}
      {children != null && <span>{busy && busyLabel ? busyLabel : children}</span>}
    </button>
  );
}
