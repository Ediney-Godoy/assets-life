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
      toast.error('Erro ao carregar dados do período');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true); setError(false);
        const [periods, users] = await Promise.all([
          getReviewPeriods(),
          getUsers(),
        ]);
        setPeriodos(Array.isArray(periods) ? periods : []);
        setUsuarios(Array.isArray(users) ? users : []);
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
      list = list.filter((i) => String(i.centro_custo || '').toLowerCase().includes(fv));
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
    setSelectedItemIds((prev) => {
      const ids = new Set(prev);
      const everySelected = filteredLeft.every((i) => ids.has(i.id));
      if (everySelected) {
        // remove os filtrados
        return prev.filter((id) => !filteredLeft.some((i) => i.id === id));
      }
      // adiciona os filtrados
      const merged = new Set(prev);
      filteredLeft.forEach((i) => merged.add(i.id));
      return Array.from(merged);
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
    if (selectedDelegacaoIds.length === 0) { toast.error('Nenhuma delegação selecionada.'); return; }
    try {
      setLoading(true);
      await Promise.all(selectedDelegacaoIds.map((id) => deleteReviewDelegation(id).catch((err) => { console.error(err); })));
      toast.success('Delegações removidas');
      setSelectedDelegacaoIds([]);
      await refreshLists(selectedPeriodoId);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao remover selecionados');
    } finally {
      setLoading(false);
    }
  };

  const onDelegateSelected = async () => {
    if (!selectedPeriodoId) { toast.error('Selecione um período.'); return; }
    if (!revisorId) { toast.error('Selecione um revisor.'); return; }
    if (selectedItemIds.length === 0) { toast.error('Nenhum item selecionado.'); return; }
    try {
      setLoading(true);
      const payloads = selectedItemIds.map((id) => ({
        periodo_id: selectedPeriodoId,
        ativo_id: id,
        revisor_id: Number(revisorId),
        atribuido_por: periodoInfo?.responsavel_id || Number(revisorId),
      }));
      await Promise.all(payloads.map((p) => createReviewDelegation(p).catch((err) => { console.error(err); })));
      toast.success('Delegações criadas (grupo por imobilizado).');
      setSelectedItemIds([]);
      await refreshLists(selectedPeriodoId);
    } catch (err) {
      console.error(err);
      const detail = extractBackendDetail(err?.message);
      toast.error(detail || 'Erro ao delegar selecionados');
    } finally {
      setLoading(false);
    }
  };

  const handleDelegar = async (item) => {
    if (!selectedPeriodoId) {
      toast.error('Selecione um período.');
      return;
    }
    if (!revisorId) {
      toast.error('Selecione um revisor.');
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
      toast.success('Delegação criada (grupo por imobilizado).');
      await refreshLists(selectedPeriodoId);
    } catch (err) {
      console.error(err);
      const detail = extractBackendDetail(err?.message);
      toast.error(detail || 'Erro ao delegar');
    }
  };

  const handleRemover = async (d) => {
    try {
      await deleteReviewDelegation(d.id);
      toast.success('Delegação removida');
      await refreshLists(selectedPeriodoId);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao remover delegação');
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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Delegação de Revisão</h2>
        <div className="flex items-center gap-2">
          <Select label="Período" name="periodo" value={selectedPeriodoId || ''} onChange={onPeriodoChange}>
            {(periodos || []).map((p) => (
              <option key={p.id} value={p.id}>{p.codigo} - {p.descricao}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Coluna Esquerda - Itens disponíveis (TABELA) */}
        <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-end gap-2 mb-3">
            {/* Dropdown de filtro */}
            <Select label="" name="filterType" value={filterType} onChange={(e) => setFilterType(e.target.value)} className="min-w-[150px] md:min-w-[160px]">
              <option value="ug">Unidade Gerencial</option>
              <option value="cc">Centro de Custos</option>
              <option value="classe">Classe Contábil</option>
              <option value="valor">Valor Contábil</option>
              <option value="selecao">Seleção Manual</option>
            </Select>
            {/* Valor do filtro dinâmico */}
            {filterType === 'classe' && (
              <Select label="" name="filterValue" value={filterValue} onChange={(e) => setFilterValue(e.target.value)} className="w-36 md:w-40 shrink-0">
                <option value="">Todas</option>
                {uniqueClasses.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            )}
            {(filterType === 'cc' || filterType === 'ug') && (
              <Select label="" name="filterValue" value={filterValue} onChange={(e) => setFilterValue(e.target.value)} className="w-36 md:w-40 shrink-0">
                <option value="">Todos</option>
                {uniqueCCs.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            )}
            {filterType === 'valor' && (
              <div className="flex items-end gap-2">
                <Input label="Mín" type="number" name="valorMin" value={valorMin} onChange={(e) => setValorMin(e.target.value)} className="w-28" />
                <Input label="Máx" type="number" name="valorMax" value={valorMax} onChange={(e) => setValorMax(e.target.value)} className="w-28" />
              </div>
            )}
            {/* Pesquisa */}
            <Input label="" name="qleft" placeholder={filterType === 'valor' ? 'Valor exato (ex: 0,00)' : 'Pesquisar item'} value={queryLeft} onChange={(e) => setQueryLeft(e.target.value)} className={filterType === 'valor' ? 'w-32 md:w-40' : 'flex-1 min-w-0'} />
            {/* Toolbar esquerda: ações de delegação */}
            <div className="ml-auto flex items-center gap-2">
               <Button variant="primary" className="p-2 h-8 w-8 bg-blue-600 hover:bg-blue-500 shrink-0" title="Delegar selecionados" onClick={onDelegateSelected}>
                 <ArrowRight size={16} />
               </Button>
             </div>

          </div>

          {loading && <p className="text-slate-500">Carregando...</p>}
          {error && <p className="text-red-600">Erro no backend</p>}
          {!loading && !error && (
            filteredLeft.length === 0 ? (
              <p className="text-slate-500">Nenhum item disponível para delegar.</p>
            ) : (
              <div className="max-h-[calc(100vh-270px)] overflow-auto pr-1">
                <div className="overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
                  <table className="min-w-[1100px] divide-y divide-slate-200 dark:divide-slate-800">
                    <thead className="bg-slate-50 dark:bg-slate-900">
                      <tr>
                        <th className="w-12 px-3 py-2 text-center text-xs font-medium text-slate-600 dark:text-slate-300">
                          <div className="flex justify-center">
                            <input type="checkbox" checked={allSelected} onChange={onToggleSelectAll} />
                          </div>
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300">Nº do Imobilizado</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300">Sub. Nº</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300">Descrição</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300">Classe</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300">Valor contábil</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-950 divide-y divide-slate-200 dark:divide-slate-800">
                      {filteredLeft.map((i) => (
                        <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                          <td className="w-12 px-3 py-2 text-center text-sm text-slate-700 dark:text-slate-200">
                            <input type="checkbox" checked={selectedItemIds.includes(i.id)} onChange={() => onToggleSelect(i.id)} />
                          </td>
                          <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-200">{i.numero_imobilizado}</td>
                          <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-200">{i.sub_numero}</td>
                          <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-200">{i.descricao}</td>
                          <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-200">{i.classe}</td>
                          <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-200">{Number(i.valor_contabil || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
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
          <div className="flex items-center gap-2 mb-3">
            <Select label="" name="revisor" value={revisorId} onChange={(e) => setRevisorId(e.target.value)} className="min-w-[260px]">
              <option value="">Selecione...</option>
              {(usuarios || []).map((u) => (
                <option key={u.id} value={u.id}>{u.codigo} - {u.nome_completo}</option>
              ))}
            </Select>
            <Input label="" name="qright" placeholder={revisorId ? 'Pesquisar delegação' : 'Selecione um revisor'} value={queryRight} onChange={(e) => setQueryRight(e.target.value)} disabled={!revisorId} />
            {/* Toolbar direita: selecionar tudo e mover para esquerda */}
            <div className="ml-auto flex items-center gap-2">
              <input type="checkbox" checked={allSelectedRight} onChange={onToggleSelectAllRight} title="Selecionar todas as delegações visíveis" />
              <Button variant="primary" className="p-2 h-8 w-8 bg-blue-600 hover:bg-blue-500 shrink-0" title="Enviar selecionadas para a esquerda" onClick={onUndelegateSelected}>
                <ArrowLeft size={16} />
              </Button>
            </div>
          </div>

          {loading && <p className="text-slate-500">Carregando...</p>}
          {error && <p className="text-red-600">Erro no backend</p>}
          {!loading && !error && (
            filteredRight.length === 0 ? (
              <p className="text-slate-500">Nenhuma delegação encontrada.</p>
            ) : (
              <div className="max-h-[calc(100vh-270px)] overflow-auto pr-1">
                <div className="overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
                  <table className="min-w-[1100px] divide-y divide-slate-200 dark:divide-slate-800">
                    <thead className="bg-slate-50 dark:bg-slate-900">
                      <tr>
                        <th className="w-12 px-3 py-2 text-center text-xs font-medium text-slate-600 dark:text-slate-300">
                          <div className="flex justify-center">
                            <input type="checkbox" checked={allSelectedRight} onChange={onToggleSelectAllRight} title="Selecionar todas as delegações visíveis" />
                          </div>
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300">Nº do Imobilizado</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300">Sub. Nº</th>
                         <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300">Descrição</th>
                         <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300">Revisor</th>
                         <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300">Valor contábil</th>
                         <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300">Atribuído em</th>
                       </tr>
                     </thead>
                    <tbody className="bg-white dark:bg-slate-950 divide-y divide-slate-200 dark:divide-slate-800">
                      {filteredRight.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                          <td className="w-12 px-3 py-2 text-center text-sm text-slate-700 dark:text-slate-200">
                            <input type="checkbox" checked={selectedDelegacaoIds.includes(d.id)} onChange={() => onToggleSelectRight(d.id)} title="Selecionar delegação" />
                          </td>
                          <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-200">{d.numero_imobilizado}</td>
                          <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-200">{itemById.get(d.ativo_id)?.sub_numero ?? d.sub_numero ?? ''}</td>
                           <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-200">{d.descricao}</td>
                           <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-200">{d.revisor_nome || d.revisor_id}</td>
                           <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-200">{Number(itemById.get(d.ativo_id)?.valor_contabil ?? d.valor_contabil ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                           <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-200">{new Date(d.data_atribuicao).toLocaleString()}</td>
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