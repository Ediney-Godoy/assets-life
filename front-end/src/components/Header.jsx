import React from 'react';
import { useTranslation } from 'react-i18next';
import ThemeToggle from './ThemeToggle';
import { Bell, LogOut, PanelLeftClose, PanelLeft, Wifi, WifiOff, Loader2, Globe, Check, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getNotifications } from '../apiClient';

export default function Header({ backendStatus, language, onLanguageChange, onLogout, onChangeCompany, onToggleSidebar, collapsed }) {
  const { t } = useTranslation();
  const tt = (k, fb) => { const v = t(k); return v === k ? fb : v; };
  const navigate = useNavigate();
  const [user, setUser] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('assetlife_user') || 'null'); } catch { return null; }
  });
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [langOpen, setLangOpen] = React.useState(false);
  const [bellOpen, setBellOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState([]);
  const unreadCount = React.useMemo(() => notifications.filter((n) => String(n.status).toLowerCase() === 'pendente').length, [notifications]);

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

  React.useEffect(() => {
    if (!bellOpen) return;
    let active = true;
    (async () => {
      try {
        const list = await getNotifications({ status: 'pendente', limit: 50 });
        if (active) setNotifications(Array.isArray(list) ? list : []);
      } catch {
        try {
          const raw = localStorage.getItem('assetlife_notifications');
          const arr = raw ? JSON.parse(raw) : [];
          const pend = Array.isArray(arr) ? arr.filter((n) => !n.read && String(n.status || '').toLowerCase() !== 'arquivada') : [];
          setNotifications(pend);
        } catch { setNotifications([]); }
      }
    })();
    return () => { active = false; };
  }, [bellOpen]);

  return (
    <header className="header flex items-center justify-between px-4 md:px-6 h-14">
      {/* Left side */}
      <div className="flex items-center gap-2">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="btn btn-ghost p-2"
            title={tt('toggle_sidebar', 'Alternar menu')}
            aria-label={tt('toggle_sidebar', 'Alternar menu')}
          >
            {collapsed ? (
              <PanelLeft size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>
        )}
        <h1 className="text-lg font-semibold hidden sm:block" style={{ color: 'var(--text-primary)' }}>
          {tt('app_title', 'Assets Life')}
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
            title={tt('change_language', 'Idioma')}
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
              <svg width="18" height="12" viewBox="0 0 18 12">
                <rect width="18" height="12" fill="#B22234"/>
                <rect y="1" width="18" height="1" fill="#FFFFFF"/>
                <rect y="3" width="18" height="1" fill="#FFFFFF"/>
                <rect y="5" width="18" height="1" fill="#FFFFFF"/>
                <rect y="7" width="18" height="1" fill="#FFFFFF"/>
                <rect y="9" width="18" height="1" fill="#FFFFFF"/>
                <rect y="11" width="18" height="1" fill="#FFFFFF"/>
                <rect width="7" height="7" fill="#3C3B6E"/>
              </svg>
            ) : (
              <svg width="18" height="12" viewBox="0 0 18 12"><rect width="18" height="12" fill="#AA151B"/><rect width="18" height="4" y="4" fill="#F1BF00"/></svg>
            )}</span>
            <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
          </button>
          {langOpen && (
            <div className="absolute right-0 mt-1 w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-md z-20">
              <button type="button" className="w-full px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center" onClick={() => { onLanguageChange('en'); setLangOpen(false); }} aria-label="English">
                <svg width="20" height="13" viewBox="0 0 18 12">
                  <rect width="18" height="12" fill="#B22234"/>
                  <rect y="1" width="18" height="1" fill="#FFFFFF"/>
                  <rect y="3" width="18" height="1" fill="#FFFFFF"/>
                  <rect y="5" width="18" height="1" fill="#FFFFFF"/>
                  <rect y="7" width="18" height="1" fill="#FFFFFF"/>
                  <rect y="9" width="18" height="1" fill="#FFFFFF"/>
                  <rect y="11" width="18" height="1" fill="#FFFFFF"/>
                  <rect width="7" height="7" fill="#3C3B6E"/>
                </svg>
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

            <div className="relative">
              <button
                type="button"
                onClick={() => setBellOpen((prev) => !prev)}
              className="btn btn-ghost p-2 relative"
              title={tt('notifications', 'Notificações')}
              aria-label={tt('notifications', 'Notificações')}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[1rem] px-1 rounded-full bg-red-500 text-white text-[10px] leading-4 text-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              {bellOpen && (
                <div className="absolute right-0 mt-1 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-md z-20">
                  <div className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100">
                    {tt('notifications', 'Notificações')}
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800">
                  {notifications.length === 0 ? (
                    <div className="px-3 py-3 text-sm text-slate-600 dark:text-slate-300">{tt('no_notifications', 'Sem notificações')}</div>
                  ) : (
                      notifications.map((n) => (
                        <button key={n.id} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => { setBellOpen(false); navigate(`/notifications/${n.id}`); }}>
                          <div className="font-medium text-slate-900 dark:text-slate-100">{n.titulo || n.title || 'Notificação'}</div>
                        </button>
                      ))
                  )}
                </div>
              </div>
            )}
          </div>

            {/* Backend status */}
            <div
              className="p-2 rounded-md"
              title={
                backendStatus === 'ok' ? tt('backend_ok', 'Online')
                : backendStatus === 'checking' ? tt('backend_checking', 'Verificando...')
                : tt('backend_error', 'Offline')
              }
            >
              {backendStatus === 'ok' && (
                <Wifi size={18} className="text-emerald-500" />
              )}
              {backendStatus === 'checking' && (
                <Loader2 size={18} className="animate-spin text-slate-500" />
              )}
              {backendStatus === 'error' && (
                <WifiOff size={18} className="text-red-500" />
              )}
            </div>

            {/* Logout */}
            <button
              type="button"
              onClick={onLogout}
              className="btn btn-ghost p-2"
              title={tt('logout', 'Sair')}
              aria-label={tt('logout', 'Sair')}
            >
              <LogOut size={18} />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
