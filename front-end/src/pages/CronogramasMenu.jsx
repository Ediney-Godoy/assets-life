import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Clock, BarChart3, UserCheck } from 'lucide-react';
import { authMePermissions } from '../apiClient';

export default function CronogramasMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [allowed, setAllowed] = React.useState(new Set());

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('assetlife_permissoes');
      const rotas = raw ? JSON.parse(raw)?.rotas : [];
      if (Array.isArray(rotas) && rotas.length > 0) {
        setAllowed(new Set(rotas));
      }
    } catch {}
    (async () => {
      try {
        const perms = await authMePermissions();
        try { localStorage.setItem('assetlife_permissoes', JSON.stringify(perms)); } catch {}
        const rotas2 = Array.isArray(perms?.rotas) ? perms.rotas : [];
        setAllowed(new Set(rotas2));
      } catch {}
    })();
  }, []);

  const hasPerm = (path) => {
    if (!allowed || allowed.size === 0) return false; // requer rota explícita
    if (allowed.has(path)) return true;
    // compatibilidade: Revisão de Vidas Úteis
    if (path === '/reviews/vidas-uteis') {
      if (allowed.has('/revisoes/vidas-uteis')) return true;
      if (allowed.has('/revisao/vidas-uteis')) return true;
      if (allowed.has('/reviews/rvu')) return true;
    }
    // compatibilidade: Cronogramas (assumindo que /reviews/cronogramas dá acesso ao menu)
    if (path === '/reviews/cronogramas' && allowed.has('/reviews/cronogramas')) return true;
    if (path === '/simulador/depreciacao' && allowed.has('/simulador/depreciacao')) return true;
    if (path === '/supervisao/rvu' && allowed.has('/supervisao/rvu')) return true;

    return false;
  };

  return (
    <section>
      <div className="mb-4 px-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{t('cronogram_menu_title', 'Ferramentas')}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {hasPerm('/reviews/cronogramas') && (
          <button
            type="button"
            onClick={() => navigate('/reviews/cronogramas/view')}
            className="group text-left w-full rounded-xl shadow-card border p-4 hover:shadow-md transition-colors bg-blue-50/60 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30 hover:border-blue-200 dark:hover:border-blue-800"
            aria-label="Cronogramas"
            title="Cronogramas"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                <Clock size={22} />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900 dark:text-slate-100">Cronogramas</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">{t('cronogram_menu_subtitle', 'Gerenciar cronogramas de revisão')}</div>
              </div>
            </div>
          </button>
        )}

        {hasPerm('/simulador/depreciacao') && (
          <button
            type="button"
            onClick={() => navigate('/simulador/depreciacao')}
            className="group text-left w-full rounded-xl shadow-card border p-4 hover:shadow-md transition-colors bg-lime-50/60 dark:bg-lime-900/20 border-lime-100 dark:border-lime-900/30 hover:border-lime-200 dark:hover:border-lime-800"
            aria-label="Simulador de Depreciação"
            title="Simulador de Depreciação"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-lime-100 dark:bg-lime-900/40 text-lime-700 dark:text-lime-300">
                <BarChart3 size={22} />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900 dark:text-slate-100">Simulador de Depreciação</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  Compare cenários de depreciação original x revisada.
                </div>
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
