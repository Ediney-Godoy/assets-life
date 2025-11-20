import React from 'react';
import { useTranslation } from 'react-i18next';

export default function HelpPage() {
  const { t } = useTranslation();
  return (
    <section className="px-4 space-y-4">
      <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{t('help_title')}</h2>
      <p className="text-slate-700 dark:text-slate-300">{t('help_intro')}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">{t('help_reviews_menu_title')}</div>
          <ul className="text-slate-700 dark:text-slate-300 space-y-2 list-disc pl-5">
            <li>{t('help_reviews_menu_item_periods')}</li>
            <li>{t('help_reviews_menu_item_delegation')}</li>
            <li>{t('help_reviews_menu_item_individual')}</li>
            <li>{t('help_reviews_menu_item_mass')}</li>
          </ul>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">{t('help_reviews_flow_title')}</div>
          <ol className="text-slate-700 dark:text-slate-300 space-y-2 list-decimal pl-5">
            <li>{t('help_reviews_flow_step_period')}</li>
            <li>{t('help_reviews_flow_step_import')}</li>
            <li>{t('help_reviews_flow_step_delegate')}</li>
            <li>{t('help_reviews_flow_step_review')}</li>
            <li>{t('help_reviews_flow_step_mass')}</li>
            <li>{t('help_reviews_flow_step_reports')}</li>
          </ol>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">{t('help_tips_title')}</div>
        <ul className="text-slate-700 dark:text-slate-300 space-y-2 list-disc pl-5">
          <li>{t('help_tip_filters')}</li>
          <li>{t('help_tip_shortcuts')}</li>
          <li>{t('help_tip_permissions')}</li>
        </ul>
      </div>
    </section>
  );
}