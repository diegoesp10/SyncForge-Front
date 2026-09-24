import type { Theme } from '../hooks/useTheme';
import { Logo } from './Sidebar';
import { ThemeSwitch } from './ThemeSwitch';

interface Props {
  title: string;
  subtitle: string;
  online: boolean | null;
  mock: boolean;
  theme: Theme;
  onTheme: (t: Theme, origin: { x: number; y: number }) => void;
}

const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

export function Header({ title, subtitle, online, mock, theme, onTheme }: Props) {
  const label = mock ? 'Modo demo' : online === null ? 'Conectando…' : online ? 'Backend conectado' : 'Backend sin conexión';
  const tone = mock ? 'demo' : online === null ? 'wait' : online ? 'ok' : 'err';
  return (
    <header className="topbar">
      <div className="topbar-mobile-logo"><Logo /></div>
      <div className="topbar-title">
        <span className="eyebrow">{today}</span>
        <h1>{title}<span className="h1-dot">.</span></h1>
        <p>{subtitle}</p>
      </div>
      <div className="topbar-actions">
        <span className={`conn conn-${tone}`} title={label}>
          <i />
          <span className="conn-label">{label}</span>
        </span>
        <ThemeSwitch theme={theme} onChange={onTheme} />
      </div>
    </header>
  );
}
