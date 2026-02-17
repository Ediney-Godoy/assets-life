import React, { useEffect, useMemo, useState } from 'react';
import { Filter, Search, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getCompanies, getManagementUnits, getAccountingClasses, getUsers, getReviewPeriods, getRelatoriosResumo, getRelatoriosExcel, getRelatoriosPdf, listRelatoriosLog } from '../apiClient';

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

function deltaVidaUtil(aAtual, mAtual, aNova, mNova) {
  const totalAtual = Number(aAtual || 0) * 12 + Number(mAtual || 0);
  const totalNova = Number(aNova || 0) * 12 + Number(mNova || 0);
  const diff = totalNova - totalAtual;
  const sign = diff === 0 ? 0 : diff > 0 ? 1 : -1;
  const abs = Math.abs(diff);
  return { meses: diff, sign, abs, anos: Math.floor(abs / 12), mesesResto: abs % 12 };
}

export default function RelatoriosRVUView() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({ empresa_id: '', periodo_id: '', periodo_inicio: '', periodo_fim: '', status: 'Todos' });
  const [dynamicFilters, setDynamicFilters] = useState({ centro_custo: '', valor_min: '', valor_max: '', ug: '', classe: '', revisor: '' });
  const [filterType, setFilterType] = useState('todos');
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [query, setQuery] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadingGen, setLoadingGen] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [ugs, setUgs] = useState([]);
  const [classes, setClasses] = useState([]);
  const [revisores, setRevisores] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [logs, setLogs] = useState([]);

  const periodoSelecionado = useMemo(() => {
    const id = String(filters.periodo_id || '').trim();
    if (!id) return null;
    return periodos.find((p) => String(p.id) === id) || null;
  }, [filters.periodo_id, periodos]);

  const responsavelPeriodo = useMemo(() => {
    if (!periodoSelecionado) return '';
    const r = revisores.find(u => String(u.id) === String(periodoSelecionado.responsavel_id));
    return r ? (r.nome_completo || r.name) : '—';
  }, [periodoSelecionado, revisores]);

  const periodosVisiveis = useMemo(() => {
    let list = Array.isArray(periodos) ? periodos : [];
    if (filters.empresa_id) {
      list = list.filter((p) => String(p.empresa_id || '') === String(filters.empresa_id));
    }
    return list;
  }, [periodos, filters.empresa_id]);

  useEffect(() => {
    const loadBase = async () => {
      setLoading(true);
      setError(null);
      try {
        const [emp, ug, cls, rev, per] = await Promise.all([
          getCompanies(),
          getManagementUnits(),
          getAccountingClasses ? getAccountingClasses() : Promise.resolve([]),
          getUsers(filters.empresa_id || undefined, filters.periodo_id || undefined),
          getReviewPeriods ? getReviewPeriods() : Promise.resolve([]),
        ]);

        const currentCompanyId = localStorage.getItem('assetlife_empresa');
        let finalCompanies = emp || [];
        
        if (currentCompanyId) {
          // Filtra para exibir apenas a empresa logada/selecionada
          finalCompanies = finalCompanies.filter(c => String(c.id) === String(currentCompanyId));
          setFilters(f => ({ ...f, empresa_id: currentCompanyId }));
        }

        setCompanies(finalCompanies);
        setUgs(ug || []);
        setClasses(cls || []);
        setRevisores(rev || []);
        setPeriodos(per || []);

        // Auto-selecionar primeiro período aberto
        const activePeriod = (per || []).find(p => p.status === 'Aberto');
        if (activePeriod) {
          setFilters(f => ({ ...f, periodo_id: activePeriod.id }));
        }
      } catch (err) {
        setError(err.message || 'Erro ao carregar base');
      } finally {
        setLoading(false);
      }
    };
    loadBase();
    refreshLogs();
  }, []);

  const refreshLogs = async () => {
    try {
      const res = await listRelatoriosLog();
      setLogs(res || []);
    } catch {}
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await getUsers(filters.empresa_id || undefined, filters.periodo_id || undefined);
        if (!active) return;
        setRevisores(list || []);
      } catch {
        if (!active) return;
        setRevisores([]);
      }
    })();
    return () => { active = false; };
  }, [filters.empresa_id, filters.periodo_id]);

  useEffect(() => {
    if (filters.periodo_id) {
      applyFilters();
    }
  }, [filters.periodo_id, filters.status, filters.empresa_id]);

  const applyFilters = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        empresa_id: filters.empresa_id || undefined,
        periodo_id: filters.periodo_id || undefined,
        periodo_inicio: filters.periodo_inicio || undefined,
        periodo_fim: filters.periodo_fim || undefined,
        status: filters.status === 'Todos' ? undefined : filters.status,
      };
      const data = await getRelatoriosResumo(params);
      setRows(data || []);
    } catch (err) {
      setError(err.message || 'Erro ao aplicar filtros');
    } finally {
      setLoading(false);
    }
  };

  const onGenerateExcel = async () => {
    setLoadingGen(true);
    setSuccessMsg(null);
    try {
      const params = {
        ...filters,
        status: filters.status === 'Todos' ? undefined : filters.status,
        ug_id: dynamicFilters.ug || undefined,
        classe: dynamicFilters.classe || undefined,
        revisor: dynamicFilters.revisor || undefined,
        centro_custo: dynamicFilters.centro_custo || undefined,
        valor_min: dynamicFilters.valor_min || undefined,
        valor_max: dynamicFilters.valor_max || undefined,
      };
      const blob = await getRelatoriosExcel(params);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Relatorio_RVU.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setSuccessMsg('Excel gerado com sucesso.');
      refreshLogs();
    } catch (err) {
      setError(err.message || 'Falha ao gerar Excel');
    } finally {
      setLoadingGen(false);
    }
  };

  const onGeneratePdf = async () => {
    setLoadingGen(true);
    setSuccessMsg(null);
    try {
      const params = {
        ...filters,
        status: filters.status === 'Todos' ? undefined : filters.status,
        ug_id: dynamicFilters.ug || undefined,
        classe: dynamicFilters.classe || undefined,
        revisor: dynamicFilters.revisor || undefined,
        centro_custo: dynamicFilters.centro_custo || undefined,
        valor_min: dynamicFilters.valor_min || undefined,
        valor_max: dynamicFilters.valor_max || undefined,
      };
      const blob = await getRelatoriosPdf(params);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Laudo_RVU.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setSuccessMsg('PDF gerado com sucesso.');
      refreshLogs();
    } catch (err) {
      setError(err.message || 'Falha ao gerar PDF');
    } finally {
      setLoadingGen(false);
    }
  };

  const columns = useMemo(() => ([
    { key: 'numero_imobilizado', header: t('col_asset_number') },
    { key: 'sub_numero', header: t('col_sub_number') },
    { key: 'descricao', header: t('col_description') },
    { key: 'classe', header: t('col_class') },
    { key: 'valor_aquisicao', header: t('col_acquisition_value'), render: (v) => formatCurrencyBRL(v) },
    { key: 'depreciacao_acumulada', header: t('col_accumulated_depreciation'), render: (v) => formatCurrencyBRL(v) },
    { key: 'valor_contabil', header: t('col_book_value'), render: (v) => formatCurrencyBRL(v) },
    { key: 'vida_util_atual', header: t('col_current_useful_life'), render: (_, r) => `${r.vida_util_atual_anos || 0}a ${r.vida_util_atual_meses || 0}m` },
    { key: 'vida_util_revisada', header: t('col_revised_useful_life'), render: (_, r) => `${r.vida_util_revisada_anos || 0}a ${r.vida_util_revisada_meses || 0}m` },
    { key: 'delta', header: t('col_delta_useful_life'), render: (_, r) => {
      const d = deltaVidaUtil(r.vida_util_atual_anos, r.vida_util_atual_meses, r.vida_util_revisada_anos, r.vida_util_revisada_meses);
      const cls = d.sign > 0 ? 'text-green-600' : d.sign < 0 ? 'text-red-600' : 'text-slate-600';
      return <span className={cls}>{`${d.anos}a ${d.mesesResto}m`}</span>;
    } },
    { key: 'data_inicio', header: t('col_start_date'), render: (v) => formatDateBR(v) },
    { key: 'data_fim_atual', header: t('col_current_end_date'), render: (v) => formatDateBR(v) },
    { key: 'data_fim_revisada', header: t('col_revised_end_date'), render: (v) => formatDateBR(v) },
    { key: 'revisor', header: t('reviewer_label') },
    { key: 'status', header: t('status') },
  ]), []);

  const uniqueCCs = useMemo(() => {
    const vals = Array.from(new Set(rows.map((i) => i.centro_custo).filter(Boolean)));
    return vals.sort();
  }, [rows]);

  const uniqueClasses = useMemo(() => {
    // Assuming 'classe' field contains the name
    const vals = Array.from(new Set(rows.map((i) => i.classe).filter(Boolean)));
    return vals.sort();
  }, [rows]);

  const uniqueRevisores = useMemo(() => {
    // Assuming 'revisor' field contains the name
    const vals = Array.from(new Set(rows.map((i) => i.revisor).filter(Boolean)));
    return vals.sort();
  }, [rows]);

  // Ordena para priorizar itens com alteração discrepante (>20% da vida útil atual)
  const sortedRows = useMemo(() => {
    let res = rows;

    if (query) {
      const q = query.toLowerCase();
      res = res.filter(i => 
        String(i.numero_imobilizado || '').toLowerCase().includes(q) ||
        String(i.descricao || '').toLowerCase().includes(q)
      );
    }

    // Client-side filtering for dynamic fields not handled by API
    if (dynamicFilters.centro_custo) {
      const f = dynamicFilters.centro_custo.toLowerCase();
      res = res.filter(i => String(i.centro_custo || '').toLowerCase() === f);
    }
    if (dynamicFilters.valor_min) {
      res = res.filter(i => Number(i.valor_contabil || 0) >= Number(dynamicFilters.valor_min));
    }
    if (dynamicFilters.valor_max) {
      res = res.filter(i => Number(i.valor_contabil || 0) <= Number(dynamicFilters.valor_max));
    }
    if (dynamicFilters.ug) {
       // If ug filter is ID based but rows have names? Usually summary has formatted strings.
       // Assuming user selects from dynamic dropdown which uses 'uniqueUGs' or global UGs?
       // Let's assume dynamicFilters.ug holds the ID if we use the global list, or name if we use derived.
       // The UI below uses 'ugs' (global). Let's stick to global UGs for dropdown but filter locally.
       // Check if row has ug_id. Usually summary rows might not have all IDs.
       // If row has only 'unidade_gerencial' name, we must match name.
       // If dynamicFilters.ug is ID, we need to find the name or row must have ug_id.
       // Safest: Filter by ID if available, else name.
       // Actually, getRelatoriosResumo might return ug_id.
       // If not, we should rely on what we have. 
       // For now, let's assume rows have 'ug_id'.
       if (res.length > 0 && 'ug_id' in res[0]) {
          res = res.filter(i => String(i.ug_id) === String(dynamicFilters.ug));
       }
    }
    if (dynamicFilters.classe) {
       // Using derived uniqueClasses (names)
       res = res.filter(i => String(i.classe || '') === String(dynamicFilters.classe));
    }
    if (dynamicFilters.revisor) {
       // Using derived uniqueRevisores (names)
       res = res.filter(i => String(i.revisor || '') === String(dynamicFilters.revisor));
    }

    const score = (r) => {
      const totalAtual = Number(r.vida_util_atual_anos || 0) * 12 + Number(r.vida_util_atual_meses || 0);
      const d = deltaVidaUtil(r.vida_util_atual_anos, r.vida_util_atual_meses, r.vida_util_revisada_anos, r.vida_util_revisada_meses);
      const ratio = totalAtual > 0 ? Math.abs(d.meses) / totalAtual : 0;
      const highlighted = ratio > 0.2 ? 1 : 0;
      return highlighted * 1000 + ratio;
    };
    return [...res].sort((a, b) => {
      const diff = score(b) - score(a);
      if (diff !== 0) return diff;
      return 0;
    });
  }, [rows, dynamicFilters, query]);

  return (
    <div className="p-4">
      <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-3">{t('useful_life_report_title')}</div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-950 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-5 mb-6 relative">
        <button
          className="absolute top-4 right-4 inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors z-10"
          onClick={() => setFiltersExpanded(!filtersExpanded)}
          title={filtersExpanded ? "Ocultar filtros" : "Mostrar filtros"}
        >
          {filtersExpanded ? <Filter size={16} className="rotate-180" /> : <Filter size={16} />}
        </button>

        <div className={`transition-all duration-300 overflow-hidden ${filtersExpanded ? 'opacity-100' : 'max-h-0 opacity-0'}`}>
        
        {/* Linha Principal */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{t('company_label')}</label>
            <select 
              className="w-full h-10 px-3 rounded-md border bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-400 focus:dark:bg-slate-900" 
              value={filters.empresa_id} 
              onChange={(e) => setFilters((f) => ({ ...f, empresa_id: e.target.value }))}
              disabled={!!localStorage.getItem('assetlife_empresa')}
            >
              {!localStorage.getItem('assetlife_empresa') && <option value="">{t('all')}</option>}
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Período</label>
            <select 
              className="w-full h-10 px-3 rounded-md border bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-400 focus:dark:bg-slate-900" 
              value={filters.periodo_id} 
              onChange={(e) => setFilters((f) => ({ ...f, periodo_id: e.target.value }))}
            >
              <option value="">{t('all')}</option>
              {periodosVisiveis.map((p) => <option key={p.id} value={p.id}>{p.descricao}</option>)}
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Responsável</label>
            <input 
              type="text" 
              className="w-full h-10 px-3 rounded-md border bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300" 
              value={responsavelPeriodo} 
              readOnly 
              title="Responsável pelo Período"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{t('status')}</label>
            <select 
              className="w-full h-10 px-3 rounded-md border bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-400 focus:dark:bg-slate-900" 
              value={filters.status} 
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="Todos">{t('all')}</option>
              <option value="Revisado">{t('status_reviewed')}</option>
              <option value="Aprovado">{t('status_approved')}</option>
              <option value="Pendente">{t('status_pending')}</option>
              <option value="Revertido">Revertido</option>
            </select>
          </div>
          <div className="md:col-span-1">
             {/* Espaço reservado ou removido, pois Revisor foi para Filtro Avançado */}
          </div>
        </div>

        {/* Linha Secundária (Filtro Avançado) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 items-end">
           <div className="md:col-span-3">
             <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Filtro Avançado</label>
            <select 
              className="w-full h-10 px-3 rounded-md border bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-400 focus:dark:bg-slate-900" 
               value={filterType} 
               onChange={(e) => {
                 const t = e.target.value;
                 setFilterType(t);
                 setDynamicFilters({ centro_custo: '', valor_min: '', valor_max: '', ug: '', classe: '', revisor: '' });
               }}
             >
               <option value="todos">Nenhum</option>
               <option value="ug">Unidade Gerencial</option>
               <option value="classe">Classe Contábil</option>
               <option value="centro_custo">Centro de Custos</option>
               <option value="revisor">Revisor</option>
               <option value="valor">Valor Contábil</option>
             </select>
           </div>

           <div className="md:col-span-9">
             {filterType === 'ug' && (
              <select 
                className="w-full h-10 px-3 rounded-md border bg-white border-slate-200 text-slate-800 transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" 
                 value={dynamicFilters.ug} 
                 onChange={(e) => setDynamicFilters(d => ({ ...d, ug: e.target.value }))}
               >
                 <option value="">Todas</option>
                 {ugs.map((g) => <option key={g.id} value={g.id}>{g.codigo} - {g.nome}</option>)}
               </select>
             )}
             {filterType === 'classe' && (
             <select 
               className="w-full h-10 px-3 rounded-md border bg-white border-slate-200 text-slate-800 transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" 
                value={dynamicFilters.classe} 
                onChange={(e) => setDynamicFilters(d => ({ ...d, classe: e.target.value }))}
              >
                <option value="">Todas</option>
                {uniqueClasses.map((cl) => {
                  const clsObj = classes.find(c => String(c.codigo) === String(cl));
                  const label = clsObj ? `${clsObj.codigo} - ${clsObj.descricao}` : cl;
                  return <option key={cl} value={cl}>{label}</option>;
                })}
              </select>
            )}
             {filterType === 'centro_custo' && (
              <select 
                className="w-full h-10 px-3 rounded-md border bg-white border-slate-200 text-slate-800 transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" 
                 value={dynamicFilters.centro_custo} 
                 onChange={(e) => setDynamicFilters(d => ({ ...d, centro_custo: e.target.value }))}
               >
                 <option value="">Todos</option>
                 {uniqueCCs.map((cc) => <option key={cc} value={cc}>{cc}</option>)}
               </select>
             )}
             {filterType === 'revisor' && (
              <select 
                className="w-full h-10 px-3 rounded-md border bg-white border-slate-200 text-slate-800 transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" 
                 value={dynamicFilters.revisor} 
                 onChange={(e) => setDynamicFilters(d => ({ ...d, revisor: e.target.value }))}
               >
                 <option value="">Todos</option>
                 {uniqueRevisores.map((r) => <option key={r} value={r}>{r}</option>)}
               </select>
             )}
             {filterType === 'valor' && (
               <div className="flex items-center space-x-2">
                <input 
                  type="number" 
                  placeholder="Min" 
                  className="w-full h-10 px-3 rounded-md border bg-white border-slate-200 text-slate-800 transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-400" 
                   value={dynamicFilters.valor_min} 
                   onChange={(e) => setDynamicFilters(d => ({ ...d, valor_min: e.target.value }))} 
                 />
                 <span className="text-slate-400">-</span>
                <input 
                  type="number" 
                  placeholder="Max" 
                  className="w-full h-10 px-3 rounded-md border bg-white border-slate-200 text-slate-800 transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-400" 
                   value={dynamicFilters.valor_max} 
                   onChange={(e) => setDynamicFilters(d => ({ ...d, valor_max: e.target.value }))} 
                 />
               </div>
             )}
           </div>
        </div>

        {/* Linha de Busca e Ações */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="w-full md:w-1/2">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Busca rápida por descrição ou Nº do imobilizado..." 
                  className="w-full h-10 pl-10 pr-4 rounded-md border bg-white border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
             </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={applyFilters}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow-sm transition-colors flex items-center h-10"
            >
              <Filter size={18} className="mr-2" />
              Filtrar
            </button>
             <button
              type="button"
              onClick={onGeneratePdf}
              disabled={loadingGen}
              className="w-10 h-10 flex items-center justify-center rounded border bg-white border-slate-300 hover:bg-slate-50 transition-colors"
              title={t('generate_pdf')}
            >
              <img src="/Pdf.svg" alt="PDF" className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onGenerateExcel}
              disabled={loadingGen}
              className="w-10 h-10 flex items-center justify-center rounded border bg-white border-slate-300 hover:bg-slate-50 transition-colors"
              title={t('export_excel')}
            >
              <img src="/Excel.svg" alt="Excel" className="w-5 h-5" />
            </button>
             <button
              type="button"
              onClick={refreshLogs}
              className="w-10 h-10 flex items-center justify-center rounded border bg-white border-slate-300 hover:bg-slate-50 transition-colors text-slate-600"
              title={t('reports_history')}
            >
              <Clock size={18} />
            </button>
          </div>
        </div>
        
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4 mb-4">
        {loading && <div className="text-slate-600">{t('loading')}</div>}
        {error && <div className="text-red-600 mb-2">{error}</div>}
        {!loading && !error && (
          <div className="overflow-auto">
            <table className="min-w-full text-sm text-slate-800 dark:text-slate-200">
              <thead>
                <tr className="text-left border-b">
                  {columns.map((c) => <th key={c.key} className="p-2 font-semibold text-slate-900 dark:text-slate-100">{c.header}</th>)}
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((r, idx) => (
                  <tr key={idx} className="border-b hover:bg-slate-50 dark:hover:bg-slate-900">
                    {columns.map((c) => (
                      <td key={c.key} className="p-2 text-slate-800 dark:text-slate-200">{c.render ? c.render(r[c.key], r) : (r[c.key] ?? '—')}</td>
                    ))}
                  </tr>
                ))}
                {sortedRows.length === 0 && (
                  <tr><td className="p-2 text-slate-600" colSpan={columns.length}>{t('no_rows_for_filters')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>



      {successMsg && <div className="text-green-700 mb-4">{successMsg}</div>}

      {/* Histórico */}
      <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="text-lg font-semibold mb-2">{t('reports_history')}</div>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="p-2">{t('date_label')}</th>
                <th className="p-2">{t('user_label')}</th>
                <th className="p-2">{t('company_label')}</th>
                <th className="p-2">{t('type_label')}</th>
                <th className="p-2">{t('parameters_label')}</th>
                <th className="p-2">{t('link_label')}</th>
              </tr>
            </thead>
            <tbody>
              {(logs || []).map((l) => (
                <tr key={l.id} className="border-b">
                  <td className="p-2">{formatDateBR(l.data_emissao)}</td>
                  <td className="p-2">{l.usuario?.nome_completo || l.usuario_id}</td>
                  <td className="p-2">{l.empresa?.name || l.empresa_id}</td>
                  <td className="p-2">{l.tipo_arquivo}</td>
                  <td className="p-2"><code className="text-xs">{l.parametros_usados}</code></td>
                  <td className="p-2"><a className="text-blue-600 underline" href={l.caminho_arquivo} target="_blank" rel="noreferrer">{t('open')}</a></td>
                </tr>
              ))}
              {(logs || []).length === 0 && (
                <tr><td className="p-2 text-slate-600" colSpan={6}>{t('no_reports_generated')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
