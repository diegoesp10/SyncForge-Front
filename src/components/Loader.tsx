import { useI18n } from '../i18n';

// Loader con las tres formas de la marca (círculo, cuadrado y semicírculo) saltando en secuencia.
export function Loader({ size = 'md', label }: { size?: 'sm' | 'md' | 'lg'; label?: string }) {
  const { t } = useI18n();
  return (
    <span className={`loader loader-${size}`} role="status" aria-label={label ?? t('loader.default')}>
      <i />
      <i />
      <i />
    </span>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="loading-state">
      <Loader size="lg" label={label} />
      <p>{label}</p>
    </div>
  );
}
