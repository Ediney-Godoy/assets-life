import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  SquareStack,
  ClipboardList,
  BarChart3,
  Shield,
  UserCheck,
  Info,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { getRole, getVisibleMenuForRole } from '../permissions';
import clsx from 'clsx';

export default function Sidebar({ collapsed = false }) {
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

  const menu = [
    { to: '/dashboard', label: t('nav_dashboard'), icon: LayoutDashboard },
    { to: '/cadastros', label: t('nav_registrations'), icon: SquareStack },
    { to: '/reviews', label: t('nav_reviews'), icon: ClipboardList },
    { to: '/supervisao-rvu', label: t('nav_supervisao') || 'Supervisao', icon: UserCheck },
    { to: '/reports', label: t('nav_reports'), icon: BarChart3 },
    { to: '/permissions', label: t('nav_permissions'), icon: Shield },
    { to: '/about', label: t('nav_about'), icon: Info },
    { to: '/help', label: t('nav_help'), icon: HelpCircle },
  ];

  const allowed = (() => {
    const hasRoutes = Array.isArray(visible) && visible.length > 0 && visible.every((v) => v.startsWith('/'));
    const base = hasRoutes ? visible : ['/dashboard'];
    const set = new Set(base);
    if (!set.has('/dashboard')) set.add('/dashboard');
    set.add('/about');
    set.add('/help');
    return set;
  })();

  const isRouteVisible = (route, parent) => {
    if (!allowed) return false;
    return allowed.has(route) || (parent ? allowed.has(parent) : false);
  };

  const childMap = {
    '/reviews': ['/avaliacoes','/reviews/periodos','/reviews/delegacao','/reviews/massa','/revisoes-massa','/reviews/vidas-uteis','/revisoes/vidas-uteis','/revisao/vidas-uteis'],
    '/reports': ['/relatorios-rvu','/reports/vida-util'],
    '/supervisao-rvu': ['/supervisao/rvu','/supervisao-rvu'],
    '/permissions': ['/permissions','/permissions/groups'],
    '/cadastros': ['/companies','/ugs','/cost-centers','/users','/asset-species','/cadastros'],
  };

  const hasChildrenAllowed = (parent) => {
    const list = childMap[parent] || [];
    for (const r of list) if (allowed.has(r)) return true;
    for (const r of allowed) if (r.startsWith(parent + '/')) return true;
    return false;
  };

  const sections = menu.filter((section) => isRouteVisible(section.to) || hasChildrenAllowed(section.to));

  return (
    <aside
      className={clsx(
        'shrink-0 h-full flex flex-col',
        'border-r border-neutral-200 dark:border-neutral-800',
        'bg-white dark:bg-neutral-900',
        'transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-16 sm:w-20 md:w-48 lg:w-56 xl:w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-center p-3 md:p-4">
        <img
          src="/brand.svg"
          alt="Logo"
          className={clsx(
            'transition-all duration-300',
            collapsed ? 'h-8 w-8' : 'h-10 sm:h-12 md:h-16 lg:h-20'
          )}
        />
      </div>

      {/* Divider */}
      <div className="mx-3 h-px bg-neutral-200 dark:bg-neutral-800" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <ul className="space-y-1">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = location.pathname === section.to || location.pathname.startsWith(section.to + '/');

            return (
              <li key={section.to}>
                <NavLink
                  to={section.to}
                  className={clsx(
                    'group flex items-center gap-3',
                    'px-3 py-2.5 rounded-lg',
                    'text-sm font-medium',
                    'transition-all duration-200',
                    isActive
                      ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100',
                    collapsed && 'justify-center px-2'
                  )}
                  title={collapsed ? section.label : undefined}
                >
                  <Icon
                    size={20}
                    className={clsx(
                      'shrink-0 transition-colors',
                      isActive
                        ? 'text-brand-500 dark:text-brand-400'
                        : 'text-neutral-500 dark:text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-300'
                    )}
                  />
                  {!collapsed && (
                    <>
                      <span className="hidden md:block truncate flex-1">{section.label}</span>
                      {(section.to === '/cadastros' || section.to === '/reviews' || section.to === '/reports' || section.to === '/permissions') && (
                        <ChevronRight
                          size={14}
                          className={clsx(
                            'hidden md:block shrink-0 transition-transform',
                            isActive && 'rotate-90'
                          )}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800">
        <div className={clsx(
          'flex items-center gap-2',
          collapsed ? 'justify-center' : 'px-2'
        )}>
          <div className="h-2 w-2 rounded-full bg-success-500 animate-pulse" />
          {!collapsed && (
            <span className="hidden md:block text-xs text-neutral-500 dark:text-neutral-400">
              v1.0.0
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
