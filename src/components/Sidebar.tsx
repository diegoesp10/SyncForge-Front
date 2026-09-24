import { LayoutDashboard, FolderOpen, Trash2, PlugZap } from 'lucide-react';
import { useI18n } from '../i18n';
import { Composition } from './Composition';

export type View = 'dashboard' | 'files' | 'trash' | 'connection';

const items: { id: View; Icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', Icon: LayoutDashboard },
  { id: 'files', Icon: FolderOpen },
  { id: 'trash', Icon: Trash2 },
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

interface Props {
  view: View;
  onChange: (v: View) => void;
  /** Archivos en la papelera: se muestra como contador junto a su entrada */
  trashCount?: number;
}

export function Sidebar({ view, onChange, trashCount = 0 }: Props) {
  const { t } = useI18n();
  return (
    <nav className="sidebar" aria-label={t('nav.aria')}>
      <Logo />
      <ul>
        {items.map(({ id, Icon }, i) => {
          const count = id === 'trash' ? trashCount : 0;
          return (
            <li key={id}>
              <button
                className={view === id ? 'active' : ''}
                aria-current={view === id ? 'page' : undefined}
                title={count ? `${t(`nav.${id}`)} · ${t('nav.trashCount', { count })}` : t(`nav.${id}`)}
                onClick={() => onChange(id)}
              >
                <span className="nav-icon">
                  <Icon size={18} strokeWidth={1.6} />
                  {count > 0 && <span className="nav-count" aria-label={t('nav.trashCount', { count })}>{count > 99 ? '99+' : count}</span>}
                </span>
                <span className="nav-label">{t(`nav.${id}`)}</span>
                <span className="nav-num">0{i + 1}</span>
              </button>
            </li>
          );
        })}
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
