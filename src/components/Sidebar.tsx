import { LayoutDashboard, FolderOpen, PlugZap } from 'lucide-react';
import { Composition } from './Composition';

export type View = 'dashboard' | 'files' | 'connection';

const items: { id: View; label: string; Icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Panel', Icon: LayoutDashboard },
  { id: 'files', label: 'Archivos', Icon: FolderOpen },
  { id: 'connection', label: 'Conexión', Icon: PlugZap },
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
  return (
    <nav className="sidebar" aria-label="Principal">
      <Logo />
      <ul>
        {items.map(({ id, label, Icon }, i) => (
          <li key={id}>
            <button
              className={view === id ? 'active' : ''}
              aria-current={view === id ? 'page' : undefined}
              title={label}
              onClick={() => onChange(id)}
            >
              <Icon size={18} strokeWidth={1.6} />
              <span className="nav-label">{label}</span>
              <span className="nav-num">0{i + 1}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="sidebar-foot">
        <div className="sidebar-art">
          <Composition preset="sidebar" />
          <p>Sube, procesa<br /><em>y revisa.</em></p>
        </div>
        <span>v0.1 · frontal</span>
      </div>
    </nav>
  );
}
