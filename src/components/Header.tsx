import type { Theme } from '../hooks/useTheme';
import type { BackendStatus } from '../hooks/useBackendStatus';
import { Logo } from './Sidebar';
import { ThemeSwitch } from './ThemeSwitch';
import { BackendPill } from './BackendStatus';

interface Props {
  title: string;
  subtitle: string;
  backend: BackendStatus;
  mock: boolean;
  theme: Theme;
  onTheme: (t: Theme, origin: { x: number; y: number }) => void;
}

const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

export function Header({ title, subtitle, backend, mock, theme, onTheme }: Props) {
  return (
    <header className="topbar">
      <div className="topbar-mobile-logo"><Logo /></div>
      <div className="topbar-title">
        <span className="eyebrow">{today}</span>
        <h1>{title}<span className="h1-dot">.</span></h1>
        <p>{subtitle}</p>
      </div>
      <div className="topbar-actions">
        <BackendPill status={backend} mock={mock} />
        <ThemeSwitch theme={theme} onChange={onTheme} />
      </div>
    </header>
  );
}
