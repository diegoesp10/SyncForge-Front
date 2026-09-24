import { Moon, Sun } from 'lucide-react';
import type { Theme } from '../hooks/useTheme';

const options = [
  { id: 'day', label: 'Día', Icon: Sun },
  { id: 'night', label: 'Noche', Icon: Moon },
] as const;

interface Props {
  theme: Theme;
  onChange: (t: Theme, origin: { x: number; y: number }) => void;
}

export function ThemeSwitch({ theme, onChange }: Props) {
  return (
    <div className="theme-switch" role="radiogroup" aria-label="Modo de color" data-value={theme}>
      <i className="theme-thumb" aria-hidden />
      {options.map(({ id, label, Icon }) => (
        <button
          key={id}
          role="radio"
          aria-checked={theme === id}
          className={theme === id ? 'active' : ''}
          title={`Modo ${label.toLowerCase()}`}
          onClick={(e) => {
            if (theme === id) return;
            const r = e.currentTarget.getBoundingClientRect();
            onChange(id, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
          }}
        >
          <Icon size={15} strokeWidth={1.8} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
