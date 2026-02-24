import React from 'react';
import { ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Table from '../components/ui/Table';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { getReviewPeriods, getReviewItems, applyMassRevision, getReviewDelegations, getManagementUnits, getCostCenters } from '../apiClient';

export default function MassRevisionView() {
  const { t } = useTranslation();
  const [periodos, setPeriodos] = React.useState([]);
  const [periodoId, setPeriodoId] = React.useState(null);
  const [items, setItems] = React.useState([]);
  const [filter, setFilter] = React.useState({ texto: '' });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [selected, setSelected] = React.useState(() => new Set());
  const [resultSummary, setResultSummary] = React.useState(null);
  const [delegacoes, setDelegacoes] = React.useState([]);
  const [activeTab, setActiveTab] = React.useState('pendentes'); // 'pendentes' | 'revisados'
  const [massDialogOpen, setMassDialogOpen] = React.useState(false);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewRows, setPreviewRows] = React.useState([]);
  const currentUserId = React.useMemo(() => {
    try { return JSON.parse(localStorage.getItem('assetlife_user') || 'null')?.id || null; } catch { return null; }
  }, []);

  // Filtros avançados (semelhante à tela de Delegação)
  const [filterType, setFilterType] = React.useState('cc'); // 'ug' | 'cc' | 'classe' | 'valor'
  const [filterValue, setFilterValue] = React.useState('');
  const [valorMin, setValorMin] = React.useState('');
  const [valorMax, setValorMax] = React.useState('');
  const [advancedQuery, setAdvancedQuery] = React.useState('');

  // Dados auxiliares para mapear CC -> UG
  const [ugs, setUgs] = React.useState([]);
  const [costCenters, setCostCenters] = React.useState([]);

  const [form, setForm] = React.useState({
    condicao_fisica: '',
    incremento: 'Manter',
    nova_vida_anos: '',
    nova_vida_meses: '',
    nova_data_fim: '',
    motivo: '',
    justificativa: 'A vida útil está correta',
  });

  const periodoSelecionado = React.useMemo(() => periodos.find((p) => p.id === periodoId) || null, [periodoId, periodos]);
  const isPeriodClosed = Boolean(periodoSelecionado?.data_fechamento);

  React.useEffect(() => {
    const run = async () => {
      try {
        const ps = await getReviewPeriods();
        setPeriodos(ps);
        if (ps.length > 0) setPeriodoId(ps[0].id);
      } catch (err) {
        setError(String(err?.message || err));
      }
    };
    run();
  }, []);

  // Carregar UGs e Centros de Custo para suportar filtro por UG
  React.useEffect(() => {
    const loadAux = async () => {
      try {
        const [ugData, ccData] = await Promise.all([
          getManagementUnits(),
          getCostCenters(),
        ]);
        setUgs(Array.isArray(ugData) ? ugData : []);
        setCostCenters(Array.isArray(ccData) ? ccData : []);
      } catch (_) {
        // Não bloquear a tela caso falhe
        setUgs([]);
        setCostCenters([]);
      }
    };
    loadAux();
  }, []);

  React.useEffect(() => {
    const loadItems = async () => {
      if (!periodoId) return;
      console.log('[MassRevisionView] Loading items for period:', periodoId);
      setLoading(true);
      setError('');
      try {
        const data = await getReviewItems(periodoId);
        console.log('[MassRevisionView] Loaded items:', data?.length);
        setItems(data);
        setSelected(new Set());
      } catch (err) {
        console.error('[MassRevisionView] Error loading items:', err);
        setError(String(err?.message || err));
      } finally {
        setLoading(false);
      }
    };
    loadItems();
  }, [periodoId]);

  React.useEffect(() => {
    const loadDelegacoes = async () => {
      if (!periodoId) { setDelegacoes([]); return; }
      try {
        const ds = await getReviewDelegations(periodoId);
        setDelegacoes(Array.isArray(ds) ? ds : []);
      } catch (err) {
        // Falha em delegações não deve bloquear a tela
        setDelegacoes([]);
      }
    };
    loadDelegacoes();
  }, [periodoId]);

  // Helpers
  const isConnError = (msg) => {
    const m = String(msg || '').toLowerCase();
    return (
      m.includes('failed to fetch') ||
      m.includes('network') ||
      m.includes('timeout') ||
      m.includes('abort')
    );
  };

  // Formatadores e utilitários de cálculo
  const formatNumberBR = (val) => {
    if (val == null || val === '') return '-';
    const num = Number(val);
    if (!Number.isFinite(num)) return String(val);
    try {
      return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } catch (_) {
      return String(num);
    }
  };
  const splitYearsMonths = (monthsTotal) => {
    const m = Number(monthsTotal);
    if (!Number.isFinite(m)) return { anos: null, meses: null };
    return { anos: Math.floor(m / 12), meses: m % 12 };
  };
  // Helper para verificar se o item já foi revisado/analisado
  const isItemRevisado = (it) => {
    const normalize = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const s = normalize(it.status);
    // Se o status for 'revertido', deve voltar para a aba de pendentes ("A Revisar")
    if (s === 'revertido') return false;
    const statusReviewed = (s === 'revisado' || s === 'revisada' || s === 'aprovado' || s === 'concluido');
    return statusReviewed || Boolean(it.alterado);
  };

  const retryLoad = async () => {
    try {
      setError('');
      // Recarrega períodos se ainda não houver
      let ps = periodos;
      if (!ps || ps.length === 0) {
        ps = await getReviewPeriods();
        setPeriodos(ps);
      }
      const id = periodoId || (ps && ps.length > 0 ? ps[0].id : null);
      if (id) {
        setPeriodoId(id);
        setLoading(true);
        const data = await getReviewItems(id);
        setItems(data);
      }
    } catch (err) {
      setError(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  const parseDate = (str) => {
    if (!str) return null;
    const [y, m, d] = String(str).split('-').map((x) => Number(x));
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  };
  const formatDateBR = (str) => {
    if (!str) return '-';
    const d = parseDate(str);
    if (!d) return '-';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };
  const toISO = (d) => {
    if (!d) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  const monthsUntil = (target) => {
    if (!target) return Infinity;
    const now = new Date();
    let months = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
    if (target.getDate() < now.getDate()) months -= 1;
    return months;
  };
  const monthsDiff = (start, end) => {
    if (!start || !end) return null;
    let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (end.getDate() < start.getDate()) months -= 1;
    return months;
  };
  const monthsDiffSigned = (start, end) => {
    if (!start || !end) return 0;
    let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (end.getDate() < start.getDate()) months -= 1;
    return months;
  };
  const addMonths = (dateObj, months) => {
    if (!dateObj || months == null) return null;
    const d = new Date(dateObj.getTime());
    const y = d.getFullYear();
    const m = d.getMonth();
    const targetMonth = m + Number(months);
    const ty = y + Math.floor(targetMonth / 12);
    const tm = ((targetMonth % 12) + 12) % 12;
    const endOfTargetMonth = new Date(ty, tm + 1, 0).getDate();
    const day = Math.min(d.getDate(), endOfTargetMonth);
    return new Date(ty, tm, day);
  };

  const motivosAumentoBase = t('review_reasons_increase', { returnObjects: true }) || [];
  const motivosReducaoBase = t('review_reasons_decrease', { returnObjects: true }) || [];
  const motivosManter = [
    'Terras e Terrenos',
    'Obras em Andamento',
    'Totalmente depreciados',
    'Intangível em andamento',
    'Marcas e Patentes',
    'Vida Útil Correta',
    'Melhor Estimativa do LOM',
  ];
  const motivosAumento = Array.isArray(motivosAumentoBase) ? [...motivosAumentoBase] : [];
  if (!motivosAumento.includes('Melhor Estimativa do LOM')) motivosAumento.push('Melhor Estimativa do LOM');
  const motivosReducao = Array.isArray(motivosReducaoBase) ? [...motivosReducaoBase] : [];
  if (!motivosReducao.includes('Melhor Estimativa do LOM')) motivosReducao.push('Melhor Estimativa do LOM');

  // Funções auxiliares para filtros avançados
  const parseDecimal = (s) => {
    const str = String(s || '').trim();
    if (!str) return null;
    // aceita vírgula ou ponto
    const norm = str.replace(/\./g, '').replace(/,/g, '.');
    const n = Number(norm);
    return Number.isFinite(n) ? n : null;
  };

  const myItemIds = React.useMemo(() => {
    const uid = currentUserId;
    if (!uid) return new Set();
    const list = Array.isArray(delegacoes) ? delegacoes : [];
    return new Set(list.filter((d) => String(d.revisor_id ?? d.revisorId ?? d.revisor) === String(uid)).map((d) => d.ativo_id));
  }, [delegacoes, currentUserId]);
  // Mapas auxiliares para CC -> UG
  const ccByCodigo = React.useMemo(() => {
    const m = new Map();
    (costCenters || []).forEach((c) => m.set(String(c.codigo || '').toLowerCase(), c));
    return m;
  }, [costCenters]);
  const ugById = React.useMemo(() => {
    const m = new Map();
    (ugs || []).forEach((u) => m.set(Number(u.id), u));
    return m;
  }, [ugs]);

  const uniqueCCs = React.useMemo(() => {
    const vals = Array.from(new Set((items || []).map((i) => i.centro_custo).filter(Boolean)));
    return vals;
  }, [items]);
  const uniqueClasses = React.useMemo(() => {
    const vals = Array.from(new Set((items || []).map((i) => i.classe).filter(Boolean)));
    return vals.sort();
  }, [items]);

  const classDesc = React.useMemo(() => {
    const m = new Map();
    (items || []).forEach((i) => {
      if (i.classe && i.descricao_classe && !m.has(i.classe)) {
        m.set(i.classe, i.descricao_classe);
      }
    });
    return m;
  }, [items]);
  const uniqueUGs = React.useMemo(() => {
    const seen = new Set();
    const result = [];
    (items || []).forEach((i) => {
      // Primeiro tenta campos diretos no item
      const directUgId = i.ug_id != null ? Number(i.ug_id) : (i.unidade_gerencial_id != null ? Number(i.unidade_gerencial_id) : null);
      const ugId = directUgId ?? (() => {
        const cc = ccByCodigo.get(String(i.centro_custo || '').toLowerCase());
        return cc?.ug_id ? Number(cc.ug_id) : null;
      })();
      if (!ugId || seen.has(ugId)) return;
      const ug = ugById.get(ugId);
      if (ug) { seen.add(ugId); result.push(ug); }
    });
    return result;
  }, [items, ccByCodigo, ugById]);

  const delegatedCount = React.useMemo(() => {
    if (myItemIds.size > 0) {
      return (items || []).filter((i) => myItemIds.has(i.id)).length;
    }
    return (items || []).length;
  }, [items, myItemIds]);
  const availableCount = React.useMemo(() => {
    if (myItemIds.size > 0) {
      return (items || []).filter((i) => myItemIds.has(i.id) && !isItemRevisado(i)).length;
    }
    return (items || []).filter((i) => !isItemRevisado(i)).length;
  }, [items, myItemIds]);
  const reviewedCount = React.useMemo(() => {
    if (myItemIds.size > 0) {
      return (items || []).filter((i) => myItemIds.has(i.id) && isItemRevisado(i)).length;
    }
    return (items || []).filter((i) => isItemRevisado(i)).length;
  }, [items, myItemIds]);

  const filtered = React.useMemo(() => {
    let list = myItemIds.size > 0
      ? (items || []).filter((i) => myItemIds.has(i.id))
      : (items || []);

    // Filtro por aba (pendentes vs revisados)
    list = list.filter((it) => (activeTab === 'revisados' ? isItemRevisado(it) : !isItemRevisado(it)));

    // Complemento via campo editável (semelhante à Delegação)
    const qLower = (advancedQuery || '').trim().toLowerCase();
    const qNum = parseDecimal(advancedQuery);
    list = list.filter((i) => {
      const baseMatch = !qLower ? true : (
        String(i.numero_imobilizado).toLowerCase().includes(qLower) ||
        String(i.descricao).toLowerCase().includes(qLower) ||
        String(i.centro_custo || '').toLowerCase().includes(qLower)
      );
      const valueMatch = qNum !== null ? Number(i.valor_contabil || 0) === qNum : false;
      return baseMatch || valueMatch;
    });

    // Filtro por tipo selecionado
    const fv = String(filterValue || '').trim().toLowerCase();
    if (filterType === 'cc' && fv) {
      list = list.filter((i) => String(i.centro_custo || '').toLowerCase().includes(fv));
    } else if (filterType === 'classe' && fv) {
      list = list.filter((i) => String(i.classe || '').toLowerCase().includes(fv));
    } else if (filterType === 'ug' && fv) {
      list = list.filter((i) => {
        // Tenta primeiro campos diretos no item
        const directCode = String(i.ug_codigo || i.unidade_gerencial || i.ug || '').toLowerCase();
        const directName = String(i.ug_nome || i.unidade_gerencial_nome || '').toLowerCase();
        if (directCode || directName) {
          return directCode.includes(fv) || directName.includes(fv);
        }
        // Fallback via Centro de Custo -> UG
        const cc = ccByCodigo.get(String(i.centro_custo || '').toLowerCase());
        const ugId = cc?.ug_id ? Number(cc.ug_id) : null;
        const ug = ugId ? ugById.get(ugId) : null;
        const codigo = String(ug?.codigo || '').toLowerCase();
        const nome = String(ug?.nome || '').toLowerCase();
        return !!ug && (codigo.includes(fv) || nome.includes(fv));
      });
    } else if (filterType === 'valor') {
      const minParsed = parseDecimal(valorMin);
      const maxParsed = parseDecimal(valorMax);
      list = list.filter((i) => {
        const v = Number(i.valor_contabil || 0);
        const byMin = minParsed !== null ? v >= minParsed : true;
        const byMax = maxParsed !== null ? v <= maxParsed : true;
        return byMin && byMax;
      });
    } else if (filterType === 'vencimento') {
      list = list.filter((i) => {
        const target = parseDate(i.data_fim_revisada) || parseDate(i.data_fim_depreciacao);
        const m = monthsUntil(target);
        return m >= 0 && m <= 18;
      });
    }

    // (Removido Filtro Rápido)

    return list;
  }, [items, myItemIds, advancedQuery, filterType, filterValue, valorMin, valorMax, ccByCodigo, ugById, activeTab]);

  const sorted = React.useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const aTarget = parseDate(a.data_fim_revisada) || parseDate(a.data_fim_depreciacao);
      const bTarget = parseDate(b.data_fim_revisada) || parseDate(b.data_fim_depreciacao);
      const aMonths = monthsUntil(aTarget);
      const bMonths = monthsUntil(bTarget);
      const aIsSoon = aMonths >= 0 && aMonths <= 18;
      const bIsSoon = bMonths >= 0 && bMonths <= 18;
      if (aIsSoon && !bIsSoon) return -1;
      if (!aIsSoon && bIsSoon) return 1;
      return aMonths - bMonths;
    });
    return arr;
  }, [filtered]);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const selectAllVisible = () => {
    setSelected(new Set(sorted.map((x) => x.id)));
  };
  const clearSelection = () => setSelected(new Set());

  const allVisibleSelected = React.useMemo(() => (
    sorted.length > 0 && sorted.every((x) => selected.has(x.id))
  ), [sorted, selected]);

  const toggleSelectAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      const visibles = new Set(sorted.map((x) => x.id));
      const everySelected = sorted.length > 0 && sorted.every((x) => next.has(x.id));
      if (everySelected) {
        visibles.forEach((id) => next.delete(id));
      } else {
        sorted.forEach((x) => next.add(x.id));
      }
      return next;
    });
  };

  const selectColumn = {
    key: 'select',
    header: (
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={allVisibleSelected}
          onChange={(e) => { e.stopPropagation(); toggleSelectAllVisible(); }}
          title={t('select_all_visible')}
        />
        <span>{t('select')}</span>
      </div>
    ),
    render: (_v, row) => (
      <input
        type="checkbox"
        checked={selected.has(row.id)}
        onChange={(e) => { e.stopPropagation(); toggleSelect(row.id); }}
      />
    ),
  };

  const baseColumns = [
    {
      key: '__alert',
      header: t('alert_label', { defaultValue: 'Alerta' }),
      width: '90px',
      render: (_v, row) => {
        const target = parseDate(row.data_fim_revisada) || parseDate(row.data_fim_depreciacao);
        const m = monthsUntil(target);
        if (m >= 0 && m <= 18) {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">⚠️ ≤ 18m</span>
          );
        }
        return '';
      },
    },
    { key: 'numero_imobilizado', header: t('col_asset_number') },
    { key: 'sub_numero', header: t('col_sub_number') },
    { key: 'descricao', header: t('col_description') },
    { key: 'data_inicio_depreciacao', header: t('col_depr_start'), render: (v) => formatDateBR(v) },
    { key: 'vida_util_anos', header: t('col_useful_life_years'), render: (v, row) => (v != null ? v : Math.floor(Number(row.vida_util_periodos || 0) / 12)) },
    { key: 'vida_util_periodos', header: t('col_useful_life_periods') },
    { key: 'data_fim_depreciacao', header: t('col_depr_end'), render: (v) => formatDateBR(v) },
    { key: 'valor_contabil', header: t('col_book_value'), render: (v) => formatNumberBR(v) },
    {
      key: 'nova_vida_util_anos_calc',
      header: t('col_new_life_years'),
      render: (_v, row) => {
        const { anos } = splitYearsMonths(row.vida_util_revisada);
        return anos == null ? '-' : anos;
      },
    },
    {
      key: 'nova_vida_util_periodos',
      header: t('col_new_life_periods'),
      render: (_v, row) => {
        const { meses } = splitYearsMonths(row.vida_util_revisada);
        return meses == null ? '-' : meses;
      },
    },
    { key: 'data_fim_revisada', header: t('col_adjusted_depr_end'), render: (v) => formatDateBR(v) },
    { key: 'condicao_fisica', header: t('col_physical_condition'), render: (v) => v || '-' },
    { key: 'justificativa', header: t('col_justification'), render: (v) => v || '-' },
    {
      key: 'vida_util_total_anos_calc',
      header: t('col_total_life_years'),
      render: (_v, row) => {
        const inicio = parseDate(row.data_inicio_depreciacao);
        const fim = parseDate(row.data_fim_revisada) || parseDate(row.data_fim_depreciacao);
        const total = monthsDiff(inicio, fim);
        const { anos } = splitYearsMonths(total);
        return anos == null ? '-' : anos;
      },
    },
    {
      key: 'vida_util_total_periodos_calc',
      header: t('col_total_life_periods'),
      render: (_v, row) => {
        const inicio = parseDate(row.data_inicio_depreciacao);
        const fim = parseDate(row.data_fim_revisada) || parseDate(row.data_fim_depreciacao);
        const total = monthsDiff(inicio, fim);
        const { meses } = splitYearsMonths(total);
        return meses == null ? '-' : meses;
      },
    },
    { key: 'alterado', header: t('col_changed'), render: (v) => (v ? t('yes') : t('no')) },
  ];

  const columns = [selectColumn, ...baseColumns];
  const buildPreview = () => {
    const rows = Array.from(selected).map((id) => {
      const item = items.find((x) => x.id === id);
      const inicio = parseDate(item?.data_inicio_depreciacao);
      const fimAtual = parseDate(item?.data_fim_revisada) || parseDate(item?.data_fim_depreciacao);
      let novaFim = fimAtual;
      if (form.incremento !== 'Manter') {
        if (form.nova_data_fim) {
          novaFim = parseDate(form.nova_data_fim);
        } else {
          const totalMeses = Number(form.nova_vida_anos || 0) * 12 + Number(form.nova_vida_meses || 0);
          novaFim = addMonths(inicio, totalMeses);
        }
      }
      const diff = monthsDiffSigned(fimAtual, novaFim);
      const diffAnosStr = diff === 0 ? '0 anos' : `${diff > 0 ? '+' : ''}${Math.trunc(Math.abs(diff) / 12)} anos`;
      const incCalc = diff > 0 ? 'Acréscimo' : diff < 0 ? 'Decréscimo' : 'Manter';
      const alerta = monthsUntil(novaFim) <= 18 ? '⚠️' : '—';
      return { id, numero_imobilizado: item?.numero_imobilizado, fimAtual, novaFim, diffAnosStr, incCalc, alerta };
    });
    setPreviewRows(rows);
  };

  const handleApply = async () => {
    if (selected.size === 0) {
      setError(t('mass_no_items_selected'));
      return;
    }
    if (!form.motivo) {
      setError(t('error_reason_required') || 'Selecione um motivo para a revisão em massa.');
      return;
    }
    setError('');
    buildPreview();
    setPreviewOpen(true);
  };

  const confirmApply = async () => {
    if (form.incremento === 'Decréscimo' && !form.justificativa) {
      setPreviewOpen(false);
      setError(t('error_justification_required_decrease') || 'Justificativa obrigatória para redução de vida útil. Selecione um motivo.');
      return;
    }
    try {
      const payload = {
        ativos_ids: Array.from(selected),
        incremento: form.incremento || 'Manter',
        condicao_fisica: form.condicao_fisica || undefined,
        motivo: form.motivo || undefined,
        justificativa: form.justificativa || undefined,
      };
      if (form.incremento !== 'Manter') {
        if (form.nova_data_fim) {
          payload.nova_data_fim = form.nova_data_fim;
        } else {
          payload.nova_vida_util_anos = form.nova_vida_anos === '' ? undefined : Number(form.nova_vida_anos);
          payload.nova_vida_util_meses = form.nova_vida_meses === '' ? undefined : Number(form.nova_vida_meses);
        }
      }
      const res = await applyMassRevision(payload);
      setResultSummary({ total: res.total, updated: res.updated, skipped: res.skipped, errors: res.errors });
      const data = await getReviewItems(periodoId);
      setItems(data);
      clearSelection();
      setPreviewOpen(false);
      setMassDialogOpen(false);
    } catch (err) {
      setError(String(err?.message || err));
    }
  };

  return (
    <section>
      <div className="mb-2 px-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{t('mass_title')}</h2>
      </div>

      {/* Abas: A Revisar / Revisados */}
      <div className="px-4 mb-2">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            onClick={() => setActiveTab('pendentes')}
            className={`px-4 py-2 text-sm font-medium border ${activeTab === 'pendentes' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'}`}
          >{t('tab_to_review')}</button>
          <button
            type="button"
            onClick={() => setActiveTab('revisados')}
            className={`px-4 py-2 text-sm font-medium border -ml-px ${activeTab === 'revisados' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'}`}
          >{t('tab_reviewed')}</button>
        </div>
      </div>

      <div className="px-4 flex flex-wrap gap-2 items-center mb-3">
        <div className="flex items-center">
          <span className="mr-2 text-sm text-slate-700 dark:text-slate-300">Período</span>
          <select
            value={periodoId ?? ''}
            onChange={(e) => setPeriodoId(Number(e.target.value) || null)}
            className="min-w-[180px] w-[220px] rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5"
          >
            {periodos.map((p) => {
               const label = (p.descricao || '').replace(/\s*-\s*Unidade\s+\d+/i, '');
               const companyPrefix = p.empresa_nome ? `${p.empresa_nome} - ` : '';
               return (
                 <option key={p.id} value={p.id}>{companyPrefix}{p.codigo} - {label}</option>
               );
            })}
          </select>
        </div>
      {/* Filtro rápido removido para liberar espaço */}

      {/* Filtro avançado obrigatório por responsabilidade */}
      <div className="flex items-end gap-2">
        <Select label="" name="filterType" value={filterType} onChange={(e) => setFilterType(e.target.value)} className="min-w-[150px] md:min-w-[160px]">
          <option value="ug">{t('filter_ug')}</option>
          <option value="cc">{t('filter_cc')}</option>
          <option value="classe">{t('filter_class')}</option>
          <option value="valor">{t('filter_value')}</option>
          <option value="vencimento">{t('filter_due_18m') || 'Vencimento \u2264 18 meses'}</option>
        </Select>

        {filterType === 'classe' && (
          <Select label="" name="filterValue" value={filterValue} onChange={(e) => setFilterValue(e.target.value)} className="w-56 shrink-0">
            <option value="">{t('all')}</option>
            {uniqueClasses.map((c) => (
              <option key={c} value={c}>{classDesc.get(c) ? `${c} - ${classDesc.get(c)}` : c}</option>
            ))}
          </Select>
        )}
        {filterType === 'cc' && (
          <Select label="" name="filterValue" value={filterValue} onChange={(e) => setFilterValue(e.target.value)} className="w-36 md:w-40 shrink-0">
            <option value="">{t('all')}</option>
            {uniqueCCs.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        )}
        {filterType === 'ug' && (
          <Select label="" name="filterValue" value={filterValue} onChange={(e) => setFilterValue(e.target.value)} className="w-40 shrink-0">
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
        <Input label="" name="advQuery" placeholder={filterType === 'valor' ? t('exact_value_placeholder') : t('search_item_placeholder')} value={advancedQuery} onChange={(e) => setAdvancedQuery(e.target.value)} className={filterType === 'valor' ? 'w-32 md:w-40' : 'flex-1 min-w-0'} />

        {/* Indicadores à direita como badges (estilo Delegações) + botão de revisão em massa */}
        <div className="ml-auto flex items-center gap-2">
          <span
            className="badge badge-primary"
            title={activeTab === 'pendentes' ? (t('to_review_count_tooltip') || 'A revisar / Delegados') : (t('reviewed_count_tooltip') || 'Revisados / Delegados')}
            aria-label={activeTab === 'pendentes' ? (t('to_review_count_tooltip') || 'A revisar / Delegados') : (t('reviewed_count_tooltip') || 'Revisados / Delegados')}
          >{activeTab === 'pendentes' ? `${availableCount}/${delegatedCount}` : `${reviewedCount}/${delegatedCount}`}</span>
          {activeTab === 'pendentes' && (
            <>
              <span
                className="badge badge-secondary"
                title={t('selected_items_tooltip') || 'Selecionados'}
                aria-label={t('selected_items_tooltip') || 'Selecionados'}
              >{selected.size}</span>
              <button
                type="button"
                onClick={() => setMassDialogOpen(true)}
                disabled={selected.size === 0 || isPeriodClosed}
                title={t('apply_mass_revision')}
                aria-label={t('apply_mass_revision')}
                className="ml-1 inline-flex items-center justify-center h-9 w-9 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <SlidersHorizontal size={18} />
              </button>
            </>
          )}
        </div>
      </div>
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <span>{isConnError(error) ? t('backend_unreachable') : error}</span>
            <button type="button" onClick={retryLoad} className="px-2 py-1 rounded border bg-white dark:bg-slate-900 border-red-300 text-red-700">
              {t('retry')}
            </button>
          </div>
        )}
      </div>

      <div className="px-4">
        <div className="min-w-0">
          {/* Tabela principal */}
          <div className="mb-3">
            {loading ? (
              <div className="p-4 text-slate-700 dark:text-slate-300">{t('loading_items')}</div>
            ) : (
              <Table
                columns={columns}
                data={sorted}
                getRowClassName={(row) => {
                  const target = parseDate(row.data_fim_revisada) || parseDate(row.data_fim_depreciacao);
                  const m = monthsUntil(target);
                  const isSoon = m >= 0 && m <= 18;
                  return isSoon ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' : '';
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Popup de Revisão em Massa (espelho da revisão individual) */}
      {massDialogOpen && activeTab === 'pendentes' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-30">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg w-full max-w-2xl p-4 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('mass_panel_title')}</h3>
              <button
                type="button"
                onClick={() => setMassDialogOpen(false)}
                className="px-2 py-1 rounded border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-sm"
              >
                {t('close', { defaultValue: 'Fechar' })}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">{t('physical_condition_label')}</label>
                <select
                  value={form.condicao_fisica}
                  onChange={(e) => setForm({ ...form, condicao_fisica: e.target.value })}
                  disabled={isPeriodClosed}
                  className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2 disabled:bg-slate-100 dark:disabled:bg-slate-800"
                >
                  <option value="">{t('select')}</option>
                  <option value="Bom">{t('physical_condition_good')}</option>
                  <option value="Regular">{t('physical_condition_regular')}</option>
                  <option value="Ruim">{t('physical_condition_bad')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">{t('increment_label')}</label>
                <select
                  value={form.incremento}
                  onChange={(e) => {
                    const novoInc = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      incremento: novoInc,
                      motivo: '',
                      justificativa: novoInc === 'Manter' ? 'A vida útil está correta' : '',
                      nova_vida_anos: novoInc === 'Manter' ? '' : prev.nova_vida_anos,
                      nova_vida_meses: novoInc === 'Manter' ? '' : prev.nova_vida_meses,
                      nova_data_fim: novoInc === 'Manter' ? '' : prev.nova_data_fim,
                    }));
                  }}
                  disabled={isPeriodClosed}
                  className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2 disabled:bg-slate-100 dark:disabled:bg-slate-800"
                >
                  <option value="Acréscimo">{t('increment_increase')}</option>
                  <option value="Decréscimo">{t('increment_decrease')}</option>
                  <option value="Manter">{t('increment_keep')}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">{t('new_life_years_label')}</label>
                <input
                  type="number"
                  min="0"
                  value={form.nova_vida_anos}
                  onChange={(e) => {
                    const anos = e.target.value;
                    const meses = Number(form.nova_vida_meses || 0);
                    const refStart = (() => {
                      const firstSel = Array.from(selected)[0];
                      const it = firstSel ? items.find((x) => x.id === firstSel) : sorted[0];
                      return it ? parseDate(it.data_inicio_depreciacao) : null;
                    })();
                    let novaFimCalc = form.nova_data_fim;
                    if (refStart) {
                      const total = Number(anos || 0) * 12 + meses;
                      const d = addMonths(refStart, total);
                      novaFimCalc = toISO(d);
                    }
                    setForm({ ...form, nova_vida_anos: anos, nova_data_fim: novaFimCalc });
                  }}
                  disabled={isPeriodClosed || form.incremento === 'Manter'}
                  className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2 disabled:bg-slate-100 dark:disabled:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">{t('new_life_months_label')}</label>
                <input
                  type="number"
                  min="0"
                  max="11"
                  value={form.nova_vida_meses}
                  onChange={(e) => {
                    const meses = e.target.value;
                    const anos = Number(form.nova_vida_anos || 0);
                    const refStart = (() => {
                      const firstSel = Array.from(selected)[0];
                      const it = firstSel ? items.find((x) => x.id === firstSel) : sorted[0];
                      return it ? parseDate(it.data_inicio_depreciacao) : null;
                    })();
                    let novaFimCalc = form.nova_data_fim;
                    if (refStart) {
                      const total = anos * 12 + Number(meses || 0);
                      const d = addMonths(refStart, total);
                      novaFimCalc = toISO(d);
                    }
                    setForm({ ...form, nova_vida_meses: meses, nova_data_fim: novaFimCalc });
                  }}
                  disabled={isPeriodClosed || form.incremento === 'Manter'}
                  className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2 disabled:bg-slate-100 dark:disabled:bg-slate-800"
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">{t('new_end_date_label')}</label>
              <input
                type="date"
                value={form.nova_data_fim}
                onChange={(e) => {
                  const iso = e.target.value;
                  const refStart = (() => {
                    const firstSel = Array.from(selected)[0];
                    const it = firstSel ? items.find((x) => x.id === firstSel) : sorted[0];
                    return it ? parseDate(it.data_inicio_depreciacao) : null;
                  })();
                  let anosStr = form.nova_vida_anos;
                  let mesesStr = form.nova_vida_meses;
                  if (refStart) {
                    const end = parseDate(iso);
                    const total = monthsDiff(refStart, end);
                    const { anos, meses } = splitYearsMonths(total);
                    anosStr = anos == null ? '' : String(anos);
                    mesesStr = meses == null ? '' : String(meses);
                  }
                  setForm({ ...form, nova_data_fim: iso, nova_vida_anos: anosStr, nova_vida_meses: mesesStr });
                }}
                disabled={form.incremento === 'Manter' || isPeriodClosed}
                className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2 disabled:bg-slate-100 dark:disabled:bg-slate-800"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">{t('reason_label')}</label>
              <select
                value={form.motivo}
                onChange={(e) => {
                  const val = e.target.value;
                  const selectedText = e.target.options[e.target.selectedIndex]?.text || val;
                  setForm((prev) => ({ ...prev, motivo: val, justificativa: selectedText }));
                }}
                disabled={isPeriodClosed}
                className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2 disabled:bg-slate-100 dark:disabled:bg-slate-800"
              >
                <option value="">{t('select_reason')}</option>
                {(form.incremento === 'Acréscimo' ? motivosAumento : form.incremento === 'Decréscimo' ? motivosReducao : motivosManter).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="mb-2">
              <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">{t('justification_label')}</label>
              <textarea
                value={form.justificativa}
                rows={3}
                placeholder={t('justification_placeholder')}
                disabled
                className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2 disabled:bg-slate-100 dark:disabled:bg-slate-800"
              />
            </div>

            <div className="flex justify-end items-center gap-2 mt-3">
              {isPeriodClosed && (
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  Período Fechado - Somente Leitura
                </span>
              )}
              <button
                type="button"
                onClick={() => setMassDialogOpen(false)}
                className="px-3 py-2 rounded border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-sm"
              >
                {t('cancel', { defaultValue: 'Cancelar' })}
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={isPeriodClosed || selected.size === 0}
                className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('apply_mass_revision')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de prévia comparativa */}
      {previewOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-800 w-[95%] max-w-4xl">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('preview_title', { defaultValue: 'Prévia das alterações' })}</h4>
              <button type="button" onClick={() => setPreviewOpen(false)} className="px-2 py-1 rounded border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700">{t('close', { defaultValue: 'Fechar' })}</button>
            </div>
            <div className="p-4 overflow-auto max-h-[60vh]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-700 dark:text-slate-300">
                    <th className="py-2 pr-2">{t('col_asset_number', { defaultValue: 'Imobilizado' })}</th>
                    <th className="py-2 pr-2">{t('col_depr_end', { defaultValue: 'Fim da depreciação' })}</th>
                    <th className="py-2 pr-2">{t('col_new_end_date', { defaultValue: 'Nova data fim' })}</th>
                    <th className="py-2 pr-2">{t('difference_label', { defaultValue: 'Diferença' })}</th>
                    <th className="py-2 pr-2">{t('increment_label', { defaultValue: 'Incremento' })}</th>
                    <th className="py-2 pr-2">{t('alert_label', { defaultValue: 'Alerta' })}</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((r) => (
                    <tr key={r.id} className="border-t border-slate-200 dark:border-slate-800">
                      <td className="py-2 pr-2">{r.numero_imobilizado}</td>
                      <td className="py-2 pr-2">{formatDateBR(toISO(r.fimAtual))}</td>
                      <td className="py-2 pr-2">{formatDateBR(toISO(r.novaFim))}</td>
                      <td className="py-2 pr-2">{r.diffAnosStr}</td>
                      <td className="py-2 pr-2">{r.incCalc}</td>
                      <td className="py-2 pr-2">{r.alerta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button type="button" onClick={() => setPreviewOpen(false)} className="px-3 py-2 rounded border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700">{t('cancel', { defaultValue: 'Cancelar' })}</button>
              <button type="button" onClick={confirmApply} className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">{t('confirm_apply', { defaultValue: 'Confirmar aplicação' })}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
