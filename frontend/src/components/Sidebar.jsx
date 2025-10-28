import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, SquareStack, Box, ClipboardList, BarChart3, Shield } from 'lucide-react';
import { getRole, getVisibleMenuForRole } from '../permissions';

export default function Sidebar() {
  const { t } = useTranslation();
  const role = getRole();
  const visible = getVisibleMenuForRole(role);

  const items = [
    { to: '/dashboard', label: t('nav_dashboard'), icon: LayoutDashboard },
    { to: '/cadastros', label: t('nav_registrations'), icon: SquareStack },
    { to: '/assets', label: t('nav_assets'), icon: Box },
    { to: '/reviews', label: t('nav_reviews'), icon: ClipboardList },
    { to: '/reports', label: t('nav_reports'), icon: BarChart3 },
    { to: '/permissions', label: t('nav_permissions'), icon: Shield },
  ].filter((i) => visible.includes(i.to));

  return (
    <aside className="w-60 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 p-3">
      <nav className="flex flex-col gap-1">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
              isActive ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100' :
              'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'} `}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}