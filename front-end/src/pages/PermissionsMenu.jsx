import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

export default function PermissionsMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Tradução com fallback robusto (se i18n retornar a própria chave)
  const titleKey = t('permissions_groups_title');
  const subtitleKey = t('permissions_groups_subtitle');
  const title = titleKey === 'permissions_groups_title' ? 'Grupos de permissões' : titleKey;
  const subtitle = subtitleKey === 'permissions_groups_subtitle' ? 'Gerencie grupos e permissões de acesso' : subtitleKey;

  const cards = [
    {
      title,
      subtitle,
      icon: Shield,
      action: () => navigate('/permissions/groups'),
    },
  ];

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-6 text-slate-900 dark:text-slate-100">
        {t('nav_permissions')}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map((c, idx) => (
          <motion.button
            key={idx}
            onClick={c.action}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            className="group text-left w-full rounded-xl shadow-sm border p-4 hover:shadow-md transition-colors bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/40"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                <c.icon size={22} />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900 dark:text-slate-100">{c.title}</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">{c.subtitle}</div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}