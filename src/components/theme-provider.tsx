'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/components/providers';

/**
 * Applies the theme class to <html> based on the UI store setting.
 * - 'light': removes .dark
 * - 'dark': adds .dark
 * - 'system': follows prefers-color-scheme media query
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUIStore((s) => s.settings.theme);

  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System preference
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const apply = () => {
        if (mq.matches) root.classList.add('dark');
        else root.classList.remove('dark');
      };
      apply();
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
  }, [theme]);

  return <>{children}</>;
}
