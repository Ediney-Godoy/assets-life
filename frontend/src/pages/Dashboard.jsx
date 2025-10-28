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
  const [metrics, setMetrics] = React.useState({ totalItems: 0, assignedItems: 0, reviewedItems: 0, reviewedPct: 0 });
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
          setMetrics({ totalItems, assignedItems, reviewedItems, reviewedPct });

          const byUser = {};
          delegsArr.forEach((d) => {
            const name = d.revisor_nome || `ID ${d.revisor_id}`;
            byUser[name] = (byUser[name] || 0) + 1;
          });
          const unassigned = Math.max(0, totalItems - delegatedIds.size);
          const series = Object.entries(byUser).map(([name, count]) => ({ name, y: count }));
          series.push({ name: 'A atribuir', y: unassigned });
          setChartData(series);
        } else {
          setChartData([]);
          setMetrics({ totalItems: 0, assignedItems: 0, reviewedItems: 0, reviewedPct: 0 });
        }
      } catch (err) {
        console.error(err);
        setChartData([]);
        setMetrics({ totalItems: 0, assignedItems: 0, reviewedItems: 0, reviewedPct: 0 });
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

  const visibleCards = registrationsOnly ? cards : [];

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-6 text-slate-900 dark:text-slate-100">
        {registrationsOnly ? t('nav_registrations') : t('nav_dashboard')}
      </h2>

      {!registrationsOnly && (
        <>
          <div className="mb-4 max-w-md">
            <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Empresa</label>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard label="Total de itens" value={metrics.totalItems} />
            <MetricCard label="Itens Atribuidos" value={metrics.assignedItems} />
            <MetricCard label="Itens revisados" value={metrics.reviewedItems} />
            <MetricCard label="Percentual de itens revisados" value={`${metrics.reviewedPct}%`} />
          </div>

          {/* Gráfico de Pizza 3D: Atribuídos por usuário e a atribuir */}
          {chartData.length > 0 ? (
            <Pie3D data={chartData} title="Atribuídos por usuário e a atribuir" />
          ) : (
            <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4 mb-6">
              <div className="text-slate-600 dark:text-slate-300">Sem dados de revisão para exibir.</div>
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
              className="group text-left w-full bg-white dark:bg-slate-950 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-4 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
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
      )}
    </section>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
      <div className="text-sm text-slate-600 dark:text-slate-300">{label}</div>
      <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</div>
    </div>
  );
}