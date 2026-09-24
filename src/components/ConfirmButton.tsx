import { useEffect, useState, type ReactNode } from 'react';
import { AsyncButton } from './AsyncButton';

interface Props {
  onConfirm: () => Promise<unknown>;
  icon?: ReactNode;
  children?: ReactNode;
  /** Texto del segundo clic, el que ejecuta la acción */
  confirmLabel: string;
  busyLabel?: string;
  className?: string;
  title?: string;
  'aria-label'?: string;
}

const DISARM_MS = 4000;

/**
 * Botón para acciones irreversibles: el primer clic lo "arma" (cambia a rojo con confirmLabel)
 * y solo el segundo ejecuta la acción. Si no se confirma en 4 s, vuelve a su estado inicial.
 */
export function ConfirmButton({ onConfirm, icon, children, confirmLabel, busyLabel, className = '', ...rest }: Props) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = window.setTimeout(() => setArmed(false), DISARM_MS);
    return () => window.clearTimeout(timer);
  }, [armed]);

  if (!armed) {
    return (
      <button {...rest} className={className} onClick={() => setArmed(true)}>
        {icon}
        {children != null && <span>{children}</span>}
      </button>
    );
  }
  return (
    <AsyncButton {...rest} className={`${className} is-armed`} icon={icon} busyLabel={busyLabel} onClick={onConfirm} autoFocus>
      {confirmLabel}
    </AsyncButton>
  );
}
