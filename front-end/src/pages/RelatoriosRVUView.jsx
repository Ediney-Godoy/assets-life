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
  const [filters, setFilters] = useState({ empresa_id: '', ug_id: '', classe_id: '', revisor_id: '', periodo_inicio: '', periodo_fim: '', status: 'Todos' });
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

  useEffect(() => {
    const loadBase = async () => {
      setLoading(true);
      setError(null);
      try {
        const [emp, ug, cls, rev, per] = await Promise.all([
          getCompanies(),
          getManagementUnits(),
          getAccountingClasses ? getAccountingClasses() : Promise.resolve([]),
          getUsers(filters.empresa_id || undefined),
          getReviewPeriods ? getReviewPeriods() : Promise.resolve([]),
        ]);
        setCompanies(emp || []);
        setUgs(ug || []);
        setClasses(cls || []);
        setRevisores(rev || []);
        setPeriodos(per || []);
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
        const list = await getUsers(filters.empresa_id || undefined);
        if (!active) return;
        setRevisores(list || []);
        setFilters((f) => {
          if (!f.revisor_id) return f;
          const exists = (list || []).some((u) => String(u.id) === String(f.revisor_id));
          return exists ? f : { ...f, revisor_id: '' };
        });
      } catch {
        if (!active) return;
        setRevisores([]);
        setFilters((f) => ({ ...f, revisor_id: '' }));
      }
    })();
    return () => { active = false; };
  }, [filters.empresa_id]);

  const applyFilters = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRelatoriosResumo({
        empresa_id: filters.empresa_id || undefined,
        ug_id: filters.ug_id || undefined,
        classe_id: filters.classe_id || undefined,
        revisor_id: filters.revisor_id || undefined,
        periodo_inicio: filters.periodo_inicio || undefined,
        periodo_fim: filters.periodo_fim || undefined,
        status: filters.status === 'Todos' ? undefined : filters.status,
      });
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
      const blob = await getRelatoriosExcel(filters);
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
      const blob = await getRelatoriosPdf(filters);
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

  // Ordena para priorizar itens com alteração discrepante (>20% da vida útil atual)
  const sortedRows = useMemo(() => {
    const score = (r) => {
      const totalAtual = Number(r.vida_util_atual_anos || 0) * 12 + Number(r.vida_util_atual_meses || 0);
      const d = deltaVidaUtil(r.vida_util_atual_anos, r.vida_util_atual_meses, r.vida_util_revisada_anos, r.vida_util_revisada_meses);
      const ratio = totalAtual > 0 ? Math.abs(d.meses) / totalAtual : 0;
      const highlighted = ratio > 0.2 ? 1 : 0;
      return highlighted * 1000 + ratio;
    };
    return [...rows].sort((a, b) => {
      const diff = score(b) - score(a);
      if (diff !== 0) return diff;
      return 0;
    });
  }, [rows]);

  return (
    <div className="p-4">
      <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-3">{t('useful_life_report_title')}</div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm mb-1 text-slate-700 dark:text-slate-300">{t('company_label')}</label>
            <select className="min-w-[280px] w-[340px] px-3 py-2 rounded-md border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400" value={filters.empresa_id} onChange={(e) => setFilters((f) => ({ ...f, empresa_id: e.target.value }))}>
              <option value="">{t('all')}</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1 text-slate-700 dark:text-slate-300">{t('filter_ug')}</label>
            <select className="min-w-[360px] w-[380px] px-3 py-2 rounded-md border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400" value={filters.ug_id} onChange={(e) => setFilters((f) => ({ ...f, ug_id: e.target.value }))}>
              <option value="">{t('all')}</option>
              {ugs.map((g) => <option key={g.id} value={g.id}>{g.codigo} - {g.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1 text-slate-700 dark:text-slate-300">{t('filter_class')}</label>
            <select className="min-w-[180px] w-[220px] px-3 py-2 rounded-md border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400" value={filters.classe_id} onChange={(e) => setFilters((f) => ({ ...f, classe_id: e.target.value }))}>
              <option value="">{t('all')}</option>
              {classes.map((cl) => <option key={cl.id} value={cl.id}>{cl.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1 text-slate-700 dark:text-slate-300">{t('reviewer_label')}</label>
            <select className="min-w-[280px] w-[340px] px-3 py-2 rounded-md border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400" value={filters.revisor_id} onChange={(e) => setFilters((f) => ({ ...f, revisor_id: e.target.value }))}>
              <option value="">{t('all')}</option>
              {revisores.map((r) => <option key={r.id} value={r.id}>{r.full_name || r.nome_completo || r.nome}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-[4px]">
            <div>
              <label className="block text-sm mb-1 text-slate-700 dark:text-slate-300">{t('period_start_label')}</label>
              <input type="date" className="w-[180px] px-3 py-2 rounded-md border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400" value={filters.periodo_inicio} onChange={(e) => setFilters((f) => ({ ...f, periodo_inicio: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm mb-1 text-slate-700 dark:text-slate-300">{t('period_end_label')}</label>
              <input type="date" className="w-[180px] px-3 py-2 rounded-md border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400" value={filters.periodo_fim} onChange={(e) => setFilters((f) => ({ ...f, periodo_fim: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1 text-slate-700 dark:text-slate-300">{t('status')}</label>
            <select className="min-w-[180px] w-[220px] px-3 py-2 rounded-md border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
              <option value="Todos">{t('all')}</option>
              <option value="Revisado">{t('status_reviewed')}</option>
              <option value="Pendente">{t('status_pending')}</option>
              <option value="Aprovado">{t('status_approved')}</option>
            </select>
          </div>
        </div>
        <div className="mt-3">
          <button
            type="button"
            onClick={applyFilters}
            className="px-2 py-1 rounded border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            title={t('apply_filters')}
            aria-label={t('apply_filters')}
          >
            <Filter size={16} />
          </button>
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

      {/* Ações */}
      <div className="flex items-center gap-2 mb-6">
        <button
          type="button"
          onClick={onGeneratePdf}
          disabled={loadingGen}
          className="p-2 rounded border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          title={t('generate_pdf')}
          aria-label={t('generate_pdf')}
        >
          <img src="/Pdf.svg" alt="" className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={onGenerateExcel}
          disabled={loadingGen}
          className="p-2 rounded border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          title={t('export_excel')}
          aria-label={t('export_excel')}
        >
          <img src="/Excel.svg" alt="" className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={applyFilters}
          className="p-2 rounded border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          title={t('view_preview')}
          aria-label={t('view_preview')}
        >
          <Search size={18} />
        </button>
        <button
          type="button"
          onClick={refreshLogs}
          className="p-2 rounded border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          title={t('reports_history')}
          aria-label={t('reports_history')}
        >
          <Clock size={18} />
        </button>
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
