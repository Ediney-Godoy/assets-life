import React from 'react';
import { useTranslation } from 'react-i18next';
import ThemeToggle from './ThemeToggle';
import { Bell, LogOut, PanelLeftClose, PanelLeft, CheckCircle2, AlertCircle, Loader2, Globe, Check, ChevronDown } from 'lucide-react';

export default function Header({ backendStatus, language, onLanguageChange, onLogout, onChangeCompany, onToggleSidebar, collapsed }) {
  const { t } = useTranslation();
  const [user, setUser] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('assetlife_user') || 'null'); } catch { return null; }
  });
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [langOpen, setLangOpen] = React.useState(false);

  const initials = React.useMemo(() => {
    const name = String(user?.nome || '').trim();
    if (!name) return '';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${(parts[0][0] || '').toUpperCase()}${(parts[parts.length - 1][0] || '').toUpperCase()}`;
  }, [user]);

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
        {/* Language selector (custom dropdown with SVG flags) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setLangOpen((prev) => !prev)}
            className="btn btn-ghost h-8 px-2 flex items-center gap-2"
            aria-haspopup="menu"
            aria-expanded={langOpen ? 'true' : 'false'}
            title={t('change_language') || 'Idioma'}
          >
            <Globe size={14} style={{ color: 'var(--text-muted)' }} />
            <span aria-hidden>{language === 'pt' ? (
              <svg width="18" height="12" viewBox="0 0 18 12">
                <rect width="18" height="12" fill="#009B3A"/>
                <polygon points="9,2 15,6 9,10 3,6" fill="#FFDF00"/>
                <circle cx="9" cy="6" r="3" fill="#002776"/>
                <rect x="6.7" y="5.2" width="4.6" height="1" transform="rotate(-20 9 6)" fill="#FFFFFF"/>
              </svg>
            ) : language === 'en' ? (
              <svg width="18" height="12" viewBox="0 0 18 12"><rect width="18" height="12" fill="#012169"/><path d="M0 0l7 4.5L0 9V12l9-6 9 6V9L11 4.5 18 0h-3L9 3 3 0H0Z" fill="#FFF"/><path d="M0 0l7 4.5L0 9V10.2L8.1 6 0 1.8V0Zm18 0v1.8L9.9 6 18 10.2V9l-7-4.5L18 0Z" fill="#C8102E"/><path d="M7 0v12h4V0H7Z" fill="#FFF"/><path d="M8 0v12h2V0H8Zm-8 5h18v2H0V5Z" fill="#C8102E"/></svg>
            ) : (
              <svg width="18" height="12" viewBox="0 0 18 12"><rect width="18" height="12" fill="#AA151B"/><rect width="18" height="4" y="4" fill="#F1BF00"/></svg>
            )}</span>
            <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
          </button>
          {langOpen && (
            <div className="absolute right-0 mt-1 w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-md z-20">
              <button type="button" className="w-full px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center" onClick={() => { onLanguageChange('en'); setLangOpen(false); }} aria-label="English">
                <svg width="20" height="13" viewBox="0 0 18 12"><rect width="18" height="12" fill="#012169"/><path d="M0 0l7 4.5L0 9V12l9-6 9 6V9L11 4.5 18 0h-3L9 3 3 0H0Z" fill="#FFF"/><path d="M0 0l7 4.5L0 9V10.2L8.1 6 0 1.8V0Zm18 0v1.8L9.9 6 18 10.2V9l-7-4.5L18 0Z" fill="#C8102E"/><path d="M7 0v12h4V0H7Z" fill="#FFF"/><path d="M8 0v12h2V0H8Zm-8 5h18v2H0V5Z" fill="#C8102E"/></svg>
              </button>
              <button type="button" className="w-full px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center" onClick={() => { onLanguageChange('pt'); setLangOpen(false); }} aria-label="Português">
                <svg width="20" height="13" viewBox="0 0 18 12">
                  <rect width="18" height="12" fill="#009B3A"/>
                  <polygon points="9,2 15,6 9,10 3,6" fill="#FFDF00"/>
                  <circle cx="9" cy="6" r="3" fill="#002776"/>
                  <rect x="6.7" y="5.2" width="4.6" height="1" transform="rotate(-20 9 6)" fill="#FFFFFF"/>
                </svg>
              </button>
              <button type="button" className="w-full px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center" onClick={() => { onLanguageChange('es'); setLangOpen(false); }} aria-label="Español">
                <svg width="20" height="13" viewBox="0 0 18 12"><rect width="18" height="12" fill="#AA151B"/><rect width="18" height="4" y="4" fill="#F1BF00"/></svg>
              </button>
            </div>
          )}
        </div>

        {user && (
          <>
            {/* User identity */}
            <div
              className="hidden md:flex items-center gap-2 px-2 py-1.5 rounded-md"
              title={`${user.nome} • ${user.email || ''}`}
            >
              <div className="relative h-8 w-8 rounded-full bg-blue-100 text-blue-700 dark:bg-slate-800 dark:text-slate-200 flex items-center justify-center font-semibold select-none">
                {initials}
                <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                  <Check size={10} className="text-white" />
                </span>
              </div>
              <div className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[220px]">
                {user.nome}
              </div>
            </div>

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Notifications icon (replaces change company) */}
            <button
              type="button"
              className="btn btn-ghost p-2"
              title={t('notifications') || 'Notificações'}
              aria-label={t('notifications') || 'Notificações'}
            >
              <Bell size={18} />
            </button>

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
