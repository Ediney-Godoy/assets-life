import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Users2, UserCog, Layers, FolderKanban, Wallet, Network, Crosshair, CalendarDays, ChevronLeft, ChevronRight, Filter, Package, UserCheck, CheckCircle2, Percent, AlertTriangle } from 'lucide-react';
import { getCompanies, getReviewPeriods, getReviewDelegations, listarSupervisaoRVU } from '../apiClient';
import Pie3D from '../components/charts/Pie3D';
import BarChart from '../components/charts/BarChart';
import LineChart from '../components/charts/LineChart';
import AreaChart from '../components/charts/AreaChart';
import DonutChart from '../components/charts/DonutChart';

export default function DashboardPage({ registrationsOnly }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [companies, setCompanies] = React.useState([]);
  const [companyId, setCompanyId] = React.useState('');
  const [metrics, setMetrics] = React.useState({ totalItems: 0, assignedItems: 0, reviewedItems: 0, reviewedPct: 0, fullyDepreciated: 0, adjustedItems: 0 });
  const [chartData, setChartData] = React.useState([]);
  const [incrementChartData, setIncrementChartData] = React.useState([]);
  const [rotationIndex, setRotationIndex] = React.useState(0);
  const [filterPanelOpen, setFilterPanelOpen] = React.useState(false);

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

  React.useEffect(() => {
    if (registrationsOnly) return;
    if (!companyId) {
      setChartData([]);
      setIncrementChartData([]);
      setMetrics({ totalItems: 0, assignedItems: 0, reviewedItems: 0, reviewedPct: 0, fullyDepreciated: 0, adjustedItems: 0 });
      return;
    }
    const init = async () => {
      try {
        const periods = await getReviewPeriods();
        const list = Array.isArray(periods) ? periods.filter((p) => String(p.empresa_id) === String(companyId)) : [];
        if (list.length > 0) {
          // Usa o período mais recente (compatível com a tela de Revisão)
          const pid = list[0].id;
          const [items, delegs] = await Promise.all([
            listarSupervisaoRVU({ periodo_id: pid }),
            getReviewDelegations(pid),
          ]);
          // Mantém lista completa para cálculos de depreciação consolidada
          const rawItems = Array.isArray(items) ? items : [];

          // Agrupa todos os itens (principais e incorporações) por número do imobilizado
          const assetGroups = rawItems.reduce((acc, it) => {
             const key = String(it.numero_imobilizado || '');
             if (!acc[key]) acc[key] = [];
             acc[key].push(it);
             return acc;
          }, {});

          // Lista de itens para cálculos de Revisão (Considera TODOS os itens, incluindo incorporações, para bater com a aba Revisados)
          const allReviewItems = rawItems;

          // Lista de itens para cálculos de Depreciação (Considera apenas Ativos Principais para não duplicar contagem de ativos físicos)
          const mainItemsOnly = rawItems.filter((it) => {
            const sub = Number(it.sub_numero);
            return sub === 0;
          });
          
          const delegsArr = Array.isArray(delegs) ? delegs : [];
          
          // Para o gráfico de evolução, usamos todos os itens (como na aba Revisados)
          const totalItems = allReviewItems.length;
          
          const delegatedIds = new Set(delegsArr.map((d) => d.ativo_id));
          const assignedItems = allReviewItems.filter((it) => delegatedIds.has(it.id)).length;
          
          const normalize = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const reviewedList = allReviewItems.filter((i) => {
            const s = normalize(i.status);
            const statusReviewed = (s === 'revisado' || s === 'revisada' || s === 'aprovado' || s === 'concluido');
            const adjusted = Boolean(i.alterado);
            const hasJustification = Boolean(String(i.justificativa || '').trim());
            const hasCondicao = Boolean(String(i.condicao_fisica || '').trim());
            return statusReviewed || adjusted || hasJustification || hasCondicao;
          });
          const reviewedItems = reviewedList.length;
          const reviewedPct = totalItems ? Number(((reviewedItems / totalItems) * 100).toFixed(1)) : 0;
          const adjustedItems = allReviewItems.filter((i) => Boolean(i.alterado)).length;
          
          // Totalmente depreciados:
          // Regra: Ativo Principal (Sub 0) com valor contábil zerado, E a soma das incorporações (mesmo imobilizado) também deve ser zero.
          const fullyDepreciated = mainItemsOnly.filter((mainItem) => {
             const key = String(mainItem.numero_imobilizado || '');
             const group = assetGroups[key] || [];
             // Soma o valor contábil de todo o grupo (Ativo Principal + Incorporações)
             const totalValue = group.reduce((sum, part) => sum + Number(part.valor_contabil || 0), 0);
             // Considera zerado se a soma for menor que 0.01
             return Math.abs(totalValue) < 0.01;
          }).length;
 
          setMetrics({ totalItems, assignedItems, reviewedItems, reviewedPct, fullyDepreciated, adjustedItems });

          const byUser = {};
          delegsArr.forEach((d) => {
            // Conta delegações apenas se referirem a ativos principais (opcional, mas consistente com a visão de "Ativos")
            // Como itemsArr já está filtrado, podemos cruzar IDs se quisermos precisão absoluta, 
            // mas o gráfico de atribuição costuma mostrar carga de trabalho total. 
            // Pelo pedido "padrão para todos os indicadores", vamos filtrar também.
            const isMain = itemsArr.some((it) => it.id === d.ativo_id);
            if (isMain) {
              const name = d.revisor_nome || `ID ${d.revisor_id}`;
              byUser[name] = (byUser[name] || 0) + 1;
            }
          });
          // Se assignedItems (calculado acima) for diferente da soma do gráfico, pode causar confusão.
          // Vamos usar o assignedItems calculado com base nos itens filtrados para consistência.
          const unassigned = Math.max(0, totalItems - assignedItems);
          const series = Object.entries(byUser).map(([name, count]) => ({ name, y: count }));
          series.push({ name: t('dashboard_unassigned'), y: unassigned });
          setChartData(series);

          if (reviewedList.length > 0) {
            let inc = 0, dec = 0, keep = 0;
            reviewedList.forEach((item) => {
              if (!item.alterado) {
                keep += 1;
                return;
              }
              if (!item.data_fim_revisada) {
                keep += 1;
                return;
              }
              const start = new Date(item.data_inicio_depreciacao);
              const endOriginal = new Date(item.data_fim_depreciacao);
              const endRevised = new Date(item.data_fim_revisada);
              const getMonths = (d1, d2) => (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
              const originalMonths = getMonths(start, endOriginal);
              const revisedMonths = getMonths(start, endRevised);

              if (revisedMonths > originalMonths) inc += 1;
              else if (revisedMonths < originalMonths) dec += 1;
              else keep += 1;
            });

            setIncrementChartData([
              { name: t('increment_increase'), y: inc },
              { name: t('increment_decrease'), y: dec },
              { name: t('increment_keep'), y: keep },
            ]);
          } else {
            setIncrementChartData([]);
          }

        } else {
          setChartData([]);
          setIncrementChartData([]);
          setMetrics({ totalItems: 0, assignedItems: 0, reviewedItems: 0, reviewedPct: 0, fullyDepreciated: 0, adjustedItems: 0 });
        }
      } catch (err) {
        console.error(err);
        setChartData([]);
          setIncrementChartData([]);
          setMetrics({ totalItems: 0, assignedItems: 0, reviewedItems: 0, reviewedPct: 0, fullyDepreciated: 0, adjustedItems: 0 });
      }
    };
    init();
  }, [registrationsOnly, companyId]);

  React.useEffect(() => {
    const id = setInterval(() => {
      setRotationIndex((i) => (i + 1) % 3);
    }, 15000);
    return () => clearInterval(id);
  }, []);

  const cards = [
    { title: t('companies_title'), subtitle: t('companies_subtitle'), icon: Building2, action: () => navigate('/companies') },
    { title: t('users_title'), subtitle: t('users_subtitle'), icon: Users2, action: () => navigate('/users') },
    { title: t('collab_title'), subtitle: t('collab_subtitle'), icon: UserCog, action: () => navigate('/employees') },
    { title: t('acc_classes_title'), subtitle: t('acc_classes_subtitle'), icon: Layers, action: () => alert('Em breve') },
    { title: t('acc_groups_title'), subtitle: t('acc_groups_subtitle'), icon: FolderKanban, action: () => alert('Em breve') },
    { title: t('acc_accounts_title'), subtitle: t('acc_accounts_subtitle'), icon: Wallet, action: () => alert('Em breve') },
    { title: t('ug_title'), subtitle: t('ug_subtitle'), icon: Network, action: () => navigate('/ugs') },
    { title: t('cost_centers_title'), subtitle: t('cost_centers_subtitle'), icon: Crosshair, action: () => navigate('/cost-centers') },
    { title: t('asset_species_title'), subtitle: t('asset_species_subtitle'), icon: CalendarDays, action: () => navigate('/asset-species') },
  ];

  const visibleCards = registrationsOnly ? cards : [];

  const shortcutColors = ['blue', 'violet', 'emerald', 'amber', 'rose', 'indigo', 'cyan', 'teal', 'fuchsia'];

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
      { name: t('dashboard_not_adjusted') || 'Não Ajustados', y: notAdjusted },
    ];
  }, [metrics, t]);

  const renderRotatingChart = (slotOffset = 0) => {
    const sequence = ['assignments', 'evolution', 'adjusted', 'increment'];
    const idx = (rotationIndex + slotOffset) % sequence.length;
    const type = sequence[idx];

    if (type === 'assignments') {
      return chartData.length > 0 ? (
        <BarChart data={chartData} title={t('dashboard_chart_title')} horizontal={true} />
      ) : (
        <div className="card h-full flex items-center justify-center p-4">
          <div style={{ color: 'var(--text-tertiary)' }}>{t('dashboard_no_data')}</div>
        </div>
      );
    }
    if (type === 'increment') {
      return incrementChartData.length > 0 ? (
        <BarChart
          data={incrementChartData}
          title={t('dashboard_chart_increment_title')}
          horizontal={true}
          showPercent={true}
        />
      ) : (
        <div className="card h-full flex items-center justify-center p-4">
          <div style={{ color: 'var(--text-tertiary)' }}>{t('dashboard_no_data')}</div>
        </div>
      );
    }
    if (type === 'adjusted') {
      return (
        <Pie3D data={adjustedData} title={t('dashboard_chart_adjusted_title') || 'Itens Ajustados'} />
      );
    }
    return (
      <AreaChart data={evolutionData} title={t('dashboard_chart_evolution_title') || 'Evolução da Revisão'} />
    );
  };

  return (
    <section className="relative">
      {!registrationsOnly && (
        <div className="flex gap-4 mt-2">
          {/* Main content area */}
          <div className={`flex-1 transition-all duration-300 ${filterPanelOpen ? 'mr-0' : 'mr-0'}`}>
            {/* Compact metrics row - responsivo */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-4">
              <MetricCardCompact
                icon={Package}
                label={t('dashboard_metric_total_items')}
                value={metrics.totalItems}
                color="sky"
              />
              <MetricCardCompact
                icon={UserCheck}
                label={t('dashboard_metric_assigned_items')}
                value={metrics.assignedItems}
                color="violet"
              />
              <MetricCardCompact
                icon={CheckCircle2}
                label={t('dashboard_metric_reviewed_items')}
                value={metrics.reviewedItems}
                color="emerald"
              />
              <MetricCardCompact
                icon={Percent}
                label={t('dashboard_metric_reviewed_pct')}
                value={`${metrics.reviewedPct}%`}
                color="amber"
              />
              <MetricCardCompact
                icon={AlertTriangle}
                label={t('dashboard_metric_fully_depreciated')}
                value={metrics.fullyDepreciated}
                color="rose"
              />
            </div>

            {/* Charts - full height */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ minHeight: 'calc(100vh - 240px)' }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`left-${rotationIndex}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.35 }}
                  className="h-full"
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
                  className="h-full"
                >
                  {renderRotatingChart(1)}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Collapsible filter panel on the right */}
          <div className={`transition-all duration-300 ease-in-out ${filterPanelOpen ? 'w-72' : 'w-10'}`}>
            <div className="sticky top-4">
              {filterPanelOpen ? (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="card-elevated"
                >
                  <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-primary)' }}>
                    <div className="flex items-center gap-2">
                      <Filter size={18} style={{ color: 'var(--text-muted)' }} />
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Filtros</span>
                    </div>
                    <button
                      onClick={() => setFilterPanelOpen(false)}
                      className="btn btn-ghost p-1"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Empresa
                      </label>
                      <select
                        className="select"
                        value={companyId}
                        onChange={(e) => setCompanyId(e.target.value)}
                      >
                        {companies.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <button
                  onClick={() => setFilterPanelOpen(true)}
                  className="card-elevated w-10 h-10 flex items-center justify-center hover:shadow-lg transition-shadow"
                  title="Abrir filtros"
                >
                  <ChevronLeft size={18} style={{ color: 'var(--text-muted)' }} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {visibleCards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 mt-4">
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

function MetricCardCompact({ icon: Icon, label, value, color = 'default' }) {
  const iconColors = {
    default: 'var(--text-muted)',
    sky: '#0ea5e9',
    violet: '#8b5cf6',
    emerald: '#10b981',
    amber: '#f59e0b',
    rose: '#f43f5e',
  };

  return (
    <div className="metric-card card-hover">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} style={{ color: iconColors[color] || iconColors.default }} />
        <span className="metric-label truncate text-xs">{label}</span>
      </div>
      <div className="metric-value text-xl">{value}</div>
    </div>
  );
}
