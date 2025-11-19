import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, SquareStack, ClipboardList, BarChart3, Shield, UserCheck } from 'lucide-react';
import { getRole, getVisibleMenuForRole } from '../permissions';

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

  const asideWidth = collapsed ? 'w-12' : 'w-14 sm:w-16 md:w-36 lg:w-44 xl:w-56';
  const logoSize = collapsed ? 'h-10' : 'h-14 sm:h-16 md:h-20 lg:h-24';
  const linkJustify = collapsed ? 'justify-center' : 'justify-center md:justify-start';
  const linkGap = collapsed ? 'gap-0' : 'gap-0 md:gap-3';
  const labelClass = collapsed ? 'hidden' : 'hidden lg:inline';

  return (
    <aside className={`${asideWidth} shrink-0 border-r border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 p-2 md:p-3`}>
      <div className="flex items-center justify-center px-1 md:px-2 pb-2 md:pb-3">
        <img src="/brand.svg" alt="Logo" className={logoSize} />
      </div>
      <nav className="flex flex-col gap-1">
        {sections.map((section) => {
          const Icon = section.icon;
          const isSectionActive = location.pathname.startsWith(section.to);
          return (
            <NavLink
              key={section.to}
              to={section.to}
              className={({ isActive }) => `flex items-center ${linkJustify} ${linkGap} px-1.5 md:px-3 py-1.5 md:py-2 rounded-md text-sm transition-colors ${
                isActive || isSectionActive ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100' :
                'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'} `}
            >
              <Icon size={18} />
              <span className={labelClass}>{section.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}