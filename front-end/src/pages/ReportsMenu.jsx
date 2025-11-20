import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

export default function ReportsMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Tradução com fallback robusto (se i18n retornar a própria chave)
  const titleKey = t('useful_life_report_title');
  const subtitleKey = t('useful_life_report_subtitle');
  const title = titleKey === 'useful_life_report_title' ? 'Relatórios RVU' : titleKey;
  const subtitle = subtitleKey === 'useful_life_report_subtitle' ? 'Laudo e exportação (PDF/Excel)' : subtitleKey;

  const cards = [
    {
      title,
      subtitle,
      icon: FileText,
      // Direciona para rota compatível com permissões legadas
      action: () => navigate('/relatorios/rvu'),
    },
  ];

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-6 text-slate-900 dark:text-slate-100">
        {t('nav_reports')}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map((c, idx) => (
          <motion.button
            key={idx}
            onClick={c.action}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            className="group text-left w-full rounded-xl shadow-card border p-4 hover:shadow-md transition-colors bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/40"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
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