import React from 'react';
import { useTranslation } from 'react-i18next';
import ThemeToggle from './ThemeToggle';
import { Building2, LogOut, PanelLeftClose, PanelLeft, CheckCircle2, AlertCircle, Loader2, Globe } from 'lucide-react';

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

  return (
    <header className="header flex items-center justify-between px-4 md:px-6 h-14">
      {/* Left side */}
      <div className="flex items-center gap-2">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="btn btn-ghost p-2"
            title={t('toggle_sidebar') || 'Alternar menu'}
            aria-label={t('toggle_sidebar') || 'Alternar menu'}
          >
            {collapsed ? (
              <PanelLeft size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>
        )}
        <h1 className="text-lg font-semibold hidden sm:block" style={{ color: 'var(--text-primary)' }}>
          {t('app_title')}
        </h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1">
        {/* Language selector */}
        <div className="relative">
          <Globe size={14} className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none z-10" style={{ color: 'var(--text-muted)' }} />
          <select
            className="select h-8 pl-7 pr-8 text-xs bg-transparent border-none hover:bg-[var(--bg-hover)] cursor-pointer"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            style={{ backgroundPosition: 'right 0.25rem center' }}
          >
            <option value="en">EN</option>
            <option value="pt">PT</option>
            <option value="es">ES</option>
          </select>
        </div>

        {user && (
          <>
            {/* User name */}
            <div
              className="hidden md:flex items-center px-3 py-1.5 rounded-md text-sm max-w-[180px]"
              title={`${user.nome} • ${user.email || ''}`}
              style={{ color: 'var(--text-secondary)' }}
            >
              <span className="truncate">{user.nome}</span>
            </div>

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Change company */}
            {onChangeCompany && (
              <button
                type="button"
                onClick={onChangeCompany}
                className="btn btn-ghost p-2"
                title={t('change_company') || 'Trocar de Empresa'}
                aria-label={t('change_company') || 'Trocar de Empresa'}
              >
                <Building2 size={18} />
              </button>
            )}

            {/* Backend status */}
            <div
              className="p-2 rounded-md"
              title={
                backendStatus === 'ok' ? (t('backend_ok') || 'Online')
                : backendStatus === 'checking' ? (t('backend_checking') || 'Verificando...')
                : (t('backend_error') || 'Offline')
              }
            >
              {backendStatus === 'ok' && (
                <CheckCircle2 size={18} style={{ color: 'var(--accent-primary)' }} />
              )}
              {backendStatus === 'checking' && (
                <Loader2 size={18} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
              )}
              {backendStatus === 'error' && (
                <AlertCircle size={18} className="text-red-500" />
              )}
            </div>

            {/* Logout */}
            <button
              type="button"
              onClick={onLogout}
              className="btn btn-ghost p-2"
              title={t('logout') || 'Sair'}
              aria-label={t('logout') || 'Sair'}
            >
              <LogOut size={18} />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
