import React from 'react';
import { useTranslation } from 'react-i18next';
import { BUILD_TIME, getDisplayVersion } from '../version';

export default function AboutPage() {
  const { t } = useTranslation();
  return (
    <section className="px-4">
      <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">{t('about_title')}</h2>
      <p className="text-slate-700 dark:text-slate-300 mb-4">{t('about_purpose')}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">{t('about_origin_title')}</div>
          <p className="text-slate-700 dark:text-slate-300">{t('about_origin')}</p>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">{t('about_tech_title')}</div>
          <ul className="text-slate-700 dark:text-slate-300 space-y-1">
            <li>{t('about_frontend')}</li>
            <li>{t('about_backend')}</li>
            <li>{t('about_security')}</li>
            <li>{t('about_deploy')}</li>
          </ul>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">{t('about_help_title')}</div>
        <p className="text-slate-700 dark:text-slate-300">{t('about_help')}</p>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Versão</div>
        <div className="text-sm text-slate-700 dark:text-slate-300">Assets Life v{getDisplayVersion()}</div>
        {BUILD_TIME && (
          <div className="text-xs text-slate-600 dark:text-slate-400">Build: {new Date(BUILD_TIME).toLocaleString()}</div>
        )}
      </div>
    </section>
  );
}
