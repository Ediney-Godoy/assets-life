import React from 'react';
import { useTranslation } from 'react-i18next';

export default function ReportUsefulLifePage() {
  const { t } = useTranslation();
  return (
    <section>
      <h2 className="text-2xl font-semibold mb-3 text-slate-900 dark:text-slate-100">
        {t('useful_life_report_title') || 'Relatório de Vida Útil'}
      </h2>
      <p className="text-slate-600 dark:text-slate-300 mb-4">
        {t('useful_life_report_subtitle') || 'Visualização e exportação de vidas úteis por ativo'}
      </p>
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
        <p className="text-slate-700 dark:text-slate-300">{t('coming_soon') || 'Em breve.'}</p>
      </div>
    </section>
  );
}