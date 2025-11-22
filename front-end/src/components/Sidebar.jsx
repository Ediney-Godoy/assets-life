import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, SquareStack, ClipboardList, BarChart3, Shield, UserCheck, Info, HelpCircle } from 'lucide-react';
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

  const menu = [
    { to: '/dashboard', label: t('nav_dashboard'), icon: LayoutDashboard },
    { to: '/cadastros', label: t('nav_registrations'), icon: SquareStack },
    { to: '/reviews', label: t('nav_reviews'), icon: ClipboardList },
    { to: '/supervisao-rvu', label: t('nav_supervisao') || 'Supervisão', icon: UserCheck },
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

  const asideWidth = collapsed ? 'w-16' : 'w-16 md:w-56 lg:w-64';

  return (
    <aside className={`sidebar ${asideWidth} shrink-0 flex flex-col h-full transition-all duration-300`}>
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4">
        <img
          src="/brand.svg"
          alt="Assets Life"
          className={`transition-all duration-300 ${collapsed ? 'h-8' : 'h-8 md:h-10'}`}
        />
      </div>

      {/* Divider */}
      <div className="divider mx-3" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = location.pathname === section.to || location.pathname.startsWith(section.to + '/');

          return (
            <NavLink
              key={section.to}
              to={section.to}
              className={`sidebar-item ${isActive ? 'sidebar-item-active' : ''} ${collapsed ? 'justify-center px-2' : 'justify-center md:justify-start'}`}
              title={collapsed ? section.label : undefined}
            >
              <Icon size={20} className="shrink-0" />
              {!collapsed && (
                <span className="hidden md:block truncate">{section.label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4">
        <div className="divider mb-3" />
        <div className={`text-xs text-center ${collapsed ? 'hidden' : 'hidden md:block'}`} style={{ color: 'var(--text-muted)' }}>
          Assets Life v2.0
        </div>
      </div>
    </aside>
  );
}
