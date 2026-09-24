import type { Theme } from '../hooks/useTheme';
import type { BackendStatus } from '../hooks/useBackendStatus';
import { useI18n } from '../i18n';
import { Logo } from './Sidebar';
import { ThemeSwitch } from './ThemeSwitch';
import { LanguageSwitch } from './LanguageSwitch';
import { BackendPill } from './BackendStatus';

interface Props {
  title: string;
  subtitle: string;
  backend: BackendStatus;
  theme: Theme;
  onTheme: (t: Theme, origin: { x: number; y: number }) => void;
}

export function Header({ title, subtitle, backend, theme, onTheme }: Props) {
  const { locale } = useI18n();
  const today = new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <header className="topbar">
      <div className="topbar-mobile-logo"><Logo /></div>
      <div className="topbar-title">
        <span className="eyebrow">{today}</span>
        <h1>{title}<span className="h1-dot">.</span></h1>
        <p>{subtitle}</p>
      </div>
      <div className="topbar-actions">
        <BackendPill status={backend} />
        <LanguageSwitch />
        <ThemeSwitch theme={theme} onChange={onTheme} />
      </div>
    </header>
  );
}
