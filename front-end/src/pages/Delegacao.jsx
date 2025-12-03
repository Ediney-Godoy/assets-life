import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { UserPlus, ArrowRight, ArrowLeft, Search, ChevronDown } from 'lucide-react';
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

  const [queryLeft, setQueryLeft] = useState('');
  const [queryRight, setQueryRight] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [filterType, setFilterType] = useState('cc');
  const [filterValue, setFilterValue] = useState('');
  const [valorMin, setValorMin] = useState('');
  const [valorMax, setValorMax] = useState('');
  const [selectedDelegacaoIds, setSelectedDelegacaoIds] = useState([]);
  const [ugs, setUgs] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [filterRightType, setFilterRightType] = useState('todos');
  const [filterRightValue, setFilterRightValue] = useState('');
  const [valorMinRight, setValorMinRight] = useState('');
  const [valorMaxRight, setValorMaxRight] = useState('');
  const [selectedRevisorId, setSelectedRevisorId] = useState('');
  const [leftFiltersOpen, setLeftFiltersOpen] = useState(true);
  const [rightFiltersOpen, setRightFiltersOpen] = useState(true);

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

        // Obter empresa selecionada
        const empresaId = (() => {
          try {
            return localStorage.getItem('assetlife_empresa');
          } catch {
            return null;
          }
        })();

        console.log('EmpresaId para buscar usuários:', empresaId);

        const [periods, users, ugData, ccData] = await Promise.all([
          getReviewPeriods(),
          getUsers(empresaId),
          getManagementUnits(),
          getCostCenters(),
        ]);

        console.log('Usuários retornados:', users);

        setPeriodos(Array.isArray(periods) ? periods : []);
        setUsuarios(Array.isArray(users) ? users : []);
        setUgs(Array.isArray(ugData) ? ugData : []);
        setCostCenters(Array.isArray(ccData) ? ccData : []);

        // Debug: Ver estrutura dos usuários
        if (users && users.length > 0) {
          console.log('Primeiro usuário:', users[0]);
        }

        if (periods && periods.length > 0) {
          const pid = periods[0].id;
          setSelectedPeriodoId(pid);
          setPeriodoInfo(periods[0]);
          await refreshLists(pid);
        }
      } catch (err) {
        setError(true);
        console.error('Erro ao carregar dados:', err);
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

  const itemById = useMemo(() => {
    const m = new Map();
    (items || []).forEach((i) => m.set(i.id, i));
    return m;
  }, [items]);

  const uniqueCCs = useMemo(() => {
    const vals = Array.from(new Set((availableItems || []).map((i) => i.centro_custo).filter(Boolean)));
    return vals.sort();
  }, [availableItems]);

  const uniqueCCsDelegated = useMemo(() => {
    const set = new Set();
    (delegacoes || []).forEach((d) => {
      const cc = d?.centro_custo ?? itemById.get(d.ativo_id)?.centro_custo ?? '';
      if (cc) set.add(cc);
    });
    return Array.from(set).sort();
  }, [delegacoes, itemById]);

  const uniqueClasses = useMemo(() => {
    const vals = Array.from(new Set((availableItems || []).map((i) => i.classe).filter(Boolean)));
    return vals.sort();
  }, [availableItems]);

  const classDescLeft = useMemo(() => {
    const m = new Map();
    (availableItems || []).forEach((i) => {
      const cls = i.classe;
      const desc = i.descricao_classe;
      if (cls && desc && !m.has(cls)) m.set(cls, desc);
    });
    return m;
  }, [availableItems]);

  const uniqueContas = useMemo(() => {
    const vals = Array.from(new Set((availableItems || []).map((i) => i.conta_contabil).filter(Boolean)));
    return vals.sort();
  }, [availableItems]);

  const uniqueClassesDelegated = useMemo(() => {
    const set = new Set();
    (delegacoes || []).forEach((d) => {
      const cls = d?.classe ?? itemById.get(d.ativo_id)?.classe ?? '';
      if (cls) set.add(cls);
    });
    return Array.from(set).sort();
  }, [delegacoes, itemById]);

  const classDescRight = useMemo(() => {
    const m = new Map();
    (delegacoes || []).forEach((d) => {
      const cls = d?.classe ?? itemById.get(d.ativo_id)?.classe ?? '';
      const desc = d?.descricao_classe ?? itemById.get(d.ativo_id)?.descricao_classe ?? '';
      if (cls && desc && !m.has(cls)) m.set(cls, desc);
    });
    return m;
  }, [delegacoes, itemById]);

  const uniqueContasDelegated = useMemo(() => {
    const set = new Set();
    (delegacoes || []).forEach((d) => {
      const conta = d?.conta_contabil ?? itemById.get(d.ativo_id)?.conta_contabil ?? '';
      if (conta) set.add(conta);
    });
    return Array.from(set).sort();
  }, [delegacoes, itemById]);

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

  const parseDecimal = (val) => {
    if (val === null || val === undefined) return null;
    const s = String(val).trim();
    if (s === '') return null;
    const normalized = s.replace(/\./g, '').replace(',', '.');
    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
  };

  const filteredLeft = useMemo(() => {
    let list = availableItems;

    // Filtro por tipo
    if (filterType === 'cc' && filterValue) {
      const fv = filterValue.toLowerCase();
      list = list.filter((i) => String(i.centro_custo || '').toLowerCase().includes(fv));
    } else if (filterType === 'classe' && filterValue) {
      const fv = filterValue.toLowerCase();
      list = list.filter((i) => String(i.classe || '').toLowerCase().includes(fv));
    } else if (filterType === 'conta' && filterValue) {
      const fv = filterValue.toLowerCase();
      list = list.filter((i) => String(i.conta_contabil || '').toLowerCase().includes(fv));
    } else if (filterType === 'valor') {
      const minParsed = parseDecimal(valorMin);
      const maxParsed = parseDecimal(valorMax);
      list = list.filter((i) => {
        const v = Number(i.valor_contabil || 0);
        const okMin = minParsed === null || v >= minParsed;
        const okMax = maxParsed === null || v <= maxParsed;
        return okMin && okMax;
      });
    }

    // Busca textual
    const q = (queryLeft || '').toLowerCase();
    if (q) {
      list = list.filter((i) =>
        (i.numero_imobilizado || '').toLowerCase().includes(q) ||
        (i.descricao || '').toLowerCase().includes(q) ||
        (i.centro_custo || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [availableItems, queryLeft, filterType, filterValue, valorMin, valorMax]);

  const filteredRight = useMemo(() => {
    let list = Array.isArray(delegacoes) ? delegacoes : [];

    // Filtro por revisor
    if (selectedRevisorId) {
      list = list.filter((d) => String(d.revisor_id) === String(selectedRevisorId));
    }

    // Filtro por tipo
    if (filterRightType === 'cc' && filterRightValue) {
      const fv = filterRightValue.toLowerCase();
      list = list.filter((d) => {
        const cc = d?.centro_custo ?? itemById.get(d.ativo_id)?.centro_custo ?? '';
        return String(cc).toLowerCase().includes(fv);
      });
    } else if (filterRightType === 'classe' && filterRightValue) {
      const fv = filterRightValue.toLowerCase();
      list = list.filter((d) => {
        const cls = d?.classe ?? itemById.get(d.ativo_id)?.classe ?? '';
        return String(cls).toLowerCase().includes(fv);
      });
    } else if (filterRightType === 'conta' && filterRightValue) {
      const fv = filterRightValue.toLowerCase();
      list = list.filter((d) => {
        const conta = d?.conta_contabil ?? itemById.get(d.ativo_id)?.conta_contabil ?? '';
        return String(conta).toLowerCase().includes(fv);
      });
    } else if (filterRightType === 'valor') {
      const minParsed = parseDecimal(valorMinRight);
      const maxParsed = parseDecimal(valorMaxRight);
      list = list.filter((d) => {
        const v = Number(itemById.get(d.ativo_id)?.valor_contabil ?? d.valor_contabil ?? 0);
        const okMin = minParsed === null || v >= minParsed;
        const okMax = maxParsed === null || v <= maxParsed;
        return okMin && okMax;
      });
    }

    // Busca textual
    const q = (queryRight || '').toLowerCase();
    if (q) {
      list = list.filter((d) =>
        (d.numero_imobilizado || '').toLowerCase().includes(q) ||
        (d.descricao || '').toLowerCase().includes(q) ||
        (d.revisor_nome || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [delegacoes, queryRight, filterRightType, filterRightValue, valorMinRight, valorMaxRight, itemById, selectedRevisorId]);

  const allSelected = useMemo(() => {
    const ids = new Set(selectedItemIds);
    return filteredLeft.length > 0 && filteredLeft.every((i) => ids.has(i.id));
  }, [filteredLeft, selectedItemIds]);

  const onToggleSelect = (id) => {
    setSelectedItemIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const onToggleSelectAll = () => {
    if (filteredLeft.length === 0) return;
    setSelectedItemIds((prev) => {
      const ids = new Set(prev);
      const everySelected = filteredLeft.every((i) => ids.has(i.id));
      if (everySelected) {
        const visibles = new Set(filteredLeft.map((i) => i.id));
        return prev.filter((id) => !visibles.has(id));
      }
      return Array.from(new Set(filteredLeft.map((i) => i.id)));
    });
  };

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
    if (selectedItemIds.length === 0) { toast.error(t('no_items_selected')); return; }

    // Se não há revisor selecionado no filtro, pedir ao usuário
    if (!selectedRevisorId) {
      toast.error(t('select_reviewer_msg') || 'Por favor, selecione um revisor no lado direito');
      return;
    }

    try {
      setLoading(true);
      const payloads = selectedItemIds.map((id) => ({
        periodo_id: selectedPeriodoId,
        ativo_id: id,
        revisor_id: Number(selectedRevisorId),
        atribuido_por: periodoInfo?.responsavel_id || Number(selectedRevisorId),
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

  const onPeriodoChange = async (e) => {
    const pid = Number(e.target.value);
    setSelectedPeriodoId(pid || null);
    const info = (periodos || []).find((p) => p.id === pid) || null;
    setPeriodoInfo(info);
    setSelectedItemIds([]);
    setSelectedDelegacaoIds([]);
    setQueryLeft('');
    setFilterValue('');
    setValorMin('');
    setValorMax('');
    await refreshLists(pid);
  };

  return (
    <div className="space-y-4">
      {/* Header com select de período */}
      <div className="flex flex-col gap-3 mt-2">
        <div className="card p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                {t('period_label')}
              </label>
              <select
                className="select w-full"
                value={selectedPeriodoId || ''}
                onChange={onPeriodoChange}
              >
                {periodos.length === 0 && <option value="">{t('no_periods_available') || 'Nenhum período disponível'}</option>}
                {periodos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigo} - {p.descricao}
                  </option>
                ))}
              </select>
            </div>

            {/* Badges de informação */}
            {periodoInfo && (
              <div className="flex gap-2 flex-wrap">
                <div className="badge badge-secondary px-3 py-1.5">
                  <span className="font-medium">{availableItems.length}</span>
                  <span className="ml-1 text-xs">{t('available_items') || 'disponíveis'}</span>
                </div>
                <div className="badge badge-primary px-3 py-1.5">
                  <span className="font-medium">{delegacoes.length}</span>
                  <span className="ml-1 text-xs">{t('delegated_items') || 'delegados'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid de 2 colunas */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Coluna Esquerda - Itens disponíveis */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3 pb-3 border-b" style={{ borderColor: 'var(--border-primary)' }}>
            <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
              {t('available_items') || 'Itens disponíveis'}
            </h3>
            <span className="badge badge-secondary">
              {filteredLeft.length} / {availableItems.length}
            </span>
          </div>

          {/* Filtros organizados com colapso vertical */}
          <div className="mb-3">
            <button className="w-full flex items-center justify-between px-3 py-2 rounded-md border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700" onClick={() => setLeftFiltersOpen((v) => !v)}>
              <span className="text-sm font-medium">{t('filters') || 'Filtros'}</span>
              <ChevronDown size={16} className={`${leftFiltersOpen ? 'rotate-180' : ''} transition-transform`} />
            </button>
            {leftFiltersOpen && (
              <div className="space-y-3 mt-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
                    {t('filter_by') || 'Filtrar por'}
                  </label>
                  <select
                    className="select w-full"
                    value={filterType}
                    onChange={(e) => {
                      setFilterType(e.target.value);
                      setFilterValue('');
                      setValorMin('');
                      setValorMax('');
                    }}
                  >
                    <option value="todos">Todos os itens</option>
                    <option value="classe">{t('filter_class') || 'Classe'}</option>
                    <option value="conta">Conta Contábil</option>
                    <option value="cc">{t('filter_cc') || 'Centro de Custos'}</option>
                    <option value="valor">{t('filter_value') || 'Valor Contábil'}</option>
                  </select>
                </div>

                {filterType === 'classe' && (
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
                      Classe
                    </label>
                    <select className="select w-full" value={filterValue} onChange={(e) => setFilterValue(e.target.value)}>
                      <option value="">Todos</option>
                      {uniqueClasses.map((c) => (
                        <option key={c} value={c}>{classDescLeft.get(c) ? `${c} - ${classDescLeft.get(c)}` : c}</option>
                      ))}
                    </select>
                  </div>
                )}

                {filterType === 'conta' && (
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
                      Conta Contábil
                    </label>
                    <select className="select w-full" value={filterValue} onChange={(e) => setFilterValue(e.target.value)}>
                      <option value="">Todos</option>
                      {uniqueContas.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                )}

                {filterType === 'cc' && (
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
                      Centro de Custos
                    </label>
                    <select className="select w-full" value={filterValue} onChange={(e) => setFilterValue(e.target.value)}>
                      <option value="">Todos</option>
                      {uniqueCCs.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                )}

                {filterType === 'valor' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
                        Mínimo
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 rounded-md border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        value={valorMin}
                        onChange={(e) => setValorMin(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
                        Máximo
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 rounded-md border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        value={valorMax}
                        onChange={(e) => setValorMax(e.target.value)}
                        placeholder="999999"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
                    Pesquisar
                  </label>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      className="w-full pl-10 pr-3 py-2 rounded-md border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Pesquisar item"
                      value={queryLeft}
                      onChange={(e) => setQueryLeft(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botão de delegação sempre visível */}
          <div className="mb-4">
            <Button
              variant="primary"
              className="btn-md w-full"
              onClick={onDelegateSelected}
              disabled={selectedItemIds.length === 0}
            >
              <ArrowRight size={18} />
              <span>{t('delegation_delegate_selected') || 'Delegar Selecionados'} ({selectedItemIds.length})</span>
            </Button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2" style={{ borderColor: 'var(--accent-primary)' }}></div>
                <p style={{ color: 'var(--text-tertiary)' }}>{t('loading') || 'Carregando...'}</p>
              </div>
            </div>
          )}
          {error && (
            <div className="text-center py-12">
              <p className="text-red-500">{t('backend_error') || 'Erro ao carregar'}</p>
            </div>
          )}
          {!loading && !error && (
            filteredLeft.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3" style={{ background: 'var(--bg-tertiary)' }}>
                  <Search size={24} style={{ color: 'var(--text-muted)' }} />
                </div>
                <p style={{ color: 'var(--text-tertiary)' }}>{t('delegation_no_items') || 'Nenhum item encontrado'}</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border-primary)' }}>
                <div className="max-h-[calc(100vh-340px)] overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10" style={{ background: 'var(--bg-tertiary)' }}>
                      <tr>
                        <th className="w-10 px-3 py-2.5 text-center">
                          <input type="checkbox" checked={allSelected} onChange={onToggleSelectAll} className="w-4 h-4 cursor-pointer" />
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                          {t('col_asset_number') || 'Nº Ativo'}
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                          {t('col_sub_number') || 'Sub. Nº'}
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                          {t('col_description') || 'Descrição'}
                        </th>
                        <th className="hidden lg:table-cell px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                          {t('col_class') || 'Classe'}
                        </th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                          {t('col_book_value') || 'Valor'}
                        </th>
                      </tr>
                    </thead>
                    <tbody style={{ background: 'var(--bg-primary)' }}>
                      {filteredLeft.map((i) => (
                        <tr key={i.id} className="transition-colors" style={{ borderTop: '1px solid var(--border-primary)' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                          <td className="w-10 px-3 py-2.5 text-center">
                            <input type="checkbox" checked={selectedItemIds.includes(i.id)} onChange={() => onToggleSelect(i.id)} className="w-4 h-4 cursor-pointer" />
                          </td>
                          <td className="px-3 py-2.5 font-medium" style={{ color: 'var(--text-primary)' }}>{i.numero_imobilizado}</td>
                          <td className="px-3 py-2.5" style={{ color: 'var(--text-secondary)' }}>{i.sub_numero}</td>
                          <td className="px-3 py-2.5 truncate max-w-[250px]" style={{ color: 'var(--text-secondary)' }} title={i.descricao}>{i.descricao}</td>
                          <td className="hidden lg:table-cell px-3 py-2.5" style={{ color: 'var(--text-secondary)' }}>{i.classe}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums font-medium" style={{ color: 'var(--text-primary)' }}>
                            {Number(i.valor_contabil || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
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
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3 pb-3 border-b" style={{ borderColor: 'var(--border-primary)' }}>
            <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
              {t('delegated_items') || 'Itens delegados'}
            </h3>
            <span className="badge badge-primary">
              {filteredRight.length} / {delegacoes.length}
            </span>
          </div>

          {/* Controles organizados com colapso vertical */}
          <div className="mb-3">
            <button className="w-full flex items-center justify-between px-3 py-2 rounded-md border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700" onClick={() => setRightFiltersOpen((v) => !v)}>
              <span className="text-sm font-medium">{t('filters') || 'Filtros'}</span>
              <ChevronDown size={16} className={`${rightFiltersOpen ? 'rotate-180' : ''} transition-transform`} />
            </button>
            {rightFiltersOpen && (
              <div className="space-y-3 mt-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
                    {t('reviewer_label') || 'Revisor'}
                  </label>
                  <select
                    className="select w-full"
                    value={selectedRevisorId}
                    onChange={(e) => setSelectedRevisorId(e.target.value)}
                  >
                    <option value="">{t('all_reviewers') || 'Todos os Avaliadores'}</option>
                    {Array.isArray(usuarios) && usuarios.length > 0 ? (
                      usuarios.map((u) => {
                        let displayName = u.nome_completo;
                        if (displayName && typeof displayName === 'string' && displayName.includes(' - ')) {
                          const parts = displayName.split(' - ');
                          if (parts.length > 1) displayName = parts.slice(1).join(' - ');
                        }
                        return (
                          <option key={u.id} value={u.id}>
                            {displayName}
                          </option>
                        );
                      })
                    ) : (
                      <option disabled>Carregando usuários...</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
                    Filtrar por
                  </label>
                  <select
                    className="select w-full"
                    value={filterRightType}
                    onChange={(e) => {
                      setFilterRightType(e.target.value);
                      setFilterRightValue('');
                      setValorMinRight('');
                      setValorMaxRight('');
                    }}
                  >
                    <option value="todos">Todos os itens</option>
                    <option value="classe">Classe</option>
                    <option value="conta">Conta Contábil</option>
                    <option value="cc">Centro de Custos</option>
                    <option value="valor">Valor Contábil</option>
                  </select>
                </div>

                {filterRightType === 'classe' && (
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
                      Classe
                    </label>
                    <select className="select w-full" value={filterRightValue} onChange={(e) => setFilterRightValue(e.target.value)}>
                      <option value="">Todos</option>
                      {uniqueClassesDelegated.map((c) => (
                        <option key={c} value={c}>{classDescRight.get(c) ? `${c} - ${classDescRight.get(c)}` : c}</option>
                      ))}
                    </select>
                  </div>
                )}

                {filterRightType === 'conta' && (
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
                      Conta Contábil
                    </label>
                    <select className="select w-full" value={filterRightValue} onChange={(e) => setFilterRightValue(e.target.value)}>
                      <option value="">Todos</option>
                      {uniqueContasDelegated.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                )}

                {filterRightType === 'cc' && (
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
                      Centro de Custos
                    </label>
                    <select className="select w-full" value={filterRightValue} onChange={(e) => setFilterRightValue(e.target.value)}>
                      <option value="">Todos</option>
                      {uniqueCCsDelegated.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                )}

                {filterRightType === 'valor' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
                        Mínimo
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 rounded-md border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        value={valorMinRight}
                        onChange={(e) => setValorMinRight(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
                        Máximo
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 rounded-md border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        value={valorMaxRight}
                        onChange={(e) => setValorMaxRight(e.target.value)}
                        placeholder="999999"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
                    Pesquisar
                  </label>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      className="w-full pl-10 pr-3 py-2 rounded-md border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Pesquisar delegação"
                      value={queryRight}
                      onChange={(e) => setQueryRight(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botão de remoção sempre visível */}
          <div className="mb-4">
            <Button
              variant="secondary"
              className="btn-md w-full"
              onClick={onUndelegateSelected}
              disabled={selectedDelegacaoIds.length === 0}
            >
              <ArrowLeft size={18} />
              <span>Remover Selecionados ({selectedDelegacaoIds.length})</span>
            </Button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2" style={{ borderColor: 'var(--accent-primary)' }}></div>
                <p style={{ color: 'var(--text-tertiary)' }}>{t('loading') || 'Carregando...'}</p>
              </div>
            </div>
          )}
          {error && (
            <div className="text-center py-12">
              <p className="text-red-500">{t('backend_error') || 'Erro ao carregar'}</p>
            </div>
          )}
          {!loading && !error && (
            filteredRight.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3" style={{ background: 'var(--bg-tertiary)' }}>
                  <UserPlus size={24} style={{ color: 'var(--text-muted)' }} />
                </div>
                <p style={{ color: 'var(--text-tertiary)' }}>
                  {((filterRightType === 'cc' || filterRightType === 'classe' || filterRightType === 'conta') && !filterRightValue)
                    ? 'Selecione um filtro para visualizar'
                    : 'Nenhuma delegação encontrada'}
                </p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border-primary)' }}>
                <div className="max-h-[calc(100vh-340px)] overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10" style={{ background: 'var(--bg-tertiary)' }}>
                      <tr>
                        <th className="w-10 px-3 py-2.5 text-center">
                          <input type="checkbox" checked={allSelectedRight} onChange={onToggleSelectAllRight} className="w-4 h-4 cursor-pointer" />
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                          {t('col_asset_number') || 'Nº Ativo'}
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                          {t('col_sub_number') || 'Sub. Nº'}
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                          {t('col_description') || 'Descrição'}
                        </th>
                        <th className="hidden lg:table-cell px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                          {t('col_class') || 'Classe'}
                        </th>
                        <th className="hidden xl:table-cell px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                          {t('reviewer_label') || 'Revisor'}
                        </th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                          {t('col_book_value') || 'Valor'}
                        </th>
                      </tr>
                    </thead>
                    <tbody style={{ background: 'var(--bg-primary)' }}>
                      {filteredRight.map((d) => (
                        <tr key={d.id} className="transition-colors" style={{ borderTop: '1px solid var(--border-primary)' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                          <td className="w-10 px-3 py-2.5 text-center">
                            <input type="checkbox" checked={selectedDelegacaoIds.includes(d.id)} onChange={() => onToggleSelectRight(d.id)} className="w-4 h-4 cursor-pointer" />
                          </td>
                          <td className="px-3 py-2.5 font-medium" style={{ color: 'var(--text-primary)' }}>{d.numero_imobilizado}</td>
                          <td className="px-3 py-2.5" style={{ color: 'var(--text-secondary)' }}>{d?.sub_numero ?? itemById.get(d.ativo_id)?.sub_numero}</td>
                          <td className="px-3 py-2.5 truncate max-w-[250px]" style={{ color: 'var(--text-secondary)' }} title={d.descricao}>{d.descricao}</td>
                          <td className="hidden lg:table-cell px-3 py-2.5" style={{ color: 'var(--text-secondary)' }}>{d?.classe ?? itemById.get(d.ativo_id)?.classe}</td>
                          <td className="hidden xl:table-cell px-3 py-2.5" style={{ color: 'var(--text-secondary)' }}>{d.revisor_nome || d.revisor_id}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums font-medium" style={{ color: 'var(--text-primary)' }}>
                            {Number(itemById.get(d.ativo_id)?.valor_contabil ?? d.valor_contabil ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
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
