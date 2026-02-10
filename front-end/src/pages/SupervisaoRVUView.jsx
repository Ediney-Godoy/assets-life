import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getCompanies,
  getManagementUnits,
  getUsers,
  getReviewPeriods,
  listarSupervisaoRVU,
  comentarSupervisaoRVU,
  reverterSupervisaoRVU,
  aprovarSupervisaoRVU,
  historicoSupervisaoRVU,
  listarComentariosRVU,
} from '../apiClient';
import toast from 'react-hot-toast';

export default function SupervisaoRVUView() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [ugs, setUgs] = useState([]);
  const [revisores, setRevisores] = useState([]);
  const [items, setItems] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [hasResponses, setHasResponses] = useState(false);
  const [hist, setHist] = useState([]);
  const [query, setQuery] = useState('');

  const [filters, setFilters] = useState({ empresa_id: '', ug_id: '', revisor_id: '', status: 'Pendente', periodo_id: '' });
  const [dynamicFilters, setDynamicFilters] = useState({ classe: '', centro_custo: '', valor_min: '', valor_max: '' });
  const [filterType, setFilterType] = useState('todos');
  const [filtersExpanded, setFiltersExpanded] = useState(true);

  // Refs para sincronizar scrollbar superior e tabela
  const tableContainerRef = useRef(null);
  const topScrollRef = useRef(null);
  const [tableWidth, setTableWidth] = useState(0);

  // Atualiza largura do spacer quando dados mudam
  useEffect(() => {
    if (tableContainerRef.current) {
      setTableWidth(tableContainerRef.current.scrollWidth);
    }
  }, [items, query, dynamicFilters, filtersExpanded]);

  const handleScrollTable = (e) => {
    if (topScrollRef.current) {
      topScrollRef.current.scrollLeft = e.target.scrollLeft;
    }
  };

  const handleScrollTop = (e) => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollLeft = e.target.scrollLeft;
    }
  };

  const uniqueClasses = useMemo(() => {
    const vals = Array.from(new Set(items.map((i) => i.classe_contabil).filter(Boolean)));
    return vals.sort();
  }, [items]);

  const uniqueCCs = useMemo(() => {
    const vals = Array.from(new Set(items.map((i) => i.centro_custo).filter(Boolean)));
    return vals.sort();
  }, [items]);

  const [drawerItem, setDrawerItem] = useState(null);
  const [showComment, setShowComment] = useState(false);
  const [commentText, setCommentText] = useState('');

  const [showRevert, setShowRevert] = useState(false);
  const [revertReason, setRevertReason] = useState('');

  useEffect(() => {
    const loadBase = async () => {
      setLoading(true);
      try {
        let empresaCtx = '';
        try { empresaCtx = localStorage.getItem('assetlife_empresa') || ''; } catch {}
        const empresaId = filters.empresa_id || empresaCtx || undefined;
        const [emp, ug, rev, per] = await Promise.all([
          getCompanies(),
          getManagementUnits(empresaId),
          getUsers(empresaId),
          getReviewPeriods(),
        ]);
        
        // Restringe lista de empresas se houver contexto
        let finalEmpresas = emp || [];
        if (empresaCtx) {
          finalEmpresas = finalEmpresas.filter(c => String(c.id) === String(empresaCtx));
        }
        setCompanies(finalEmpresas);
        
        // Se houver empresa de contexto, força seleção
        if (empresaCtx && (!filters.empresa_id || String(filters.empresa_id) !== String(empresaCtx))) {
          setFilters(f => ({ ...f, empresa_id: empresaCtx }));
        }

        setUgs(ug || []);
        setRevisores(rev || []);
        setPeriodos(per || []);
      } catch (err) {
        setError(err.message || 'Erro ao carregar base');
      } finally {
        setLoading(false);
      }
    };
    loadBase();
  }, []);

  // Recarrega revisores e UGs quando empresa muda ou período é selecionado
  useEffect(() => {
    const reloadScoped = async () => {
      try {
        const empresaId = filters.empresa_id || undefined;
        const periodoId = filters.periodo_id || undefined;
        
        const [ug, rev] = await Promise.all([
          getManagementUnits(empresaId),
          getUsers(empresaId, periodoId),
        ]);
        setUgs(ug || []);
        setRevisores(rev || []);
      } catch (err) {
        // Mantém silencioso para não interromper a navegação
        console.warn('Falha ao recarregar UGs/Usuários por empresa:', err);
      }
    };
    reloadScoped();
  }, [filters.empresa_id, filters.periodo_id]);

  const aplicarFiltros = async () => {
    setLoading(true);
    setError(null);
    try {
      // Carrega lista principal; qualquer erro aqui é exibido globalmente
      const data = await listarSupervisaoRVU(filters);
      const arrData = Array.isArray(data) ? data : [];
      setItems(arrData);
      // Carrega histórico de forma tolerante (não deve quebrar a página)
      try {
        const h = await historicoSupervisaoRVU({});
        setHist(Array.isArray(h) ? h : []);
      } catch {
        setHist([]);
      }
      // Amostra de comentários para detectar respostas de revisores; falha não afeta a tela
      try {
        const sample = arrData.slice(0, 25);
        const results = await Promise.all(sample.map((it) => listarComentariosRVU(it.id).catch(() => [])));
        const anyResponded = results.some((arr) => (Array.isArray(arr) ? arr : []).some((c) => String(c.status).toLowerCase() === 'respondido'));
        setHasResponses(anyResponded);
      } catch {
        setHasResponses(false);
      }
    } catch (err) {
      setError(err.message || 'Erro ao listar revisões');
    } finally {
      setLoading(false);
    }
  };

  // Evita abrir listagem automaticamente; exige ação do usuário (ou seleção de período)
  // Caso deseje auto-aplicar ao selecionar período, escute mudanças de periodo_id separadamente.

  const filteredItems = useMemo(() => {
    const q = (query || '').trim().toLowerCase();
    const base = q
      ? items.filter((it) =>
          String(it.numero_imobilizado || '').toLowerCase().includes(q) ||
          String(it.descricao || '').toLowerCase().includes(q)
        )
      : items;

    let res = base;

    // Dynamic filters (Client-side)
    if (dynamicFilters.classe) {
      const f = dynamicFilters.classe.toLowerCase();
      res = res.filter(i => String(i.classe_contabil || '').toLowerCase().includes(f));
    }
    if (dynamicFilters.centro_custo) {
      const f = dynamicFilters.centro_custo.toLowerCase();
      res = res.filter(i => String(i.centro_custo || '').toLowerCase().includes(f));
    }
    if (dynamicFilters.valor_min) {
      res = res.filter(i => Number(i.valor_contabil || 0) >= Number(dynamicFilters.valor_min));
    }
    if (dynamicFilters.valor_max) {
      res = res.filter(i => Number(i.valor_contabil || 0) <= Number(dynamicFilters.valor_max));
    }

    const score = (x) => {
      const origem = Number(x.vida_util_atual || 0);
      const delta = Number(x.delta_vida_util || 0);
      const ratio = origem > 0 ? Math.abs(delta) / origem : 0;
      const highlighted = ratio > 0.2 ? 1 : 0; // discrepante (>20%) deve ir para o topo
      return highlighted * 1000 + ratio; // prioriza destacados e, em seguida, maior discrepância
    };

    return [...res].sort((a, b) => {
      const diff = score(b) - score(a);
      if (diff !== 0) return diff;
      return 0;
    });
  }, [items, query, dynamicFilters]);

  const resumo = useMemo(() => {
    const total = items.length;
    const revertidos = items.filter((i) => i.status === 'Revertido').length;
    const diffs = items.map((i) => {
      const origem = i.vida_util_atual || 0;
      const delta = i.delta_vida_util || 0;
      return origem > 0 ? (delta / origem) : 0;
    }).filter((d) => Number.isFinite(d));
    const mediaAlteracao = diffs.length ? (diffs.reduce((a, b) => a + b, 0) / diffs.length) : 0;
    const questionadas = items.filter((i) => {
      const origem = i.vida_util_atual || 0;
      const delta = i.delta_vida_util || 0;
      return origem > 0 && Math.abs(delta) / origem > 0.2;
    }).length;
    return { total, revertidos, mediaAlteracao, percQuestionadas: total ? (questionadas / total) : 0 };
  }, [items]);

  const openActions = async (it) => {
    setDrawerItem(it);
    try {
      const cs = await listarComentariosRVU(it.id);
      setDrawerItem((d) => ({ ...d, comentarios: Array.isArray(cs) ? cs : [] }));
    } catch {}
  };
  const closeDrawer = () => { setDrawerItem(null); setShowComment(false); setShowRevert(false); setCommentText(''); setRevertReason(''); };

  const enviarComentario = async () => {
    if (!commentText.trim()) { toast.error('Comentário obrigatório'); return; }
    try {
      await comentarSupervisaoRVU({ ativo_id: drawerItem.id, supervisor_id: getUserId(), revisor_id: getRevisorId(drawerItem), comentario: commentText.trim(), periodo_id: filters.periodo_id || drawerItem.periodo_id });
      toast.success('Comentário enviado');
      setShowComment(false);
      aplicarFiltros();
    } catch (err) {
      toast.error(err.message || 'Falha ao comentar');
    }
  };

  const confirmarReversao = async () => {
    if (!revertReason.trim()) { toast.error('Justificativa obrigatória'); return; }
    try {
      await reverterSupervisaoRVU({ ativo_id: drawerItem.id, supervisor_id: getUserId(), revisor_id: getRevisorId(drawerItem), motivo_reversao: revertReason.trim(), periodo_id: filters.periodo_id || drawerItem.periodo_id });
      toast.success('Revisão revertida');
      setShowRevert(false);
      aplicarFiltros();
    } catch (err) {
      toast.error(err.message || 'Falha ao reverter');
    }
  };

  const confirmarAprovacao = async () => {
    try {
      await aprovarSupervisaoRVU({ ativo_id: drawerItem.id, supervisor_id: getUserId(), motivo: '', periodo_id: filters.periodo_id || drawerItem.periodo_id });
      toast.success('Revisão aprovada');
      aplicarFiltros();
      closeDrawer();
    } catch (err) {
      toast.error(err.message || 'Falha ao aprovar');
    }
  };

  const getUserId = () => {
    try { return JSON.parse(localStorage.getItem('assetlife_user'))?.id || 0; } catch { return 0; }
  };
  const getRevisorId = (it) => {
    try { return it?.revisor_id || 0; } catch { return 0; }
  };

  const exportarExcel = async () => {
    // Exportação nativa XLSX com os itens filtrados
    const headers = [
      'Nº Imobilizado','Descrição','Classe Contábil','Valor Contábil','Vida Útil Atual','Vida Útil Revisada','Δ Vida Útil (%)','Revisor','Condição Física','Justificativa','Data Revisão','Status','Último comentário'
    ];
    const rows = filteredItems.map((i) => {
      const origem = Number(i.vida_util_atual || 0);
      const delta = Number(i.delta_vida_util || 0);
      const ratio = origem > 0 ? (delta / origem) : 0;
      const pct = `${(ratio * 100).toFixed(1)}%`;
      return [
        i.numero_imobilizado || '',
        i.descricao || '',
        i.classe_contabil || '',
        Number(i.valor_contabil || 0),
        i.vida_util_atual ?? '',
        i.vida_util_revisada ?? '',
        pct,
        i.revisor || '',
        i.condicao_fisica || '',
        i.justificativa || '',
        formatDateBR(i.data_revisao),
        i.status || '',
        i.ultimo_comentario || ''
      ];
    });
    const XLSXLib = await import('xlsx');
    const XLSX = XLSXLib.default || XLSXLib;
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Supervisão RVU');
    XLSX.writeFile(wb, `supervisao_rvu_${Date.now()}.xlsx`);
  };

  const formatDateBR = (d) => {
    if (!d) return '';
    try { const x = new Date(d); return x.toLocaleDateString('pt-BR'); } catch { return String(d); }
  };

  const periodoSelecionado = useMemo(() => {
    const id = String(filters.periodo_id || '').trim();
    if (!id) return null;
    return periodos.find((p) => String(p.id) === id) || null;
  }, [filters.periodo_id, periodos]);

  const responsavelPeriodo = useMemo(() => {
    if (!periodoSelecionado) return '';
    const r = revisores.find(u => String(u.id) === String(periodoSelecionado.responsavel_id));
    return r ? (r.nome_completo || r.name) : 'Não identificado';
  }, [periodoSelecionado, revisores]);

  const periodosVisiveis = useMemo(() => {
    let list = Array.isArray(periodos) ? periodos : [];
    if (filters.empresa_id) {
      list = list.filter((p) => String(p.empresa_id || '') === String(filters.empresa_id));
    }
    if (filters.ug_id) {
      list = list.filter((p) => String(p.ug_id || '') === String(filters.ug_id));
    }
    return list;
  }, [periodos, filters.empresa_id, filters.ug_id]);

  const formatPeriodoLabel = (p) => {
    const base = p.codigo ? String(p.codigo) : (p.descricao ? String(p.descricao) : `Período ${p.id}`);
    const open = formatDateBR(p.data_abertura);
    const closePrev = formatDateBR(p.data_fechamento_prevista);
    const dates = open && closePrev ? ` (${open} → ${closePrev})` : (open ? ` (${open})` : '');
    return `${base}${dates}`;
  };

  const periodoEncerrado = (periodoSelecionado?.status === 'Encerrado');

  return (
    <div className="p-4">
      {hasResponses && (
        <div className="mb-3 px-3 py-2 rounded bg-blue-100 text-blue-900 border border-blue-300">
          ✉️ Há respostas de revisores em itens deste período.
        </div>
      )}
      {periodoEncerrado && (
        <div className="mb-3 px-3 py-2 rounded bg-yellow-100 text-yellow-900 border border-yellow-300">
          ⚠️ Período de revisão encerrado. Alterações e reversões estão bloqueadas.
        </div>
      )}
      <div className="flex items-center justify-between mb-3">
        <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Supervisão RVU</div>
      </div>

      {/* Filtros */}
      <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 mb-4 relative">
        <button
          className="absolute top-2 right-2 inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors z-10"
          onClick={() => setFiltersExpanded(!filtersExpanded)}
          title={filtersExpanded ? "Ocultar filtros" : "Mostrar filtros"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {filtersExpanded ? (
              <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            ) : (
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            )}
          </svg>
        </button>

        <div className={`transition-all duration-300 overflow-hidden ${filtersExpanded ? 'opacity-100' : 'max-h-0 opacity-0'}`}>
        {/* Linha Principal */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
          <div>
            <label className="block text-sm mb-1">Empresa</label>
            <select 
              className="input disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-slate-800" 
              value={filters.empresa_id} 
              onChange={(e) => setFilters((f) => ({ ...f, empresa_id: e.target.value }))}
              disabled={companies.length === 1}
            >
              <option value="">Todas</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Período</label>
            <select 
              className="input" 
              value={filters.periodo_id} 
              onChange={(e) => setFilters((f) => ({ ...f, periodo_id: e.target.value }))}
            >
              <option value="">Todos</option>
              {periodosVisiveis.map((p) => (
                <option key={p.id} value={p.id}>{formatPeriodoLabel(p)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Responsável (Período)</label>
            <input 
              type="text" 
              className="input bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed" 
              value={responsavelPeriodo} 
              readOnly 
              placeholder="-"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Status</label>
            <select className="input" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
              {['Todos','Revisado','Aprovado','Pendente','Revertido'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Filtrar Revisor (Delegado)</label>
            <select className="input" value={filters.revisor_id} onChange={(e) => setFilters((f) => ({ ...f, revisor_id: e.target.value }))}>
              <option value="">Todos</option>
              {revisores.map((r) => <option key={r.id} value={r.id}>{r.nome_completo || r.name}</option>)}
            </select>
          </div>
        </div>

        {/* Filtros Dinâmicos */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Filtros Dinâmicos</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm mb-1">Tipo de Filtro</label>
              <select 
                className="input" 
                value={filterType} 
                onChange={(e) => {
                  const t = e.target.value;
                  setFilterType(t);
                  setDynamicFilters({ classe: '', centro_custo: '', valor_min: '', valor_max: '' });
                  if (t !== 'ug') setFilters(f => ({ ...f, ug_id: '' }));
                }}
              >
                <option value="todos">Todos os itens</option>
                <option value="ug">Unidade Gerencial</option>
                <option value="classe">Classe Contábil</option>
                <option value="centro_custo">Centro de Custos</option>
                <option value="valor">Valor Contábil</option>
              </select>
            </div>

            {filterType === 'ug' && (
              <div>
                <label className="block text-sm mb-1">Unidade Gerencial</label>
                <select className="input" value={filters.ug_id} onChange={(e) => setFilters((f) => ({ ...f, ug_id: e.target.value }))}>
                  <option value="">Todas</option>
                  {ugs.map((g) => <option key={g.id} value={g.id}>{g.codigo} - {g.nome}</option>)}
                </select>
              </div>
            )}

            {filterType === 'classe' && (
              <div>
                <label className="block text-sm mb-1">Classe Contábil</label>
                <select 
                  className="input" 
                  value={dynamicFilters.classe}
                  onChange={(e) => setDynamicFilters(d => ({ ...d, classe: e.target.value }))}
                >
                  <option value="">Todas</option>
                  {uniqueClasses.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}

            {filterType === 'centro_custo' && (
              <div>
                <label className="block text-sm mb-1">Centro de Custos</label>
                <select 
                  className="input" 
                  value={dynamicFilters.centro_custo}
                  onChange={(e) => setDynamicFilters(d => ({ ...d, centro_custo: e.target.value }))}
                >
                  <option value="">Todos</option>
                  {uniqueCCs.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}

            {filterType === 'valor' && (
              <div>
                <label className="block text-sm mb-1">Valor Contábil (Mín/Máx)</label>
                <div className="flex gap-2">
                  <input 
                    type="number"
                    className="input" 
                    placeholder="Min" 
                    value={dynamicFilters.valor_min}
                    onChange={(e) => setDynamicFilters(d => ({ ...d, valor_min: e.target.value }))}
                  />
                  <input 
                    type="number"
                    className="input" 
                    placeholder="Max" 
                    value={dynamicFilters.valor_max}
                    onChange={(e) => setDynamicFilters(d => ({ ...d, valor_max: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          {/* Botão pequeno com ícone de filtro */}
          <button
            className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-indigo-600 text-white shadow hover:bg-indigo-700"
            onClick={aplicarFiltros}
            title="Aplicar Filtros"
            aria-label="Aplicar Filtros"
          >
            {/* Ícone funil (filtro) */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 4h18l-7 8v5l-4 3v-8L3 4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </button>
          <input
            className="input flex-1"
            placeholder="Busca rápida por descrição ou Nº"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') aplicarFiltros(); }}
          />
          {/* Botão pequeno com ícone do Excel */}
          <button
            className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-green-600 text-white shadow hover:bg-green-700"
            onClick={exportarExcel}
            title="Exportar para o Excel"
            aria-label="Exportar para o Excel"
          >
            {/* Ícone estilo Excel */}
            <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              {/* Folha com grid */}
              <rect x="5" y="4" width="12" height="16" rx="2" fill="currentColor" opacity="0.15"/>
              <path d="M9 4v16M14 4v16M5 9h12M5 14h12" stroke="currentColor" strokeWidth="1.6" opacity="0.9"/>
              {/* X (marca Excel) */}
              <path d="M6.8 8.5l3.2 3.2m0-3.2l-3.2 3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        </div>
      </div>

      {/* Cards Resumo com cores leves */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <ResumoCard title="Total revisados" value={resumo.total} tone="green" />
        <ResumoCard title="Total revertidos" value={resumo.revertidos} tone="red" />
        <ResumoCard title="Média Δ vida útil" value={`${(resumo.mediaAlteracao * 100).toFixed(1)}%`} tone="sky" />
        <ResumoCard title="% questionadas" value={`${(resumo.percQuestionadas * 100).toFixed(1)}%`} tone="amber" />
      </div>

      {/* Tabela Principal */}
      {/* Scrollbar Superior Sincronizada */}
      <div 
        ref={topScrollRef}
        onScroll={handleScrollTop}
        className="overflow-x-auto mb-1"
      >
        <div style={{ width: tableWidth, height: '1px' }}></div>
      </div>

      <div 
        ref={tableContainerRef}
        onScroll={handleScrollTable}
        className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto"
      >
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900">
            <tr>
              {['Nº Imobilizado','Descrição','Classe Contábil','Valor Contábil','Vida Útil Atual','Vida Útil Revisada','Δ Vida Útil (%)','Revisor','Condição Física','Justificativa','Data Revisão','Status','💬','Ações'].map((h) => (
                <th key={h} className="text-left p-2 font-medium text-slate-700 dark:text-slate-300">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((i) => {
              const origem = i.vida_util_atual || 0;
              const delta = i.delta_vida_util || 0;
              const discrepante = origem > 0 && Math.abs(delta) / origem > 0.2;
              return (
                <tr key={i.id} className={discrepante ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}>
                  <td className="p-2">{i.numero_imobilizado}</td>
                  <td className="p-2">{i.descricao}</td>
                  <td className="p-2">{i.classe_contabil}</td>
                  <td className="p-2">{Number(i.valor_contabil || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td className="p-2">{i.vida_util_atual}</td>
                  <td className="p-2">{i.vida_util_revisada}</td>
                  {(() => {
                    const ratio = origem > 0 ? (delta / origem) : 0;
                    const pct = `${(ratio * 100).toFixed(1)}%`;
                    return (
                      <td className="p-2"><span className={delta >= 0 ? 'text-green-600' : 'text-red-600'}>{pct}</span></td>
                    );
                  })()}
                  <td className="p-2">{i.revisor}</td>
                  <td className="p-2">{i.condicao_fisica}</td>
                  <td className="p-2">{i.justificativa}</td>
                  <td className="p-2">{formatDateBR(i.data_revisao)}</td>
                  <td className="p-2">{i.status === 'Aprovado' ? '✅ Aprovado' : i.status === 'Revertido' ? '🔄 Revertido' : (i.status || '')}</td>
                  <td className="p-2">{(i.comentarios_count ?? (i.ultimo_comentario ? 1 : 0))}</td>
                  <td className="p-2"><button className="btn" onClick={() => openActions(i)} title="Abrir ações">⚙️</button></td>
                </tr>
              );
            })}
            {filteredItems.length === 0 && (
              <tr><td className="p-2 text-slate-600" colSpan={14}>Nenhum item encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Histórico */}
      <div className="mt-4">
        <div className="text-lg font-semibold mb-2">Histórico de Revisões</div>
        <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                {['Data','Usuário','Ação','Ativo','Vida Útil Original','Vida Útil Revisada','Motivo / Comentário','Status'].map((h) => (
                  <th key={h} className="text-left p-2 font-medium text-slate-700 dark:text-slate-300">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hist.map((h, idx) => (
                <tr key={idx}>
                  <td className="p-2">{formatDateBR(h.data_evento || h.data_reversao)}</td>
                  <td className="p-2">{h.supervisor_id || h.revisor_id}</td>
                  <td className="p-2">{h.acao}</td>
                  <td className="p-2">{h.ativo_id}</td>
                  <td className="p-2">{h.vida_util_anterior ?? ''}</td>
                  <td className="p-2">{h.vida_util_revisada ?? ''}</td>
                  <td className="p-2">{h.motivo_reversao || ''}</td>
                  <td className="p-2">{h.status || ''}</td>
                </tr>
              ))}
              {hist.length === 0 && <tr><td className="p-2 text-slate-600" colSpan={8}>Sem registros.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer de ações */}
      {drawerItem && (
        <div className="fixed inset-0 bg-black/40 flex justify-end" onClick={closeDrawer}>
          <div className="w-full sm:w-[420px] h-full bg-white dark:bg-slate-950 p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold">Ações da Revisão</div>
              <button className="btn" onClick={closeDrawer}>Fechar</button>
            </div>
            <div className="space-y-2">
              <button className="btn w-full" onClick={() => setShowComment(true)}>💬 Adicionar Comentário</button>
              <button className="btn w-full" onClick={() => setShowRevert(true)} disabled={periodoEncerrado}>🔄 Reverter Revisão</button>
              <button className="btn-primary w-full" onClick={confirmarAprovacao} disabled={periodoEncerrado}>✅ Aprovar Revisão</button>
              <div className="text-xs text-slate-500">Última ação: {drawerItem.status}</div>
              {periodoEncerrado && (
                <div className="mt-2 text-xs text-yellow-800">⚠️ Período encerrado: apenas comentários de acompanhamento.</div>
              )}
            </div>

            {/* Modal Comentário */}
            {showComment && (
              <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-3">
                <div className="font-medium mb-2">Adicionar Comentário</div>
                <div className="grid grid-cols-2 gap-2 mb-2 text-sm">
                  <div>Revisor: {drawerItem.revisor || '-'}</div>
                  <div>Data da Revisão: {formatDateBR(drawerItem.data_revisao)}</div>
                  <div>Vida Útil Atual: {drawerItem.vida_util_atual}</div>
                  <div>Vida Útil Revisada: {drawerItem.vida_util_revisada}</div>
                </div>
                <textarea className="input h-28" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder={periodoEncerrado ? "Comentário de acompanhamento" : "Comentário"} />
                <div className="mt-2 flex gap-2">
                  <button className="btn" onClick={() => setShowComment(false)}>Cancelar</button>
                  <button className="btn-primary" onClick={enviarComentario}>Enviar Comentário</button>
                </div>
                <div className="mt-3">
                  <div className="font-medium mb-1">Conversas</div>
                  <div className="space-y-2">
                    {(drawerItem?.comentarios || []).map((c) => (
                      <div key={c.id} className="p-2 rounded border border-slate-200 dark:border-slate-800">
                        <div className="text-xs text-slate-500">{new Date(c.data_comentario).toLocaleString('pt-BR')} • Sup: {c.supervisor_id} → Rev: {c.revisor_id}</div>
                        <div className="text-sm">{c.comentario}</div>
                        {c.resposta && (
                          <div className="mt-1 pl-2 border-l-2 border-slate-300">
                            <div className="text-xs text-slate-500">Resposta ({new Date(c.data_resposta).toLocaleString('pt-BR')} • {c.respondido_por})</div>
                            <div className="text-sm">{c.resposta}</div>
                          </div>
                        )}
                        <div className="text-xs mt-1">Status: {c.status} • Tipo: {c.tipo}</div>
                      </div>
                    ))}
                    {(drawerItem?.comentarios || []).length === 0 && <div className="text-xs text-slate-500">Sem comentários.</div>}
                  </div>
                </div>
              </div>
            )}

            {/* Modal Reversão */}
            {showRevert && (
              <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-3">
                <div className="font-medium mb-2">Reverter Revisão</div>
                <div className="grid grid-cols-2 gap-2 mb-2 text-sm">
                  <div>Vida Útil Original: {drawerItem.vida_util_atual}</div>
                  <div>Vida Útil Revisada: {drawerItem.vida_util_revisada}</div>
                </div>
                <textarea className="input h-28" value={revertReason} onChange={(e) => setRevertReason(e.target.value)} placeholder="Justificativa (obrigatória)" />
                <div className="mt-2 flex gap-2">
                  <button className="btn" onClick={() => setShowRevert(false)}>Cancelar</button>
                  <button className="btn-danger" onClick={confirmarReversao}>Confirmar Reversão</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {loading && <div className="fixed inset-0 pointer-events-none"><div className="absolute top-4 right-4 px-3 py-2 bg-slate-900 text-white rounded">Carregando...</div></div>}
      {error && (items.length === 0) && (
        <div className="mt-2 text-red-600">
          {String(error).includes('Failed to fetch')
            ? 'Falha de conexão com a API. Verifique se o backend está ativo (porta 8000) e se o token/permissões estão válidos.'
            : error}
        </div>
      )}
    </div>
  );
}

function ResumoCard({ title, value, tone = 'slate' }) {
  const toneBg = {
    slate: 'bg-slate-50 border-slate-200',
    green: 'bg-green-50 border-green-200',
    red: 'bg-red-50 border-red-200',
    sky: 'bg-sky-50 border-sky-200',
    amber: 'bg-amber-50 border-amber-200',
    violet: 'bg-violet-50 border-violet-200',
  }[tone] || 'bg-slate-50 border-slate-200';
  const toneValueText = {
    slate: 'text-slate-900',
    green: 'text-green-800',
    red: 'text-red-800',
    sky: 'text-sky-800',
    amber: 'text-amber-800',
    violet: 'text-violet-800',
  }[tone] || 'text-slate-900';
  return (
    <div className={`${toneBg} dark:bg-slate-900/40 dark:border-slate-800 rounded-xl border p-4`}>
      <div className="text-sm text-slate-600 dark:text-slate-300">{title}</div>
      <div className={`text-xl font-semibold ${toneValueText} dark:text-slate-100`}>{value}</div>
    </div>
  );
}