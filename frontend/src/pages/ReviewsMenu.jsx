import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, FileText, Clock } from 'lucide-react';

export default function ReviewsMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <section>
      <div className="mb-4 px-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{t('reviews_menu_title')}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => navigate('/reviews/periodos')}
          className="text-left rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm p-4 hover:bg-gray-50 dark:hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label={t('reviews_menu_periods_title')}
          title={t('reviews_menu_periods_title')}
        >
          <div className="flex items-center gap-3">
            <ClipboardList size={24} className="text-slate-800 dark:text-slate-200" />
            <div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('reviews_menu_periods_title')}</div>
              <div className="text-sm text-slate-600 dark:text-slate-300">{t('reviews_menu_periods_subtitle')}</div>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigate('/reviews/delegacao')}
          className="text-left rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm p-4 hover:bg-gray-50 dark:hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label={t('reviews_menu_delegations_title')}
          title={t('reviews_menu_delegations_title')}
        >
          <div className="flex items-center gap-3">
            <FileText size={24} className="text-slate-800 dark:text-slate-200" />
            <div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('reviews_menu_delegations_title')}</div>
              <div className="text-sm text-slate-600 dark:text-slate-300">{t('reviews_menu_delegations_subtitle')}</div>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigate('/reviews/vidas-uteis')}
          className="text-left rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm p-4 hover:bg-gray-50 dark:hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label={t('reviews_menu_useful_lives_title')}
          title={t('reviews_menu_useful_lives_title')}
        >
          <div className="flex items-center gap-3">
            <Clock size={24} className="text-slate-800 dark:text-slate-200" />
            <div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('reviews_menu_useful_lives_title')}</div>
              <div className="text-sm text-slate-600 dark:text-slate-300">{t('reviews_menu_useful_lives_subtitle')}</div>
            </div>
          </div>
        </button>
      </div>
    </section>
  );
}