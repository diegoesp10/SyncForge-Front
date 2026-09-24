import { useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

export type Theme = 'day' | 'night';

const KEY = 'sf-mode';
const metaColor: Record<Theme, string> = { day: '#f5f3ee', night: '#1d1c1a' };

function initial(): Theme {
  try {
    return localStorage.getItem(KEY) === 'night' ? 'night' : 'day';
  } catch {
    return 'day';
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(initial);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', metaColor[theme]);
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      /* noop */
    }
  }, [theme]);

  // Cambio de modo con un revelado circular desde el punto de origen (View Transitions API)
  const setTheme = useCallback((next: Theme, origin?: { x: number; y: number }) => {
    const apply = () => {
      document.documentElement.dataset.theme = next;
      flushSync(() => setThemeState(next));
    };
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!('startViewTransition' in document) || reduced) {
      apply();
      return;
    }
    const transition = document.startViewTransition(apply);
    const { x, y } = origin ?? { x: window.innerWidth, y: 0 };
    const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    transition.ready
      .then(() =>
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
          { duration: 650, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', pseudoElement: '::view-transition-new(root)' },
        ),
      )
      .catch(() => {
        /* transición cancelada: el tema ya está aplicado */
      });
  }, []);

  return { theme, setTheme };
}
