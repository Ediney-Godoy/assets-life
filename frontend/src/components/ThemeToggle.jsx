import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../theme/ThemeProvider';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  const label = isDark ? 'Tema claro' : 'Tema escuro';
  return (
    <button
      onClick={toggle}
      className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
      aria-label={label}
      title={label}
      type="button"
    >
      {isDark ? (
        <Sun size={18} className="text-slate-700 dark:text-slate-200" />
      ) : (
        <Moon size={18} className="text-slate-700 dark:text-slate-200" />
      )}
    </button>
  );
}