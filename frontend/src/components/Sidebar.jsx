import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, SquareStack, Box, ClipboardList, BarChart3, Shield, Building2, Users2, UserCog, Network, Crosshair, FileText, Clock } from 'lucide-react';
import { getRole, getVisibleMenuForRole } from '../permissions';

export default function Sidebar() {
  const { t } = useTranslation();
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

  const routeMap = {
    '/dashboard': { label: t('nav_dashboard'), icon: LayoutDashboard },
    '/cadastros': { label: t('nav_registrations'), icon: SquareStack },
    '/assets': { label: t('nav_assets'), icon: Box },
    '/reviews': { label: t('nav_reviews'), icon: ClipboardList },
    '/reviews/periodos': { label: 'Períodos', icon: ClipboardList },
    '/reviews/delegacao': { label: 'Delegações', icon: FileText },
    '/reviews/vidas-uteis': { label: 'Vidas Úteis', icon: Clock },
    '/reports': { label: t('nav_reports'), icon: BarChart3 },
    '/permissions': { label: t('nav_permissions'), icon: Shield },
    '/companies': { label: t('nav_companies') || 'Empresas', icon: Building2 },
    '/employees': { label: t('collab_title') || 'Colaboradores', icon: UserCog },
    '/ugs': { label: t('ug_title') || 'UGs', icon: Network },
    '/users': { label: t('users_title') || 'Usuários', icon: Users2 },
    '/cost-centers': { label: t('cost_centers_title') || 'Centros de Custos', icon: Crosshair },
  };

  // Se vieram rotas específicas do backend, montar o menu baseado nelas; caso contrário, usar fallback por papel
  let items;
  if (Array.isArray(visible) && visible.length > 0 && visible.every((v) => v.startsWith('/'))) {
    // visible veio das permissões (ou do fallback convertido), gerar itens
    const list = Array.from(new Set(visible));
    if (!list.includes('/dashboard')) list.unshift('/dashboard');
    items = list.map((to) => {
      const def = routeMap[to] || { label: to.replace(/^\/+/, ''), icon: SquareStack };
      return { to, label: def.label, icon: def.icon };
    });
  } else {
    // segurança: se algo inesperado, usar conjunto padrão
    const defaults = ['/dashboard', '/cadastros', '/assets', '/reviews', '/reports', '/permissions'];
    items = defaults
      .filter((to) => getVisibleMenuForRole(role).includes(to))
      .map((to) => ({ to, label: routeMap[to].label, icon: routeMap[to].icon }));
  }

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