import { Moon, Sun } from 'lucide-react';
import type { Theme } from '../hooks/useTheme';
import { useI18n } from '../i18n';

const options = [
  { id: 'day', Icon: Sun },
  { id: 'night', Icon: Moon },
] as const;

interface Props {
  theme: Theme;
  onChange: (t: Theme, origin: { x: number; y: number }) => void;
}

export function ThemeSwitch({ theme, onChange }: Props) {
  const { t } = useI18n();
  return (
    <div className="theme-switch" role="radiogroup" aria-label={t('theme.aria')} data-value={theme}>
      <i className="theme-thumb" aria-hidden />
      {options.map(({ id, Icon }) => (
        <button
          key={id}
          role="radio"
          aria-checked={theme === id}
          className={theme === id ? 'active' : ''}
          title={t(`theme.${id}Title`)}
          onClick={(e) => {
            if (theme === id) return;
            const r = e.currentTarget.getBoundingClientRect();
            onChange(id, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
          }}
        >
          <Icon size={15} strokeWidth={1.8} />
          <span>{t(`theme.${id}`)}</span>
        </button>
      ))}
    </div>
  );
}
