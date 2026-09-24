import { LayoutDashboard, FolderOpen, PlugZap } from 'lucide-react';
import { useI18n } from '../i18n';
import { Composition } from './Composition';

export type View = 'dashboard' | 'files' | 'connection';

const items: { id: View; Icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', Icon: LayoutDashboard },
  { id: 'files', Icon: FolderOpen },
  { id: 'connection', Icon: PlugZap },
];

export function Logo() {
  return (
    <div className="logo">
      <img src="/favicon.svg" alt="" width={30} height={30} />
      <span>Sync<em>Forge</em></span>
    </div>
  );
}

export function Sidebar({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const { t } = useI18n();
  return (
    <nav className="sidebar" aria-label={t('nav.aria')}>
      <Logo />
      <ul>
        {items.map(({ id, Icon }, i) => (
          <li key={id}>
            <button
              className={view === id ? 'active' : ''}
              aria-current={view === id ? 'page' : undefined}
              title={t(`nav.${id}`)}
              onClick={() => onChange(id)}
            >
              <Icon size={18} strokeWidth={1.6} />
              <span className="nav-label">{t(`nav.${id}`)}</span>
              <span className="nav-num">0{i + 1}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="sidebar-foot">
        <div className="sidebar-art">
          <Composition preset="sidebar" />
          <p>{t('nav.artLine1')}<br /><em>{t('nav.artLine2')}</em></p>
        </div>
        <span>{t('nav.version')}</span>
      </div>
    </nav>
  );
}
