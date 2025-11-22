import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Breadcrumbs({ items }) {
  const { t } = useTranslation();
  const location = useLocation();
  
  // Se não houver items, tenta gerar automaticamente da rota
  if (!items || items.length === 0) {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    items = [
      { label: t('nav_dashboard') || 'Dashboard', to: '/dashboard' },
      ...pathSegments.map((segment, index) => {
        const path = '/' + pathSegments.slice(0, index + 1).join('/');
        const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
        return { label, to: path };
      }),
    ];
  }
  
  return (
    <nav className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-4" aria-label="Breadcrumb">
      <Link
        to="/dashboard"
        className="flex items-center hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        aria-label={t('nav_dashboard') || 'Dashboard'}
      >
        <Home size={16} />
      </Link>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={item.to || index}>
            <ChevronRight size={16} className="text-slate-400" />
            {isLast ? (
              <span className="font-medium text-slate-900 dark:text-slate-100" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link
                to={item.to}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

