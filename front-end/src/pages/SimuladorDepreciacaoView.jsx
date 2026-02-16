import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter, BarChart3, FileDown, FileText, ChevronDown } from 'lucide-react';
import {
  getCompanies,
  getManagementUnits,
  getAccountingClasses,
  getCostCenters,
  getReviewPeriods,
  simularDepreciacao,
  simularDepreciacaoExcel,
  simularDepreciacaoPdf,
} from '../apiClient';

function formatCurrencyBRL(value) {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
  } catch {
    return String(value ?? '—');
  }
}

function formatDateBR(value) {
  if (!value) return '';
  try {
    const d = new Date(value);
    return d.toLocaleDateString('pt-BR');
  } catch {
    return String(value);
  }
}

export default function SimuladorDepreciacaoView() {
  const { t } = useTranslation();

  const [companies, setCompanies] = useState([]);
  const [ugs, setUgs] = useState([]);
  const [classes, setClasses] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [periodos, setPeriodos] = useState([]);

  const [filters, setFilters] = useState({
    empresa_id: '',
    periodo_id: '',
    status_revisao: 'Todos',
    classe_id: '',
    ug_id: '',
    centro_custo: '',
  });

  const [loadingBase, setLoadingBase] = useState(false);
  const [loadingSim, setLoadingSim] = useState(false);
  const [loadingExport, setLoadingExport] = useState(false);
  const [error, setError] = useState(null);

  const [analitico, setAnalitico] = useState([]);
  const [sintetico, setSintetico] = useState([]);
  const [aviso, setAviso] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('sintetico');
  const [showInfo, setShowInfo] = useState(false);

  const topScrollRef = useRef(null);
  const tableScrollRef = useRef(null);

  const periodosVisiveis = useMemo(() => {
    let list = Array.isArray(periodos) ? periodos : [];
    if (filters.empresa_id) {
      list = list.filter((p) => String(p.empresa_id || '') === String(filters.empresa_id));
    }
    return list;
  }, [periodos, filters.empresa_id]);

  const periodoSelecionado = useMemo(() => {
    const id = String(filters.periodo_id || '').trim();
    if (!id) return null;
    return periodosVisiveis.find((p) => String(p.id) === id) || null;
  }, [filters.periodo_id, periodosVisiveis]);

  useEffect(() => {
    const loadBase = async () => {
      setLoadingBase(true);
      setError(null);
      try {
        const [emp, ug, cls, ccs, per] = await Promise.all([
          getCompanies(),
          getManagementUnits(),
          getAccountingClasses ? getAccountingClasses() : Promise.resolve([]),
          getCostCenters ? getCostCenters() : Promise.resolve([]),
          getReviewPeriods ? getReviewPeriods() : Promise.resolve([]),
        ]);

        const currentCompanyId = localStorage.getItem('assetlife_empresa');
        let finalCompanies = emp || [];

        if (currentCompanyId) {
          finalCompanies = finalCompanies.filter((c) => String(c.id) === String(currentCompanyId));
        }

        setCompanies(finalCompanies);
        setUgs(ug || []);
        setClasses(cls || []);
        setCostCenters(ccs || []);
        setPeriodos(per || []);

        if (currentCompanyId) {
          setFilters((f) => ({ ...f, empresa_id: String(currentCompanyId) }));
          const activePeriod = (per || []).find(
            (p) =>
              p.status === 'Aberto' &&
              String(p.empresa_id || '') === String(currentCompanyId)
          );
          if (activePeriod) {
            setFilters((f) => ({ ...f, empresa_id: String(currentCompanyId), periodo_id: String(activePeriod.id) }));
          }
        } else {
          const activePeriod = (per || []).find((p) => p.status === 'Aberto');
          if (activePeriod) {
            setFilters((f) => ({ ...f, periodo_id: String(activePeriod.id) }));
          }
        }
      } catch (err) {
        setError(err.message || 'Erro ao carregar dados da simulação');
      } finally {
        setLoadingBase(false);
      }
    };
    loadBase();
  }, []);

  const handleFilterChange = (field, value) => {
    setFilters((f) => ({ ...f, [field]: value }));
  };

  const canSimulate = useMemo(() => {
    return (
      String(filters.empresa_id || '').trim() !== '' &&
      String(filters.periodo_id || '').trim() !== ''
    );
  }, [filters.empresa_id, filters.periodo_id]);

  const handleSimulate = async () => {
    if (!canSimulate || !filters.empresa_id) return;
    const periodo = periodoSelecionado;
    if (!periodo) return;
    const periodoInicio = periodo.data_inicio_nova_vida_util || periodo.data_abertura;
    const periodoFim = periodo.data_fechamento_prevista || periodoInicio;
    setLoadingSim(true);
    setError(null);
    try {
      const payload = {
        empresa_id: Number(filters.empresa_id),
        periodo_inicio: periodoInicio,
        periodo_fim: periodoFim,
        status_revisao: filters.status_revisao || 'Todos',
        classe_id: filters.classe_id || null,
        ug_id: filters.ug_id ? Number(filters.ug_id) : null,
        centro_custo: filters.centro_custo || null,
      };
      const resp = await simularDepreciacao(payload);

      const classeFilter = String(filters.classe_id || '').trim();
      let analiticoData = resp.analitico || [];
      let sinteticoData = resp.sintetico || [];

      if (classeFilter) {
        analiticoData = analiticoData.filter(
          (row) => String(row.classe || '') === classeFilter
        );
        sinteticoData = sinteticoData.filter(
          (row) => String(row.classe || '') === classeFilter
        );
      }

      setAnalitico(analiticoData);
      setSintetico(sinteticoData);
      setAviso(resp.aviso || '');
    } catch (err) {
      setError(err.message || 'Falha ao executar simulação');
      setAnalitico([]);
      setSintetico([]);
      setAviso('');
    } finally {
      setLoadingSim(false);
    }
  };

  const handleExport = async (type) => {
    if (!canSimulate || !filters.empresa_id) return;
    const periodo = periodoSelecionado;
    if (!periodo) return;
    const periodoInicio = periodo.data_inicio_nova_vida_util || periodo.data_abertura;
    const periodoFim = periodo.data_fechamento_prevista || periodoInicio;
    setLoadingExport(true);
    setError(null);
    try {
      const params = {
        empresa_id: Number(filters.empresa_id),
        periodo_inicio: periodoInicio,
        periodo_fim: periodoFim,
        status_revisao: filters.status_revisao || undefined,
        classe_id: filters.classe_id || undefined,
        ug_id: filters.ug_id ? Number(filters.ug_id) : undefined,
        centro_custo: filters.centro_custo || undefined,
      };
      let blob;
      let filename;
      if (type === 'excel') {
        blob = await simularDepreciacaoExcel(params);
        filename = 'Simulador_Depreciacao.xlsx';
      } else {
        blob = await simularDepreciacaoPdf(params);
        filename = 'Simulador_Depreciacao.pdf';
      }
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      setError(err.message || 'Falha ao exportar simulação');
    } finally {
      setLoadingExport(false);
    }
  };

  const analyticColumns = useMemo(
    () => [
      { key: 'numero_imobilizado', header: 'Imobilizado' },
      { key: 'sub_numero', header: 'Sub. Nº' },
      { key: 'data_incorporacao', header: 'Data de Incorporação', render: (v) => formatDateBR(v) },
      { key: 'descricao', header: 'Descrição' },
      {
        key: 'classe',
        header: 'Classe contábil',
        render: (_, r) => (r.classe_descricao ? `${r.classe} - ${r.classe_descricao}` : r.classe),
      },
      {
        key: 'vida_util_original',
        header: 'Vida Útil (original)',
        render: (_, r) => `${r.vida_util_original_anos || 0}a ${r.vida_util_original_meses || 0}m`,
      },
      { key: 'data_fim_original', header: 'Data Fim Depreciação (original)', render: (v) => formatDateBR(v) },
      {
        key: 'depreciacao_original_periodo',
        header: 'Depreciação Original no Período',
        render: (v) => formatCurrencyBRL(v),
      },
      {
        key: 'vida_util_revisada',
        header: 'Nova Vida Útil',
        render: (_, r) => `${r.vida_util_revisada_anos || 0}a ${r.vida_util_revisada_meses || 0}m`,
      },
      { key: 'data_fim_revisada', header: 'Nova Data Fim Depreciação', render: (v) => formatDateBR(v) },
      {
        key: 'depreciacao_revisada_periodo',
        header: 'Nova Depreciação no Período',
        render: (v) => formatCurrencyBRL(v),
      },
      {
        key: 'diferenca_valor',
        header: 'Diferença Depreciação (R$)',
        render: (v) => formatCurrencyBRL(v),
      },
      {
        key: 'diferenca_percentual',
        header: 'Diferença Depreciação (%)',
        render: (v) => `${Number(v || 0).toFixed(2)}%`,
      },
      {
        key: 'status_ajuste',
        header: 'Ajuste',
        render: (v) => v || 'Sem ajuste',
      },
    ],
    []
  );

  const analyticRowsDecorated = useMemo(() => {
    return (analitico || []).map((row) => {
      const originalTotal = Number(row.vida_util_original_anos || 0) * 12 + Number(row.vida_util_original_meses || 0);
      const revisedTotal = Number(row.vida_util_revisada_anos || 0) * 12 + Number(row.vida_util_revisada_meses || 0);
      const diff = revisedTotal - originalTotal;
      let trend = 0;
      if (diff > 0) trend = 1;
      if (diff < 0) trend = -1;
      return { ...row, _trend: trend };
    });
  }, [analitico]);

  useEffect(() => {
    const topEl = topScrollRef.current;
    const tableEl = tableScrollRef.current;
    if (!topEl || !tableEl) return;

    const syncFromTop = () => {
      tableEl.scrollLeft = topEl.scrollLeft;
    };
    const syncFromTable = () => {
      topEl.scrollLeft = tableEl.scrollLeft;
    };

    topEl.addEventListener('scroll', syncFromTop);
    tableEl.addEventListener('scroll', syncFromTable);

    return () => {
      topEl.removeEventListener('scroll', syncFromTop);
      tableEl.removeEventListener('scroll', syncFromTable);
    };
  }, [analyticRowsDecorated.length]);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between px-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Simulador de Depreciação</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Simulação baseada nos dados da revisão. Nenhum dado contábil foi alterado.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSimulate}
            disabled={!canSimulate || loadingSim || loadingBase}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 text-white text-sm font-medium shadow-sm hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <BarChart3 size={16} />
            {loadingSim ? 'Simulando…' : 'Simular'}
          </button>
          <button
            type="button"
            onClick={() => handleExport('excel')}
            disabled={!canSimulate || loadingExport || loadingBase}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-blue-600 text-white text-xs font-medium shadow-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <FileDown size={16} />
            Excel
          </button>
          <button
            type="button"
            onClick={() => handleExport('pdf')}
            disabled={!canSimulate || loadingExport || loadingBase}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-rose-600 text-white text-xs font-medium shadow-sm hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <FileText size={16} />
            PDF
          </button>
        </div>
      </div>

      <div className="px-4 mb-4">
        {error && (
          <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 text-rose-800 text-sm px-3 py-2">
            {error}
          </div>
        )}
        {aviso && !error && (
          <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 text-amber-800 text-xs px-3 py-2">
            {aviso}
          </div>
        )}
      </div>

      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-2 text-slate-600 text-sm">
          <div className="flex items-center gap-2">
            <Filter size={16} />
            <span>Filtros da simulação</span>
          </div>
          <button
            type="button"
            onClick={() => setFiltersExpanded((v) => !v)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-50"
          >
            <span>{filtersExpanded ? 'Recolher' : 'Expandir'}</span>
            <ChevronDown
              size={14}
              className={`transition-transform ${filtersExpanded ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
        <div
          className={`bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 transition-all duration-300 overflow-hidden ${
            filtersExpanded ? 'opacity-100 max-h-[500px]' : 'opacity-0 max-h-0'
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4">
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Empresa
              </label>
              <select
                className="w-full h-10 px-3 rounded-md border bg-slate-50 border-slate-200 focus:bg-white transition-colors text-sm"
                value={filters.empresa_id}
                onChange={(e) => handleFilterChange('empresa_id', e.target.value)}
                disabled={loadingBase}
              >
                <option value="">Selecione</option>
                {(companies || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome || c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Período de revisão
              </label>
              <select
                className="w-full h-10 px-3 rounded-md border bg-slate-50 border-slate-200 focus:bg-white transition-colors text-sm"
                value={filters.periodo_id}
                onChange={(e) => handleFilterChange('periodo_id', e.target.value)}
                disabled={loadingBase}
              >
                <option value="">Selecione</option>
                {periodosVisiveis.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.descricao}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Status da revisão
              </label>
              <select
                className="w-full h-10 px-3 rounded-md border bg-slate-50 border-slate-200 focus:bg-white transition-colors text-sm"
                value={filters.status_revisao}
                onChange={(e) => handleFilterChange('status_revisao', e.target.value)}
                disabled={loadingBase}
              >
                <option value="Todos">Todos</option>
                <option value="Revisados">Revisados</option>
                <option value="Não revisados">Não revisados</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Classe contábil
              </label>
              <select
                className="w-full h-10 px-3 rounded-md border bg-slate-50 border-slate-200 focus:bg-white transition-colors text-sm"
                value={filters.classe_id}
                onChange={(e) => handleFilterChange('classe_id', e.target.value)}
                disabled={loadingBase}
              >
                <option value="">Todas</option>
                {(classes || []).map((c) => (
                  <option key={c.id || c.codigo} value={c.codigo}>
                    {c.codigo} - {c.descricao}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Unidade Gerencial
              </label>
              <select
                className="w-full h-10 px-3 rounded-md border bg-slate-50 border-slate-200 focus:bg-white transition-colors text-sm"
                value={filters.ug_id}
                onChange={(e) => handleFilterChange('ug_id', e.target.value)}
                disabled={loadingBase}
              >
                <option value="">Todas</option>
                {(ugs || []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome || u.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Centro de Custos
              </label>
              <select
                className="w-full h-10 px-3 rounded-md border bg-slate-50 border-slate-200 focus:bg-white transition-colors text-sm"
                value={filters.centro_custo}
                onChange={(e) => handleFilterChange('centro_custo', e.target.value)}
                disabled={loadingBase}
              >
                <option value="">Todos</option>
                {(costCenters || []).map((cc) => (
                  <option key={cc.id || cc.codigo} value={cc.codigo || cc.nome}>
                    {cc.codigo ? `${cc.codigo} - ${cc.nome}` : cc.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4 pb-6">
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center">
          <button
            type="button"
            onClick={() => setActiveTab('sintetico')}
            className={`px-4 py-2 text-xs font-medium border-b-2 -mb-px ${
              activeTab === 'sintetico'
                ? 'border-emerald-500 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Simulação por classes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('analitico')}
            className={`px-4 py-2 text-xs font-medium border-b-2 -mb-px ${
              activeTab === 'analitico'
                ? 'border-emerald-500 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Visão analítica
          </button>
          </div>
          <button
            type="button"
            title="Por que a contagem do simulador pode ser menor que a do dashboard?"
            onClick={() => setShowInfo((v) => !v)}
            className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            aria-label="Informações sobre contagem"
          >
            <span className="text-[11px] font-semibold">i</span>
          </button>
        </div>
        {showInfo && (
          <div className="text-xs rounded-md border border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-200 px-3 py-2">
            <p className="mb-1">
              O simulador pode exibir menos itens que o dashboard porque aplica validações contábeis:
            </p>
            <ul className="list-disc ml-5 space-y-1">
              <li>Ignora itens com valor de aquisição ≤ 0.</li>
              <li>Ignora itens sem vida útil original válida (≤ 0 meses).</li>
              <li>Ignora itens sem data de início de depreciação.</li>
              <li>Respeita o filtro de status (Revisados/Não revisados).</li>
            </ul>
            <p className="mt-2">
              Já o dashboard contabiliza todos os itens do período, independentemente dessas validações.
            </p>
          </div>
        )}

        {activeTab === 'sintetico' && (
          <div className="rounded-xl bg-white dark:bg-slate-900 shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Visão Sintética</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Consolidação por classe contábil.</p>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {(sintetico || []).length > 0 ? `${sintetico.length} linhas` : 'Nenhum dado consolidado'}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide whitespace-nowrap">
                      Classe contábil
                    </th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide whitespace-nowrap">
                      Quantidade de ativos
                    </th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide whitespace-nowrap">
                      Depreciação original total
                    </th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide whitespace-nowrap">
                      Depreciação simulada total
                    </th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide whitespace-nowrap">
                      Diferença absoluta
                    </th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide whitespace-nowrap">
                      Diferença percentual
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(!sintetico || sintetico.length === 0) && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-6 text-center text-slate-500 dark:text-slate-400 text-xs border-t border-slate-100 dark:border-slate-800"
                      >
                        {loadingSim || loadingBase ? 'Carregando…' : 'Nenhum resultado consolidado.'}
                      </td>
                    </tr>
                  )}
                  {(sintetico || []).map((row) => {
                    const isTotal = row.classe === 'TOTAL';
                    return (
                      <tr key={row.classe || row.classe_descricao || 'linha'}>
                        <td
                          className={`px-3 py-2 border-t border-slate-100 dark:border-slate-800 whitespace-nowrap text-[11px] ${
                            isTotal ? 'font-semibold' : ''
                          }`}
                        >
                          {isTotal ? 'TOTAL GERAL' : row.classe}
                        </td>
                        <td className="px-3 py-2 border-t border-slate-100 dark:border-slate-800 whitespace-nowrap text-[11px]">
                          {row.quantidade_ativos}
                        </td>
                        <td className="px-3 py-2 border-t border-slate-100 dark:border-slate-800 whitespace-nowrap text-[11px]">
                          {formatCurrencyBRL(row.depreciacao_original_total)}
                        </td>
                        <td className="px-3 py-2 border-t border-slate-100 dark:border-slate-800 whitespace-nowrap text-[11px]">
                          {formatCurrencyBRL(row.depreciacao_revisada_total)}
                        </td>
                        <td className="px-3 py-2 border-t border-slate-100 dark:border-slate-800 whitespace-nowrap text-[11px]">
                          {formatCurrencyBRL(row.diferenca_absoluta)}
                        </td>
                        <td className="px-3 py-2 border-t border-slate-100 dark:border-slate-800 whitespace-nowrap text-[11px]">
                          {`${Number(row.diferenca_percentual || 0).toFixed(2)}%`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'analitico' && (
        <div className="rounded-xl bg-white dark:bg-slate-900 shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[65vh] flex flex-col">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Visão Analítica</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Detalhamento por ativo imobilizado.
              </p>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {analyticRowsDecorated.length > 0 ? `${analyticRowsDecorated.length} itens` : 'Nenhum item simulado'}
            </div>
          </div>
          <div
            ref={topScrollRef}
            className="overflow-x-auto border-b border-slate-100 dark:border-slate-800"
          >
            <div style={{ width: '100%', minWidth: '1200px' }} />
          </div>
          <div ref={tableScrollRef} className="overflow-x-auto overflow-y-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  {analyticColumns.map((col) => (
                    <th
                      key={col.key}
                      className="px-3 py-2 text-left text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide whitespace-nowrap"
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analyticRowsDecorated.length === 0 && (
                  <tr>
                    <td
                      colSpan={analyticColumns.length}
                      className="px-4 py-8 text-center text-slate-500 dark:text-slate-400 text-xs"
                    >
                      {loadingSim || loadingBase ? 'Carregando…' : 'Nenhum resultado para os filtros aplicados.'}
                    </td>
                  </tr>
                )}
                {analyticRowsDecorated.map((row) => {
                  const trendClass =
                    row._trend > 0
                      ? 'bg-emerald-50/70 dark:bg-emerald-900/20'
                      : row._trend < 0
                      ? 'bg-rose-50/70 dark:bg-rose-900/20'
                      : '';
                  return (
                    <tr key={`${row.numero_imobilizado}-${row.sub_numero}`} className={trendClass}>
                      {analyticColumns.map((col) => {
                        const value = row[col.key];
                        const content = col.render ? col.render(value, row) : value;
                        return (
                          <td
                            key={col.key}
                            className="px-3 py-2 border-t border-slate-100 dark:border-slate-800 whitespace-nowrap text-[11px] text-slate-700 dark:text-slate-200"
                          >
                            {content}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full bg-emerald-400" />
                <span>Aumento de vida útil</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full bg-rose-400" />
                <span>Redução de vida útil</span>
              </span>
            </div>
            <span>Ativos sem revisão aparecem como "Sem ajuste".</span>
          </div>
        </div>
        )}
      </div>
    </section>
  );
}
