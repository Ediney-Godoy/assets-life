import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, FileText, Clock, ListChecks, UserCheck } from 'lucide-react';

export default function ReviewsMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const allowed = useMemo(() => {
    try {
      const raw = localStorage.getItem('assetlife_permissoes');
      const rotas = raw ? JSON.parse(raw)?.rotas : [];
      if (Array.isArray(rotas) && rotas.length > 0) {
        return new Set(rotas);
      }
    } catch {}
    return new Set();
  }, []);

  const hasPerm = (path) => {
    if (!allowed || allowed.size === 0) return false; // requer rota explícita
    if (allowed.has(path)) return true;
    // compatibilidade: rota alternativa para revisão em massa
    if (path === '/reviews/massa' && allowed.has('/revisoes-massa')) return true;
    // compatibilidade: Supervisão (rota no backend)
    if (path === '/supervisao/rvu' && allowed.has('/supervisao-rvu')) return true;
    return false;
  };

  return (
    <section>
      <div className="mb-4 px-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{t('reviews_menu_title')}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {hasPerm('/reviews/periodos') && (
          <button
            type="button"
            onClick={() => navigate('/reviews/periodos')}
            className="group text-left w-full rounded-xl shadow-card border p-4 hover:shadow-md transition-colors bg-blue-50/60 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30 hover:border-blue-200 dark:hover:border-blue-800"
            aria-label={t('reviews_menu_periods_title')}
            title={t('reviews_menu_periods_title')}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                <ClipboardList size={22} />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900 dark:text-slate-100">{t('reviews_menu_periods_title')}</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">{t('reviews_menu_periods_subtitle')}</div>
              </div>
            </div>
          </button>
        )}

        {hasPerm('/reviews/delegacao') && (
          <button
            type="button"
            onClick={() => navigate('/reviews/delegacao')}
            className="group text-left w-full rounded-xl shadow-card border p-4 hover:shadow-md transition-colors bg-violet-50/60 dark:bg-violet-900/20 border-violet-100 dark:border-violet-900/30 hover:border-violet-200 dark:hover:border-violet-800"
            aria-label={t('reviews_menu_delegations_title')}
            title={t('reviews_menu_delegations_title')}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
                <FileText size={22} />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900 dark:text-slate-100">{t('reviews_menu_delegations_title')}</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">{t('reviews_menu_delegations_subtitle')}</div>
              </div>
            </div>
          </button>
        )}

        {hasPerm('/reviews/massa') && (
          <button
            type="button"
            onClick={() => navigate('/reviews/massa')}
            className="group text-left w-full rounded-xl shadow-card border p-4 hover:shadow-md transition-colors bg-emerald-50/60 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30 hover:border-emerald-200 dark:hover:border-emerald-800"
            aria-label={t('reviews_menu_mass_title')}
            title={t('reviews_menu_mass_title')}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                <ListChecks size={22} />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900 dark:text-slate-100">{t('reviews_menu_mass_title')}</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">{t('reviews_menu_mass_subtitle')}</div>
              </div>
            </div>
          </button>
        )}

        {hasPerm('/reviews/vidas-uteis') && (
          <button
            type="button"
            onClick={() => navigate('/reviews/vidas-uteis')}
            className="group text-left w-full rounded-xl shadow-card border p-4 hover:shadow-md transition-colors bg-amber-50/60 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30 hover:border-amber-200 dark:hover:border-amber-800"
            aria-label={t('reviews_menu_useful_lives_title')}
            title={t('reviews_menu_useful_lives_title')}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                <Clock size={22} />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900 dark:text-slate-100">{t('reviews_menu_useful_lives_title')}</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">{t('reviews_menu_useful_lives_subtitle')}</div>
              </div>
            </div>
          </button>
        )}

        {hasPerm('/supervisao/rvu') && (
          <button
            type="button"
            onClick={() => navigate('/supervisao-rvu')}
            className="group text-left w-full rounded-xl shadow-card border p-4 hover:shadow-md transition-colors bg-cyan-50/60 dark:bg-cyan-900/20 border-cyan-100 dark:border-cyan-900/30 hover:border-cyan-200 dark:hover:border-cyan-800"
            aria-label={t('reviews_menu_supervision_title')}
            title={t('reviews_menu_supervision_title')}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300">
                <UserCheck size={22} />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900 dark:text-slate-100">{t('reviews_menu_supervision_title')}</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">{t('reviews_menu_supervision_subtitle')}</div>
              </div>
            </div>
          </button>
        )}
      </div>
    </section>
  );
}