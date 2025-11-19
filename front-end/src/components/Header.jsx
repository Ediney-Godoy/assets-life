import React from 'react';
import { useTranslation } from 'react-i18next';
import ThemeToggle from './ThemeToggle';
import { Building2, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Header({ backendStatus, language, onLanguageChange, onLogout, onChangeCompany, onToggleSidebar, collapsed }) {
  const { t } = useTranslation();
  const [user, setUser] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('assetlife_user') || 'null'); } catch { return null; }
  });

  React.useEffect(() => {
    const handler = () => {
      try { setUser(JSON.parse(localStorage.getItem('assetlife_user') || 'null')); } catch { setUser(null); }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);
  const colorMap = {
    ok: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
    checking: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
    error: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
  };

  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            title={t('toggle_sidebar') || 'Alternar menu'}
            aria-label={t('toggle_sidebar') || 'Alternar menu'}
          >
            {collapsed ? (
              <ChevronRight size={18} className="text-slate-700 dark:text-slate-200" />
            ) : (
              <ChevronLeft size={18} className="text-slate-700 dark:text-slate-200" />
            )}
          </button>
        )}
        <span className="text-xl font-semibold text-slate-900 dark:text-slate-100">{t('app_title')}</span>
        <span className={`status-chip ${colorMap[backendStatus]}`}>{t('backend_status')}: {backendStatus === 'ok' ? t('backend_ok') : backendStatus === 'checking' ? t('backend_checking') : t('backend_error')}</span>
      </div>
      <div className="flex items-center gap-3">
        <label className="text-sm text-slate-600 dark:text-slate-300">{t('language')}</label>
        <select
          className="px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
        >
          <option value="en">{t('lang_en')}</option>
          <option value="pt">{t('lang_pt')}</option>
          <option value="es">{t('lang_es')}</option>
        </select>
        {user && (
          <div className="flex items-center gap-2 ml-3">
            <div className="hidden sm:block text-sm text-slate-700 dark:text-slate-300 max-w-[220px] truncate" title={`${user.nome} • ${user.email || ''}`}>
              {user.nome}
            </div>
            <ThemeToggle />
            {onChangeCompany && (
              <button
                type="button"
                onClick={onChangeCompany}
                className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                title={t('change_company') || 'Trocar de Empresa'}
                aria-label={t('change_company') || 'Trocar de Empresa'}
              >
                <Building2 size={18} className="text-slate-700 dark:text-slate-200" />
              </button>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
              title={t('logout') || 'Sair'}
              aria-label={t('logout') || 'Sair'}
            >
              <LogOut size={18} className="text-slate-700 dark:text-slate-200" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}