import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Building2, Users2, UserCog, Layers, FolderKanban, Wallet, Network, Crosshair, CalendarDays } from 'lucide-react';
import { getCompanies, getReviewPeriods, getReviewItems, getReviewDelegations } from '../apiClient';
import Pie3D from '../components/charts/Pie3D';

export default function DashboardPage({ registrationsOnly }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [companies, setCompanies] = React.useState([]);
  const [companyId, setCompanyId] = React.useState('');
  const [metrics, setMetrics] = React.useState({ totalItems: 0, assignedItems: 0, reviewedItems: 0, reviewedPct: 0, fullyDepreciated: 0 });
  const [chartData, setChartData] = React.useState([]);

  React.useEffect(() => {
    if (registrationsOnly) return;
    getCompanies().then((list) => {
      const arr = Array.isArray(list) ? list : [];
      setCompanies(arr);
      if (!companyId && arr.length > 0) {
        setCompanyId(String(arr[0].id));
      }
    }).catch(() => {});
  }, [registrationsOnly, companyId]);

  // Carrega períodos e prepara dados do gráfico 3D e métricas conforme empresa selecionada
  React.useEffect(() => {
    if (registrationsOnly) return;
    if (!companyId) {
      setChartData([]);
      setMetrics({ totalItems: 0, assignedItems: 0, reviewedItems: 0, reviewedPct: 0 });
      return;
    }
    const init = async () => {
      try {
        const periods = await getReviewPeriods();
        const list = Array.isArray(periods) ? periods.filter((p) => String(p.empresa_id) === String(companyId)) : [];
        if (list.length > 0) {
          const open = list.find((p) => (p.status || '').toLowerCase() === 'aberto') || list[0];
          const pid = open.id;
          const [items, delegs] = await Promise.all([
            getReviewItems(pid),
            getReviewDelegations(pid),
          ]);
          const itemsArr = Array.isArray(items) ? items : [];
          const delegsArr = Array.isArray(delegs) ? delegs : [];
          const totalItems = itemsArr.length;
          const delegatedIds = new Set(delegsArr.map((d) => d.ativo_id));
          const assignedItems = delegatedIds.size;
          const reviewedItems = itemsArr.filter((i) => {
            const s = String(i.status || '').toLowerCase();
            return s === 'revisado' || s === 'concluido';
          }).length;
          const reviewedPct = totalItems ? Number(((reviewedItems / totalItems) * 100).toFixed(1)) : 0;
          // Ativos totalmente depreciados: contar somente ativos principais (sub_numero === '0') cujo
          // valor contábil esteja zerado no principal e em todas as incorporações (se houverem)
          const groups = itemsArr.reduce((acc, it) => {
            const key = String(it.numero_imobilizado || '');
            if (!acc[key]) acc[key] = [];
            acc[key].push(it);
            return acc;
          }, {});
          let fullyDepreciated = 0;
          Object.values(groups).forEach((list) => {
            const hasMain = list.some((x) => String(x.sub_numero || '') === '0');
            const allZero = list.every((x) => Number(x.valor_contabil || 0) === 0);
            if (hasMain && allZero) fullyDepreciated += 1;
          });
          setMetrics({ totalItems, assignedItems, reviewedItems, reviewedPct, fullyDepreciated });

          const byUser = {};
          delegsArr.forEach((d) => {
            const name = d.revisor_nome || `ID ${d.revisor_id}`;
            byUser[name] = (byUser[name] || 0) + 1;
          });
          const unassigned = Math.max(0, totalItems - delegatedIds.size);
          const series = Object.entries(byUser).map(([name, count]) => ({ name, y: count }));
          series.push({ name: t('dashboard_unassigned'), y: unassigned });
          setChartData(series);
        } else {
          setChartData([]);
          setMetrics({ totalItems: 0, assignedItems: 0, reviewedItems: 0, reviewedPct: 0, fullyDepreciated: 0 });
        }
      } catch (err) {
        console.error(err);
        setChartData([]);
        setMetrics({ totalItems: 0, assignedItems: 0, reviewedItems: 0, reviewedPct: 0, fullyDepreciated: 0 });
      }
    };
    init();
  }, [registrationsOnly, companyId]);

  const cards = [
    { title: t('companies_title'), subtitle: t('companies_subtitle'), icon: Building2, action: () => navigate('/companies') },
    { title: t('users_title'), subtitle: t('users_subtitle'), icon: Users2, action: () => navigate('/users') },
    { title: t('collab_title'), subtitle: t('collab_subtitle'), icon: UserCog, action: () => navigate('/employees') },
    { title: t('acc_classes_title'), subtitle: t('acc_classes_subtitle'), icon: Layers, action: () => alert('Em breve') },
    { title: t('acc_groups_title'), subtitle: t('acc_groups_subtitle'), icon: FolderKanban, action: () => alert('Em breve') },
    { title: t('acc_accounts_title'), subtitle: t('acc_accounts_subtitle'), icon: Wallet, action: () => alert('Em breve') },
    { title: t('ug_title'), subtitle: t('ug_subtitle'), icon: Network, action: () => navigate('/ugs') },
    { title: t('cost_centers_title'), subtitle: t('cost_centers_subtitle'), icon: Crosshair, action: () => navigate('/cost-centers') },
    { title: t('asset_species_title'), subtitle: t('asset_species_subtitle'), icon: CalendarDays, action: () => alert('Em breve') },
  ];

  // Exibir cards SOMENTE em Cadastros; no Dashboard, manter foco em métricas/gráfico
  const visibleCards = registrationsOnly ? cards : [];

  // Paleta suave para os cards (métricas e atalhos)
  const metricColors = ['sky', 'violet', 'emerald', 'amber', 'rose'];
  const shortcutColors = ['blue', 'violet', 'emerald', 'amber', 'rose', 'indigo', 'cyan', 'teal', 'fuchsia'];

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-6 text-slate-900 dark:text-slate-100">
        {registrationsOnly ? t('nav_registrations') : t('nav_dashboard')}
      </h2>

      {!registrationsOnly && (
        <>
          <div className="mb-4 max-w-md">
            <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">{t('dashboard_company_label')}</label>
            <select
              className="w-full h-10 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <MetricCard color={metricColors[0]} label={t('dashboard_metric_total_items')} value={metrics.totalItems} />
            <MetricCard color={metricColors[1]} label={t('dashboard_metric_assigned_items')} value={metrics.assignedItems} />
            <MetricCard color={metricColors[2]} label={t('dashboard_metric_reviewed_items')} value={metrics.reviewedItems} />
            <MetricCard color={metricColors[3]} label={t('dashboard_metric_reviewed_pct')} value={`${metrics.reviewedPct}%`} />
            <MetricCard color={metricColors[4]} label={t('dashboard_metric_fully_depreciated')} value={metrics.fullyDepreciated} />
          </div>

          {/* Gráfico de Pizza 3D: Atribuídos por usuário e a atribuir */}
          {chartData.length > 0 ? (
            <Pie3D data={chartData} title={t('dashboard_chart_title')} />
          ) : (
            <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4 mb-6">
              <div className="text-slate-600 dark:text-slate-300">{t('dashboard_no_data')}</div>
            </div>
          )}
        </>
      )}

      {visibleCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleCards.map((c, idx) => (
            <motion.button
              key={idx}
              onClick={c.action}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className={`group text-left w-full rounded-xl shadow-card border p-4 hover:shadow-md transition-colors
               ${idx % shortcutColors.length === 0 ? 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800' : ''}
               ${(() => {
                 const cName = shortcutColors[idx % shortcutColors.length];
                 const base = {
                   blue: 'bg-blue-50/60 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30 hover:border-blue-200 dark:hover:border-blue-800',
                   violet: 'bg-violet-50/60 dark:bg-violet-900/20 border-violet-100 dark:border-violet-900/30 hover:border-violet-200 dark:hover:border-violet-800',
                   emerald: 'bg-emerald-50/60 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30 hover:border-emerald-200 dark:hover:border-emerald-800',
                   amber: 'bg-amber-50/60 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30 hover:border-amber-200 dark:hover:border-amber-800',
                   rose: 'bg-rose-50/60 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30 hover:border-rose-200 dark:hover:border-rose-800',
                   indigo: 'bg-indigo-50/60 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/30 hover:border-indigo-200 dark:hover:border-indigo-800',
                   cyan: 'bg-cyan-50/60 dark:bg-cyan-900/20 border-cyan-100 dark:border-cyan-900/30 hover:border-cyan-200 dark:hover:border-cyan-800',
                   teal: 'bg-teal-50/60 dark:bg-teal-900/20 border-teal-100 dark:border-teal-900/30 hover:border-teal-200 dark:hover:border-teal-800',
                   fuchsia: 'bg-fuchsia-50/60 dark:bg-fuchsia-900/20 border-fuchsia-100 dark:border-fuchsia-900/30 hover:border-fuchsia-200 dark:hover:border-fuchsia-800',
                 };
                 return base[cName] || '';
               })()}`}
            >
              <div className="flex items-start gap-3">
                {(() => {
                  const cName = shortcutColors[idx % shortcutColors.length];
                  const iconCls = {
                    blue: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
                    violet: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
                    emerald: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
                    amber: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
                    rose: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300',
                    indigo: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
                    cyan: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300',
                    teal: 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300',
                    fuchsia: 'bg-fuchsia-100 dark:bg-fuchsia-900/40 text-fuchsia-700 dark:text-fuchsia-300',
                  }[cName];
                  return (
                    <div className={`p-2 rounded-lg ${iconCls}`}>
                      <c.icon size={22} />
                    </div>
                  );
                })()}
                <div className="flex-1">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{c.title}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">{c.subtitle}</div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </section>
  );
}

function MetricCard({ label, value, color = 'slate' }) {
  const colorMap = {
    slate: 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800',
    sky: 'bg-sky-50 dark:bg-sky-900/20 border-sky-100 dark:border-sky-900/30',
    violet: 'bg-violet-50 dark:bg-violet-900/20 border-violet-100 dark:border-violet-900/30',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30',
    amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30',
    rose: 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30',
  };
  const cls = colorMap[color] || colorMap.slate;
  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <div className="text-sm text-slate-700 dark:text-slate-300">{label}</div>
      <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</div>
    </div>
  );
}