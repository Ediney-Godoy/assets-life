import React from 'react';
import { useTranslation } from 'react-i18next';
import ThemeToggle from './ThemeToggle';
import {
  Building2,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Globe
} from 'lucide-react';
import clsx from 'clsx';

export default function Header({
  backendStatus,
  language,
  onLanguageChange,
  onLogout,
  onChangeCompany,
  onToggleSidebar,
  collapsed
}) {
  const { t } = useTranslation();
  const [user, setUser] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem('assetlife_user') || 'null');
    } catch {
      return null;
    }
  });

  React.useEffect(() => {
    const handler = () => {
      try {
        setUser(JSON.parse(localStorage.getItem('assetlife_user') || 'null'));
      } catch {
        setUser(null);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 lg:px-6 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md">
      {/* Left section */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title={t('toggle_sidebar') || 'Toggle sidebar'}
            aria-label={t('toggle_sidebar') || 'Toggle sidebar'}
          >
            {collapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>
        )}
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 hidden sm:block">
          {t('app_title')}
        </h1>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Language selector */}
        <div className="relative">
          <Globe size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          <select
            className="appearance-none pl-8 pr-7 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
          >
            <option value="en">{t('lang_en')}</option>
            <option value="pt">{t('lang_pt')}</option>
            <option value="es">{t('lang_es')}</option>
          </select>
        </div>

        {user && (
          <>
            {/* User info */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800">
              <div className="h-6 w-6 rounded-full bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center">
                <span className="text-xs font-medium text-brand-600 dark:text-brand-400">
                  {user.nome?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200 max-w-[120px] lg:max-w-[180px] truncate">
                {user.nome}
              </span>
            </div>

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Change company */}
            {onChangeCompany && (
              <button
                type="button"
                onClick={onChangeCompany}
                className="p-2 rounded-lg text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                title={t('change_company') || 'Change company'}
                aria-label={t('change_company') || 'Change company'}
              >
                <Building2 size={18} />
              </button>
            )}

            {/* Backend status */}
            <div
              className={clsx(
                'p-2 rounded-lg',
                backendStatus === 'ok' && 'text-success-600',
                backendStatus === 'checking' && 'text-warning-500',
                backendStatus === 'error' && 'text-danger-500'
              )}
              title={
                backendStatus === 'ok'
                  ? t('backend_ok') || 'Online'
                  : backendStatus === 'checking'
                  ? t('backend_checking') || 'Checking...'
                  : t('backend_error') || 'Offline'
              }
            >
              {backendStatus === 'ok' && <CheckCircle2 size={18} />}
              {backendStatus === 'checking' && <Loader2 size={18} className="animate-spin" />}
              {backendStatus === 'error' && <AlertCircle size={18} />}
            </div>

            {/* Logout */}
            <button
              type="button"
              onClick={onLogout}
              className="p-2 rounded-lg text-neutral-500 hover:text-danger-600 dark:text-neutral-400 dark:hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/10 transition-colors"
              title={t('logout') || 'Logout'}
              aria-label={t('logout') || 'Logout'}
            >
              <LogOut size={18} />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
