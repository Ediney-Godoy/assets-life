import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

export default function PermissionsMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const cards = [
    {
      title: t('permissions_groups_title') || 'Grupos de permissões',
      subtitle: t('permissions_groups_subtitle') || 'Gerencie grupos e permissões de acesso',
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
            className="group text-left w-full rounded-xl shadow-card border p-4 hover:shadow-md transition-colors bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
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