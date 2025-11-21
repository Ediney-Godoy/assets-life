import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Users2,
  UserCog,
  Layers,
  FolderKanban,
  Wallet,
  Network,
  Crosshair,
  CalendarDays,
  Package,
  UserCheck,
  CheckCircle2,
  Percent,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { getCompanies, getReviewPeriods, getReviewItems, getReviewDelegations } from '../apiClient';
import Pie3D from '../components/charts/Pie3D';
import BarChart from '../components/charts/BarChart';
import AreaChart from '../components/charts/AreaChart';
import { MetricCard } from '../components/ui/Card';
import clsx from 'clsx';

export default function DashboardPage({ registrationsOnly }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [companies, setCompanies] = React.useState([]);
  const [companyId, setCompanyId] = React.useState('');
  const [metrics, setMetrics] = React.useState({
    totalItems: 0,
    assignedItems: 0,
    reviewedItems: 0,
    reviewedPct: 0,
    fullyDepreciated: 0,
    adjustedItems: 0,
  });
  const [chartData, setChartData] = React.useState([]);
  const [justifChartData, setJustifChartData] = React.useState([]);
  const [rotationIndex, setRotationIndex] = React.useState(0);

  React.useEffect(() => {
    if (registrationsOnly) return;
    getCompanies()
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        setCompanies(arr);
        if (!companyId && arr.length > 0) {
          setCompanyId(String(arr[0].id));
        }
      })
      .catch(() => {});
  }, [registrationsOnly, companyId]);

  React.useEffect(() => {
    if (registrationsOnly) return;
    if (!companyId) {
      setChartData([]);
      setJustifChartData([]);
      setMetrics({
        totalItems: 0,
        assignedItems: 0,
        reviewedItems: 0,
        reviewedPct: 0,
        fullyDepreciated: 0,
        adjustedItems: 0,
      });
      return;
    }
    const init = async () => {
      try {
        const periods = await getReviewPeriods();
        const list = Array.isArray(periods)
          ? periods.filter((p) => String(p.empresa_id) === String(companyId))
          : [];
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
          const normalize = (s) =>
            String(s || '')
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '');
          const reviewedItems = itemsArr.filter((i) => {
            const s = normalize(i.status);
            const statusReviewed = s === 'revisado' || s === 'revisada';
            const adjusted = Boolean(i.alterado);
            const hasJustification = Boolean(String(i.justificativa || '').trim());
            const hasCondicao = Boolean(String(i.condicao_fisica || '').trim());
            return statusReviewed || adjusted || hasJustification || hasCondicao;
          }).length;
          const reviewedPct = totalItems
            ? Number(((reviewedItems / totalItems) * 100).toFixed(1))
            : 0;
          const adjustedItems = itemsArr.filter((i) => Boolean(i.alterado)).length;
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
          setMetrics({
            totalItems,
            assignedItems,
            reviewedItems,
            reviewedPct,
            fullyDepreciated,
            adjustedItems,
          });

          const byUser = {};
          delegsArr.forEach((d) => {
            const name = d.revisor_nome || `ID ${d.revisor_id}`;
            byUser[name] = (byUser[name] || 0) + 1;
          });
          const unassigned = Math.max(0, totalItems - delegatedIds.size);
          const series = Object.entries(byUser).map(([name, count]) => ({ name, y: count }));
          series.push({ name: t('dashboard_unassigned'), y: unassigned });
          setChartData(series);

          const justifs = itemsArr
            .map((it) => String(it.justificativa || '').trim())
            .filter((j) => j.length > 0);

          if (justifs.length > 0) {
            const countsMap = new Map();
            justifs.forEach((j) => {
              const key = j.toLowerCase();
              const prev = countsMap.get(key);
              if (prev) {
                prev.count += 1;
              } else {
                countsMap.set(key, { label: j, count: 1 });
              }
            });
            const entries = Array.from(countsMap.values()).sort((a, b) => b.count - a.count);
            const TOP_N = 8;
            const top = entries.slice(0, TOP_N).map((e) => ({ name: e.label, y: e.count }));
            const others = entries.slice(TOP_N).reduce((acc, e) => acc + e.count, 0);
            if (others > 0) top.push({ name: t('dashboard_others_justifications'), y: others });
            setJustifChartData(top);
          } else {
            setJustifChartData([]);
          }
        } else {
          setChartData([]);
          setJustifChartData([]);
          setMetrics({
            totalItems: 0,
            assignedItems: 0,
            reviewedItems: 0,
            reviewedPct: 0,
            fullyDepreciated: 0,
            adjustedItems: 0,
          });
        }
      } catch (err) {
        console.error(err);
        setChartData([]);
        setJustifChartData([]);
        setMetrics({
          totalItems: 0,
          assignedItems: 0,
          reviewedItems: 0,
          reviewedPct: 0,
          fullyDepreciated: 0,
          adjustedItems: 0,
        });
      }
    };
    init();
  }, [registrationsOnly, companyId, t]);

  React.useEffect(() => {
    const id = setInterval(() => {
      setRotationIndex((i) => (i + 1) % 3);
    }, 15000);
    return () => clearInterval(id);
  }, []);

  const cards = [
    {
      title: t('companies_title'),
      subtitle: t('companies_subtitle'),
      icon: Building2,
      action: () => navigate('/companies'),
    },
    {
      title: t('users_title'),
      subtitle: t('users_subtitle'),
      icon: Users2,
      action: () => navigate('/users'),
    },
    {
      title: t('collab_title'),
      subtitle: t('collab_subtitle'),
      icon: UserCog,
      action: () => navigate('/employees'),
    },
    {
      title: t('acc_classes_title'),
      subtitle: t('acc_classes_subtitle'),
      icon: Layers,
      action: () => alert('Em breve'),
    },
    {
      title: t('acc_groups_title'),
      subtitle: t('acc_groups_subtitle'),
      icon: FolderKanban,
      action: () => alert('Em breve'),
    },
    {
      title: t('acc_accounts_title'),
      subtitle: t('acc_accounts_subtitle'),
      icon: Wallet,
      action: () => alert('Em breve'),
    },
    {
      title: t('ug_title'),
      subtitle: t('ug_subtitle'),
      icon: Network,
      action: () => navigate('/ugs'),
    },
    {
      title: t('cost_centers_title'),
      subtitle: t('cost_centers_subtitle'),
      icon: Crosshair,
      action: () => navigate('/cost-centers'),
    },
    {
      title: t('asset_species_title'),
      subtitle: t('asset_species_subtitle'),
      icon: CalendarDays,
      action: () => navigate('/asset-species'),
    },
  ];

  const visibleCards = registrationsOnly ? cards : [];

  const evolutionData = React.useMemo(() => {
    const reviewed = Number(metrics.reviewedItems || 0);
    const total = Number(metrics.totalItems || 0);
    const remaining = Math.max(0, total - reviewed);
    return [
      { name: t('dashboard_reviewed') || 'Revisados', y: reviewed },
      { name: t('dashboard_remaining') || 'Restantes', y: remaining },
    ];
  }, [metrics, t]);

  const adjustedData = React.useMemo(() => {
    const adjusted = Number(metrics.adjustedItems || 0);
    const total = Number(metrics.totalItems || 0);
    const notAdjusted = Math.max(0, total - adjusted);
    return [
      { name: t('dashboard_adjusted') || 'Ajustados', y: adjusted },
      { name: t('dashboard_not_adjusted') || 'Nao Ajustados', y: notAdjusted },
    ];
  }, [metrics, t]);

  const renderRotatingChart = (slotOffset = 0) => {
    const sequence = ['assignments', 'evolution', 'adjusted', 'justifications'];
    const idx = (rotationIndex + slotOffset) % sequence.length;
    const type = sequence[idx];

    if (type === 'assignments') {
      return chartData.length > 0 ? (
        <BarChart data={chartData} title={t('dashboard_chart_title')} horizontal={true} />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 h-[320px] flex items-center justify-center">
          <span className="text-slate-500 dark:text-slate-400">{t('dashboard_no_data')}</span>
        </div>
      );
    }
    if (type === 'justifications') {
      return justifChartData.length > 0 ? (
        <BarChart
          data={justifChartData}
          title={t('dashboard_chart_justifications_title')}
          horizontal={true}
          showPercent={true}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 h-[320px] flex items-center justify-center">
          <span className="text-slate-500 dark:text-slate-400">{t('dashboard_no_data')}</span>
        </div>
      );
    }
    if (type === 'adjusted') {
      return (
        <Pie3D data={adjustedData} title={t('dashboard_chart_adjusted_title') || 'Itens Ajustados'} />
      );
    }
    return (
      <AreaChart
        data={evolutionData}
        title={t('dashboard_chart_evolution_title') || 'Evolucao da Revisao'}
      />
    );
  };

  return (
    <section className="animate-fade-in">
      <h2 className="text-2xl font-semibold mb-6 text-slate-900 dark:text-slate-100">
        {registrationsOnly ? t('nav_registrations') : t('nav_dashboard')}
      </h2>

      {!registrationsOnly && (
        <>
          {/* Company selector */}
          <div className="mb-6 max-w-sm">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Empresa
            </label>
            <select
              className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Metrics cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <MetricCard
              title={t('dashboard_metric_total_items')}
              value={metrics.totalItems}
              icon={Package}
              variant="default"
            />
            <MetricCard
              title={t('dashboard_metric_assigned_items')}
              value={metrics.assignedItems}
              icon={UserCheck}
              variant="primary"
            />
            <MetricCard
              title={t('dashboard_metric_reviewed_items')}
              value={metrics.reviewedItems}
              icon={CheckCircle2}
              variant="success"
            />
            <MetricCard
              title={t('dashboard_metric_reviewed_pct')}
              value={`${metrics.reviewedPct}%`}
              icon={Percent}
              variant="warning"
            />
            <MetricCard
              title={t('dashboard_metric_fully_depreciated')}
              value={metrics.fullyDepreciated}
              icon={AlertTriangle}
              variant="danger"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={`left-${rotationIndex}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.35 }}
              >
                {renderRotatingChart(0)}
              </motion.div>
            </AnimatePresence>
            <AnimatePresence mode="wait">
              <motion.div
                key={`right-${rotationIndex}`}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.35 }}
              >
                {renderRotatingChart(1)}
              </motion.div>
            </AnimatePresence>
          </div>
        </>
      )}

      {/* Registration cards */}
      {visibleCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleCards.map((c, idx) => (
            <motion.button
              key={idx}
              onClick={c.action}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className={clsx(
                'group text-left w-full rounded-xl border p-4',
                'bg-white dark:bg-slate-900',
                'border-slate-200 dark:border-slate-800',
                'shadow-card hover:shadow-card-hover',
                'transition-all duration-200',
                'hover:-translate-y-0.5'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <c.icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    {c.title}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 truncate">
                    {c.subtitle}
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </section>
  );
}
