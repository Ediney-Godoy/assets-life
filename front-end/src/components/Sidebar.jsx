import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, SquareStack, ClipboardList, BarChart3, Shield, UserCheck } from 'lucide-react';
import { getRole, getVisibleMenuForRole } from '../permissions';

export default function Sidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const role = getRole();
  let visible = getVisibleMenuForRole(role);

  try {
    const permsRaw = localStorage.getItem('assetlife_permissoes');
    if (permsRaw) {
      const perms = JSON.parse(permsRaw);
      const rotas = Array.isArray(perms?.rotas) ? perms.rotas : [];
      if (rotas.length > 0) {
        visible = rotas;
      }
    }
  } catch {}

  // Apenas itens essenciais no menu (top-level)
  const menu = [
    { to: '/dashboard', label: t('nav_dashboard'), icon: LayoutDashboard },
    { to: '/cadastros', label: t('nav_registrations'), icon: SquareStack },
    { to: '/reviews', label: t('nav_reviews'), icon: ClipboardList },
    { to: '/supervisao-rvu', label: t('nav_supervisao') || 'Supervisão', icon: UserCheck },
    { to: '/reports', label: t('nav_reports'), icon: BarChart3 },
    { to: '/permissions', label: t('nav_permissions'), icon: Shield },
  ];

  // Definir conjunto de rotas permitidas
  const allowed = (() => {
    const hasRoutes = Array.isArray(visible) && visible.length > 0 && visible.every((v) => v.startsWith('/'));
    const base = hasRoutes ? visible : ['/dashboard'];
    const set = new Set(base);
    if (!set.has('/dashboard')) set.add('/dashboard');
    return set;
  })();

  const isRouteVisible = (route, parent) => {
    if (!allowed) return false;
    return allowed.has(route) || (parent ? allowed.has(parent) : false);
  };

  const sections = menu.filter((section) => isRouteVisible(section.to));

  return (
    <aside className="w-16 sm:w-20 md:w-40 lg:w-48 xl:w-60 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 p-2 md:p-3">
      <div className="flex items-center justify-center px-1 md:px-2 pb-2 md:pb-3">
        <img src="/brand.svg" alt="Logo" className="h-24" />
      </div>
      <nav className="flex flex-col gap-1">
        {sections.map((section) => {
          const Icon = section.icon;
          const isSectionActive = location.pathname.startsWith(section.to);
          return (
            <NavLink
              key={section.to}
              to={section.to}
              className={({ isActive }) => `flex items-center justify-center md:justify-start gap-0 md:gap-3 px-2 md:px-3 py-2 rounded-md text-sm transition-colors ${
                isActive || isSectionActive ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100' :
                'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'} `}
            >
              <Icon size={18} />
              <span className="hidden lg:inline">{section.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}