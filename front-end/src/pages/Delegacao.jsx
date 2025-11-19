import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { UserPlus, Trash2, Search, ArrowRight, ArrowLeft } from 'lucide-react';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import {
  getReviewPeriods,
  getReviewItems,
  getUsers,
  getReviewDelegations,
  createReviewDelegation,
  deleteReviewDelegation,
  getManagementUnits,
  getCostCenters,
} from '../apiClient';

export default function DelegacaoPage() {
  const { t } = useTranslation();
  const [periodos, setPeriodos] = useState([]);
  const [selectedPeriodoId, setSelectedPeriodoId] = useState(null);
  const [periodoInfo, setPeriodoInfo] = useState(null);

  const [items, setItems] = useState([]);
  const [delegacoes, setDelegacoes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  const [revisorId, setRevisorId] = useState('');
  const [queryLeft, setQueryLeft] = useState('');
  const [queryRight, setQueryRight] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  // NEW: seleção e filtros avançados
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [filterType, setFilterType] = useState('cc'); // 'ug' | 'cc' | 'classe' | 'valor' | 'selecao'
  const [filterValue, setFilterValue] = useState('');
  const [valorMin, setValorMin] = useState('');
  const [valorMax, setValorMax] = useState('');
  const [selectedDelegacaoIds, setSelectedDelegacaoIds] = useState([]);
  // NEW: dados auxiliares para mapear CC -> UG
  const [ugs, setUgs] = useState([]);
  const [costCenters, setCostCenters] = useState([]);

  const refreshLists = async (pid) => {
    if (!pid) return;
    try {
      setLoading(true); setError(false);
      const [itens, dels] = await Promise.all([
        getReviewItems(pid),
        getReviewDelegations(pid),
      ]);
      setItems(Array.isArray(itens) ? itens : []);
      setDelegacoes(Array.isArray(dels) ? dels : []);
    } catch (err) {
      setError(true);
      console.error(err);
      toast.error(t('error_loading_period_data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true); setError(false);
        const [periods, users, ugData, ccData] = await Promise.all([
          getReviewPeriods(),
          getUsers(),
          getManagementUnits(),
          getCostCenters(),
        ]);
        setPeriodos(Array.isArray(periods) ? periods : []);
        setUsuarios(Array.isArray(users) ? users : []);
        setUgs(Array.isArray(ugData) ? ugData : []);
        setCostCenters(Array.isArray(ccData) ? ccData : []);
        if (periods && periods.length > 0) {
          const pid = periods[0].id;
          setSelectedPeriodoId(pid);
          setPeriodoInfo(periods[0]);
          await refreshLists(pid);
        }
      } catch (err) {
        setError(true);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const availableItems = useMemo(() => {
    const delegatedIds = new Set((delegacoes || []).map((d) => d.ativo_id));
    return (items || []).filter((i) => !delegatedIds.has(i.id));
  }, [items, delegacoes]);
  // Mapa rápido para buscar informações adicionais do item (ex.: Sub. Nº)
  const itemById = useMemo(() => {
    const m = new Map();
    (items || []).forEach((i) => m.set(i.id, i));
    return m;
  }, [items]);

  // NEW: valores únicos para selects
  const uniqueCCs = useMemo(() => {
    const vals = Array.from(new Set((availableItems || []).map((i) => i.centro_custo).filter(Boolean)));
    return vals.sort();
  }, [availableItems]);
  const uniqueClasses = useMemo(() => {
    const vals = Array.from(new Set((availableItems || []).map((i) => i.classe).filter(Boolean)));
    return vals.sort();
  }, [availableItems]);
  // Mapa de CC por código e UG por id
  const ccByCodigo = useMemo(() => {
    const m = new Map();
    (costCenters || []).forEach((cc) => m.set(String(cc.codigo), cc));
    return m;
  }, [costCenters]);
  const ugById = useMemo(() => {
    const m = new Map();
    (ugs || []).forEach((u) => m.set(Number(u.id), u));
    return m;
  }, [ugs]);
  // UGs únicas presentes nos itens (derivadas via CC -> UG)
  const uniqueUGs = useMemo(() => {
    const seen = new Set();
    const result = [];
    (availableItems || []).forEach((i) => {
      const cc = ccByCodigo.get(String(i.centro_custo || ''));
      const ugId = cc?.ug_id ? Number(cc.ug_id) : null;
      if (!ugId || seen.has(ugId)) return;
      const ug = ugById.get(ugId);
      if (ug) {
        seen.add(ugId);
        result.push(ug);
      }
    });
    return result.sort((a, b) => String(a.codigo).localeCompare(String(b.codigo)));
  }, [availableItems, ccByCodigo, ugById]);

  // Função util para parse de decimais com vírgula
  const parseDecimal = (val) => {
    if (val === null || val === undefined) return null;
    const s = String(val).trim();
    if (s === '') return null;
    const normalized = s.replace(/\./g, '').replace(',', '.');
    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
  };

  const filteredLeft = useMemo(() => {
    const qRaw = (queryLeft || '');
    const qLower = qRaw.toLowerCase();
    const qNum = parseDecimal(qRaw);
    let list = availableItems;
  
    if (qRaw) {
      list = list.filter((i) => {
        const textMatch = (i.numero_imobilizado || '').toLowerCase().includes(qLower)
          || (i.descricao || '').toLowerCase().includes(qLower)
          || (i.centro_custo || '').toLowerCase().includes(qLower);
        const valueMatch = qNum !== null ? Number(i.valor_contabil || 0) === qNum : false;
        return textMatch || valueMatch;
      });
    }
  
    if (filterType === 'cc' && filterValue) {
      const fv = filterValue.toLowerCase();
      list = list.filter((i) => String(i.centro_custo || '').toLowerCase().includes(fv));
    } else if (filterType === 'ug' && filterValue) {
      const fv = filterValue.toLowerCase();
      list = list.filter((i) => {
        const cc = ccByCodigo.get(String(i.centro_custo || ''));
        const ugId = cc?.ug_id ? Number(cc.ug_id) : null;
        const ug = ugId ? ugById.get(ugId) : null;
        const codigo = String(ug?.codigo || '').toLowerCase();
        const nome = String(ug?.nome || '').toLowerCase();
        return ug && (codigo.includes(fv) || nome.includes(fv));
      });
    } else if (filterType === 'classe' && filterValue) {
      const fv = filterValue.toLowerCase();
      list = list.filter((i) => String(i.classe || '').toLowerCase().includes(fv));
    } else if (filterType === 'valor') {
      const minParsed = parseDecimal(valorMin);
      const maxParsed = parseDecimal(valorMax);
      const min = minParsed !== null ? minParsed : (qNum !== null ? qNum : null);
      const max = maxParsed !== null ? maxParsed : (qNum !== null ? qNum : null);
      list = list.filter((i) => {
        const v = Number(i.valor_contabil || 0);
        const okMin = min === null || v >= min;
        const okMax = max === null || v <= max;
        return okMin && okMax;
      });
    } else if (filterType === 'selecao') {
      const setSel = new Set(selectedItemIds);
      list = list.filter((i) => setSel.has(i.id));
    }
    return list;
  }, [availableItems, queryLeft, filterType, filterValue, valorMin, valorMax, selectedItemIds]);

  const filteredRight = useMemo(() => {
    let list = Array.isArray(delegacoes) ? delegacoes : [];
    if (revisorId) {
      const target = String(revisorId);
      list = list.filter((d) => String(d.revisor_id ?? d.revisorId ?? d.revisor) === target);
    }
    const q = (queryRight || '').toLowerCase();
    if (q) {
      list = list.filter((d) =>
        (d.numero_imobilizado || '').toLowerCase().includes(q) ||
        (d.descricao || '').toLowerCase().includes(q) ||
        (d.revisor_nome || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [delegacoes, queryRight, revisorId]);

  // NEW: seleção e delegação em massa (esquerda)
  const allSelected = useMemo(() => {
    const ids = new Set(selectedItemIds);
    return filteredLeft.length > 0 && filteredLeft.every((i) => ids.has(i.id));
  }, [filteredLeft, selectedItemIds]);

  const onToggleSelect = (id) => {
    setSelectedItemIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const onToggleSelectAll = () => {
    if (filteredLeft.length === 0) return;
    // Ajuste: seleção em massa passa a refletir SOMENTE os itens atualmente visíveis
    setSelectedItemIds((prev) => {
      const ids = new Set(prev);
      const everySelected = filteredLeft.every((i) => ids.has(i.id));
      if (everySelected) {
        // desmarca todos os visíveis
        const visibles = new Set(filteredLeft.map((i) => i.id));
        return prev.filter((id) => !visibles.has(id));
      }
      // marca exatamente os visíveis (evita carregar seleções antigas)
      return Array.from(new Set(filteredLeft.map((i) => i.id)));
    });
  };

  // NEW: seleção e remoção em massa (direita)
  const allSelectedRight = useMemo(() => {
    const ids = new Set(selectedDelegacaoIds);
    return filteredRight.length > 0 && filteredRight.every((d) => ids.has(d.id));
  }, [filteredRight, selectedDelegacaoIds]);

  const onToggleSelectRight = (id) => {
    setSelectedDelegacaoIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const onToggleSelectAllRight = () => {
    if (filteredRight.length === 0) return;
    setSelectedDelegacaoIds((prev) => {
      const ids = new Set(prev);
      const everySelected = filteredRight.every((d) => ids.has(d.id));
      if (everySelected) {
        return prev.filter((id) => !filteredRight.some((d) => d.id === id));
      }
      const merged = new Set(prev);
      filteredRight.forEach((d) => merged.add(d.id));
      return Array.from(merged);
    });
  };

  // Helper: extrai mensagem detalhada retornada pelo backend (FastAPI {detail})
  const extractBackendDetail = (msg) => {
    try {
      const m = String(msg || '');
      const brace = m.indexOf('{');
      if (brace >= 0) {
        const json = JSON.parse(m.slice(brace));
        return json?.detail || '';
      }
      return '';
    } catch {
      return '';
    }
  };

  const onUndelegateSelected = async () => {
    if (selectedDelegacaoIds.length === 0) { toast.error(t('delegation_none_selected')); return; }
    try {
      setLoading(true);
      await Promise.all(selectedDelegacaoIds.map((id) => deleteReviewDelegation(id).catch((err) => { console.error(err); })));
      toast.success(t('delegations_removed'));
      setSelectedDelegacaoIds([]);
      await refreshLists(selectedPeriodoId);
    } catch (err) {
      console.error(err);
      toast.error(t('error_removing_selected'));
    } finally {
      setLoading(false);
    }
  };

  const onDelegateSelected = async () => {
    if (!selectedPeriodoId) { toast.error(t('select_period_msg')); return; }
    if (!revisorId) { toast.error(t('select_reviewer_msg')); return; }
    if (selectedItemIds.length === 0) { toast.error(t('no_items_selected')); return; }
    try {
      setLoading(true);
      const payloads = selectedItemIds.map((id) => ({
        periodo_id: selectedPeriodoId,
        ativo_id: id,
        revisor_id: Number(revisorId),
        atribuido_por: periodoInfo?.responsavel_id || Number(revisorId),
      }));
      await Promise.all(payloads.map((p) => createReviewDelegation(p).catch((err) => { console.error(err); })));
      toast.success(t('delegations_created_by_asset'));
      setSelectedItemIds([]);
      await refreshLists(selectedPeriodoId);
    } catch (err) {
      console.error(err);
      const detail = extractBackendDetail(err?.message);
      toast.error(detail || t('error_delegating_selected'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelegar = async (item) => {
    if (!selectedPeriodoId) {
      toast.error(t('select_period_msg'));
      return;
    }
    if (!revisorId) {
      toast.error(t('select_reviewer_msg'));
      return;
    }
    try {
      const payload = {
        periodo_id: selectedPeriodoId,
        ativo_id: item.id,
        revisor_id: Number(revisorId),
        atribuido_por: periodoInfo?.responsavel_id || Number(revisorId),
      };
      await createReviewDelegation(payload);
      toast.success(t('delegation_created_by_asset'));
      await refreshLists(selectedPeriodoId);
    } catch (err) {
      console.error(err);
      const detail = extractBackendDetail(err?.message);
      toast.error(detail || t('error_delegating'));
    }
  };

  const handleRemover = async (d) => {
    try {
      await deleteReviewDelegation(d.id);
      toast.success(t('delegation_removed'));
      await refreshLists(selectedPeriodoId);
    } catch (err) {
      console.error(err);
      toast.error(t('error_removing_delegation'));
    }
  };

  // Mover: handler de troca de período para dentro do componente
  const onPeriodoChange = async (e) => {
    const pid = Number(e.target.value);
    setSelectedPeriodoId(pid || null);
    const info = (periodos || []).find((p) => p.id === pid) || null;
    setPeriodoInfo(info);
    // Reseta seleção e filtros ao trocar de período
    setSelectedItemIds([]);
    setSelectedDelegacaoIds([]);
    setQueryLeft('');
    setFilterValue('');
    setValorMin('');
    setValorMax('');
    await refreshLists(pid);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{t('delegation_title')}</h2>
        <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
          <Select label={t('period_label')} name="periodo" value={selectedPeriodoId || ''} onChange={onPeriodoChange} className="w-full sm:w-64 md:w-80 lg:w-96">
            {(periodos || []).map((p) => (
              <option key={p.id} value={p.id}>{p.codigo} - {p.descricao}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Coluna Esquerda - Itens disponíveis (TABELA) */}
        <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-end gap-2 mb-3 flex-wrap">
            {/* Dropdown de filtro */}
            <Select label="" name="filterType" value={filterType} onChange={(e) => setFilterType(e.target.value)} className="min-w-[160px] sm:w-40 md:w-52 lg:w-56">
              <option value="ug">{t('filter_ug')}</option>
              <option value="cc">{t('filter_cc')}</option>
              <option value="classe">{t('filter_class')}</option>
              <option value="valor">{t('filter_value')}</option>
              <option value="selecao">{t('filter_selection')}</option>
            </Select>
            {/* Valor do filtro dinâmico */}
            {filterType === 'classe' && (
              <Select label="" name="filterValue" value={filterValue} onChange={(e) => setFilterValue(e.target.value)} className="w-40 md:w-52 lg:w-56 shrink-0">
                <option value="">{t('all')}</option>
                {uniqueClasses.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            )}
            {filterType === 'cc' && (
              <Select label="" name="filterValue" value={filterValue} onChange={(e) => setFilterValue(e.target.value)} className="w-40 md:w-52 lg:w-56 shrink-0">
                <option value="">{t('all')}</option>
                {uniqueCCs.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            )}
            {filterType === 'ug' && (
              <Select label="" name="filterValue" value={filterValue} onChange={(e) => setFilterValue(e.target.value)} className="w-44 md:w-56 lg:w-64 shrink-0">
                <option value="">{t('all')}</option>
                {uniqueUGs.map((u) => (
                  <option key={u.id} value={u.codigo}>{u.codigo} - {u.nome}</option>
                ))}
              </Select>
            )}
            {filterType === 'valor' && (
              <div className="flex items-end gap-2">
                <Input label={t('min_label')} type="number" name="valorMin" value={valorMin} onChange={(e) => setValorMin(e.target.value)} className="w-28" />
                <Input label={t('max_label')} type="number" name="valorMax" value={valorMax} onChange={(e) => setValorMax(e.target.value)} className="w-28" />
              </div>
            )}
            {/* Pesquisa */}
              <Input label="" name="qleft" placeholder={filterType === 'valor' ? t('exact_value_placeholder') : t('search_item_placeholder')} value={queryLeft} onChange={(e) => setQueryLeft(e.target.value)} className={filterType === 'valor' ? 'w-full sm:w-44' : 'flex-1 min-w-0 w-full'} />
            {/* Toolbar esquerda: ações de delegação */}
            <div className="ml-auto flex items-center gap-2">
               <Button variant="primary" className="p-2 h-8 w-8 bg-blue-600 hover:bg-blue-500 shrink-0" title={t('delegation_delegate_selected')} onClick={onDelegateSelected}>
                 <ArrowRight size={16} />
               </Button>
             </div>

          </div>

          {loading && <p className="text-slate-500">{t('loading')}</p>}
          {error && <p className="text-red-600">{t('backend_error')}</p>}
          {!loading && !error && (
            filteredLeft.length === 0 ? (
              <p className="text-slate-500">{t('delegation_no_items')}</p>
            ) : (
              <div className="max-h-[calc(100vh-270px)] overflow-auto pr-1 scrollbar-stable overflow-x-auto" style={{ scrollbarGutter: 'stable both-edges' }}>
                <div className="rounded-lg border border-slate-200 dark:border-slate-800">
                  <table className="min-w-[800px] md:min-w-[1100px] divide-y divide-slate-200 dark:divide-slate-800">
                    <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900">
                      <tr>
                        <th className="w-12 px-2 md:px-3 py-1.5 md:py-2 text-center text-xs font-medium text-slate-600 dark:text-slate-300">
                          <div className="flex justify-center">
                            <input type="checkbox" checked={allSelected} onChange={onToggleSelectAll} />
                          </div>
                        </th>
                        <th className="px-2 md:px-4 py-1.5 md:py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300">{t('col_asset_number')}</th>
                        <th className="hidden md:table-cell px-2 md:px-4 py-1.5 md:py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300">{t('col_sub_number')}</th>
                        <th className="px-2 md:px-4 py-1.5 md:py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300">{t('col_description')}</th>
                        <th className="hidden md:table-cell px-2 md:px-4 py-1.5 md:py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300">{t('col_class')}</th>
                        <th className="px-2 md:px-4 py-1.5 md:py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300">{t('col_book_value')}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-950 divide-y divide-slate-200 dark:divide-slate-800">
                      {filteredLeft.map((i) => (
                        <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                          <td className="w-12 px-2 md:px-3 py-1.5 md:py-2 text-center text-xs md:text-sm text-slate-700 dark:text-slate-200">
                            <input type="checkbox" checked={selectedItemIds.includes(i.id)} onChange={() => onToggleSelect(i.id)} />
                          </td>
                          <td className="px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-slate-700 dark:text-slate-200">{i.numero_imobilizado}</td>
                          <td className="hidden md:table-cell px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-slate-700 dark:text-slate-200">{i.sub_numero}</td>
                          <td className="px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-slate-700 dark:text-slate-200">{i.descricao}</td>
                          <td className="hidden md:table-cell px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-slate-700 dark:text-slate-200">{i.classe}</td>
                          <td className="px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-slate-700 dark:text-slate-200">{Number(i.valor_contabil || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}
        </div>

        {/* Coluna Direita - Delegações existentes */}
        <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {/* Agrupa os controles à direita e posiciona o botão azul antes dos campos */}
            <div className="ml-auto flex items-center gap-2 w-full sm:w-auto">
              <Button variant="primary" className="p-2 h-8 w-8 bg-blue-600 hover:bg-blue-500 shrink-0" title={t('delegation_send_left')} onClick={onUndelegateSelected}>
                <ArrowLeft size={16} />
              </Button>
              <Select label="" name="revisor" value={revisorId} onChange={(e) => setRevisorId(e.target.value)} className="min-w-[260px] w-full sm:w-auto">
                <option value="">{t('select')}...</option>
                {(usuarios || []).map((u) => (
                  <option key={u.id} value={u.id}>{u.codigo} - {u.nome_completo}</option>
                ))}
              </Select>
              <Input label="" name="qright" placeholder={revisorId ? t('delegation_search_placeholder') : t('delegation_select_reviewer')} value={queryRight} onChange={(e) => setQueryRight(e.target.value)} disabled={!revisorId} className="w-full sm:w-auto flex-1 min-w-0" />
              <input type="checkbox" checked={allSelectedRight} onChange={onToggleSelectAllRight} title={t('delegation_select_all_visible')} />
            </div>
          </div>

          {loading && <p className="text-slate-500">{t('loading')}</p>}
          {error && <p className="text-red-600">{t('backend_error')}</p>}
          {!loading && !error && (
            filteredRight.length === 0 ? (
              <p className="text-slate-500">{t('delegation_none_found')}</p>
            ) : (
              <div className="max-h-[calc(100vh-270px)] overflow-auto pr-1 scrollbar-stable overflow-x-auto" style={{ scrollbarGutter: 'stable both-edges' }}>
                <div className="rounded-lg border border-slate-200 dark:border-slate-800">
                  <table className="min-w-[800px] md:min-w-[1100px] divide-y divide-slate-200 dark:divide-slate-800">
                    <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900">
                      <tr>
                        <th className="w-12 px-2 md:px-3 py-1.5 md:py-2 text-center text-xs font-medium text-slate-600 dark:text-slate-300">
                          <div className="flex justify-center">
                            <input type="checkbox" checked={allSelectedRight} onChange={onToggleSelectAllRight} title={t('delegation_select_all_visible')} />
                          </div>
                        </th>
                        <th className="px-2 md:px-4 py-1.5 md:py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300">{t('col_asset_number')}</th>
                        <th className="hidden md:table-cell px-2 md:px-4 py-1.5 md:py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300">{t('col_sub_number')}</th>
                        <th className="px-2 md:px-4 py-1.5 md:py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300">{t('col_description')}</th>
                        <th className="px-2 md:px-4 py-1.5 md:py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300">{t('reviewer_label')}</th>
                        <th className="px-2 md:px-4 py-1.5 md:py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300">{t('col_book_value')}</th>
                        <th className="hidden md:table-cell px-2 md:px-4 py-1.5 md:py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300">{t('assigned_at')}</th>
                       </tr>
                     </thead>
                    <tbody className="bg-white dark:bg-slate-950 divide-y divide-slate-200 dark:divide-slate-800">
                      {filteredRight.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                          <td className="w-12 px-2 md:px-3 py-1.5 md:py-2 text-center text-xs md:text-sm text-slate-700 dark:text-slate-200">
                            <input type="checkbox" checked={selectedDelegacaoIds.includes(d.id)} onChange={() => onToggleSelectRight(d.id)} title={t('delegation_select_title')} />
                          </td>
                          <td className="px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-slate-700 dark:text-slate-200">{d.numero_imobilizado}</td>
                          <td className="hidden md:table-cell px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-slate-700 dark:text-slate-200">{itemById.get(d.ativo_id)?.sub_numero ?? d.sub_numero ?? ''}</td>
                          <td className="px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-slate-700 dark:text-slate-200">{d.descricao}</td>
                          <td className="px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-slate-700 dark:text-slate-200">{d.revisor_nome || d.revisor_id}</td>
                          <td className="px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-slate-700 dark:text-slate-200">{Number(itemById.get(d.ativo_id)?.valor_contabil ?? d.valor_contabil ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="hidden md:table-cell px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-slate-700 dark:text-slate-200">{new Date(d.data_atribuicao).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}
      </div>
      </div>
    </div>
  );
}