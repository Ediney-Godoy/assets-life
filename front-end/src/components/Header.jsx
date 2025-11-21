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
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 lg:px-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      {/* Left section */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 hidden sm:block">
          {t('app_title')}
        </h1>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Language selector */}
        <div className="relative">
          <Globe size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            className="appearance-none pl-8 pr-7 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
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
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
              <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  {user.nome?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200 max-w-[120px] lg:max-w-[180px] truncate">
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
                className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
                backendStatus === 'ok' && 'text-green-600',
                backendStatus === 'checking' && 'text-amber-500',
                backendStatus === 'error' && 'text-red-500'
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
              className="p-2 rounded-lg text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
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
