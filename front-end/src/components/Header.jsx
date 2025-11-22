import React from 'react';
import { useTranslation } from 'react-i18next';
import ThemeToggle from './ThemeToggle';
import { Building2, LogOut, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Loader2, User, ChevronDown } from 'lucide-react';

export default function Header({ backendStatus, language, onLanguageChange, onLogout, onChangeCompany, onToggleSidebar, collapsed }) {
  const { t } = useTranslation();
  const [user, setUser] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('assetlife_user') || 'null'); } catch { return null; }
  });
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const handler = () => {
      try { setUser(JSON.parse(localStorage.getItem('assetlife_user') || 'null')); } catch { setUser(null); }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuOpen && !e.target.closest('.user-menu')) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [userMenuOpen]);

  const getStatusTooltip = () => {
    if (backendStatus === 'ok') return t('backend_ok') || 'Backend online';
    if (backendStatus === 'checking') return t('backend_checking') || 'Verificando conexão...';
    return t('backend_error') || 'Backend offline';
  };

  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
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
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        <div className="hidden md:flex items-center gap-2">
          <label className="text-sm text-slate-600 dark:text-slate-300">{t('language')}</label>
          <select
            className="px-2 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
          >
            <option value="en">{t('lang_en')}</option>
            <option value="pt">{t('lang_pt')}</option>
            <option value="es">{t('lang_es')}</option>
          </select>
        </div>
        {user && (
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {onChangeCompany && (
              <button
                type="button"
                onClick={onChangeCompany}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                title={t('change_company') || 'Trocar de Empresa'}
                aria-label={t('change_company') || 'Trocar de Empresa'}
              >
                <Building2 size={18} className="text-slate-700 dark:text-slate-200" />
              </button>
            )}
            <div className="relative user-menu">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-label="Menu do usuário"
                aria-expanded={userMenuOpen}
              >
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{user.nome}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px]">{user.email || ''}</span>
                </div>
                <div className="sm:hidden">
                  <User size={18} className="text-slate-700 dark:text-slate-200" />
                </div>
                <ChevronDown size={16} className={`text-slate-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-800 py-1 z-50">
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user.nome}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email || ''}</p>
                  </div>
                  {onChangeCompany && (
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onChangeCompany();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Building2 size={16} />
                      {t('change_company') || 'Trocar de Empresa'}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                  >
                    <LogOut size={16} />
                    {t('logout') || 'Sair'}
                  </button>
                </div>
              )}
            </div>
            <div
              className="p-2 rounded-lg"
              title={getStatusTooltip()}
              aria-label={t('backend_status') || 'Status do Backend'}
            >
              {backendStatus === 'ok' && <CheckCircle2 size={18} className="text-green-600 dark:text-green-400" />}
              {backendStatus === 'checking' && <Loader2 size={18} className="text-yellow-600 dark:text-yellow-400 animate-spin" />}
              {backendStatus === 'error' && <AlertCircle size={18} className="text-red-600 dark:text-red-400" />}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}