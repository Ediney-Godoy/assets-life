import React from 'react';
import { useTranslation } from 'react-i18next';
import Table from '../components/ui/Table';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { getReviewPeriods, getReviewItems, updateReviewItem, getManagementUnits, getCostCenters, listarComentariosRVU, responderComentarioRVU, getReviewDelegations, getClassesContabeis } from '../apiClient';

export default function RevisaoVidasUteis() {
  const { t } = useTranslation();
  const [periodos, setPeriodos] = React.useState([]);
  const [periodoId, setPeriodoId] = React.useState(null);
  const [items, setItems] = React.useState([]);
  const [delegacoes, setDelegacoes] = React.useState([]);
  // Filtros avançados (mesmos da tela de Revisões em Massa)
  const [filterType, setFilterType] = React.useState('cc'); // 'ug' | 'cc' | 'classe' | 'valor'
  const [filterValue, setFilterValue] = React.useState('');
  const [valorMin, setValorMin] = React.useState('');
  const [valorMax, setValorMax] = React.useState('');
  const [advancedQuery, setAdvancedQuery] = React.useState('');
  // Dados auxiliares para mapear CC -> UG
  const [ugs, setUgs] = React.useState([]);
  const [costCenters, setCostCenters] = React.useState([]);
  const [classesInfo, setClassesInfo] = React.useState([]); // New state for classes info
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [editingItem, setEditingItem] = React.useState(null);
  const [editForm, setEditForm] = React.useState({ revisada_anos: '', revisada_meses: '', nova_data_fim: '', condicao_fisica: '', incremento: 'Manter', motivo: '', justificativa: 'A vida útil está correta' });
  const [activeTab, setActiveTab] = React.useState('pendentes'); // 'pendentes' | 'revisados'
  // Comentários supervisor -> revisor
  const [commentsItem, setCommentsItem] = React.useState(null);
  const [commentsList, setCommentsList] = React.useState([]);
  const [replyText, setReplyText] = React.useState('');
  const [commentsCount, setCommentsCount] = React.useState(() => new Map());

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
        const empresaId = localStorage.getItem('assetlife_empresa');
        const [ugData, ccData, classesData] = await Promise.all([
          getManagementUnits(),
          getCostCenters(),
          empresaId ? getClassesContabeis({ empresa_id: empresaId }) : Promise.resolve([]),
        ]);
        setUgs(Array.isArray(ugData) ? ugData : []);
        setCostCenters(Array.isArray(ccData) ? ccData : []);
        setClassesInfo(Array.isArray(classesData) ? classesData : []);
      } catch (_) {
        setUgs([]);
        setCostCenters([]);
        setClassesInfo([]);
      }
    };
    loadAux();
  }, []);

  React.useEffect(() => {
    const loadItems = async () => {
      if (!periodoId) return;
      setLoading(true);
      setError('');
      try {
        const [data, ds] = await Promise.all([
          getReviewItems(periodoId),
          getReviewDelegations(periodoId),
        ]);
        setItems(data);
        setDelegacoes(Array.isArray(ds) ? ds : []);
      } catch (err) {
        setError(String(err?.message || err));
        setDelegacoes([]);
      } finally {
        setLoading(false);
      }
    };
    loadItems();
  }, [periodoId]);

  const getUserId = React.useCallback(() => { try { return JSON.parse(localStorage.getItem('assetlife_user') || 'null')?.id || null; } catch { return null; } }, []);

  const periodoSelecionado = React.useMemo(() => periodos.find((p) => p.id === periodoId) || null, [periodoId, periodos]);
  const periodoEncerrado = periodoSelecionado?.status === 'Encerrado' || Boolean(periodoSelecionado?.data_fechamento);

  // Helpers para datas e ordenação por próximos 18 meses
  const parseDate = (str) => {
    if (!str) return null;
    // assume YYYY-MM-DD
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

  const formatNumberBR = (num) => {
    if (num === null || num === undefined) return '-';
    const n = Number(num);
    if (Number.isNaN(n)) return '-';
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  };

  const parseDecimal = (s) => {
    const str = String(s || '').trim();
    if (!str) return null;
    const norm = str.replace(/\./g, '').replace(/,/g, '.');
    const n = Number(norm);
    return Number.isFinite(n) ? n : null;
  };

  const monthsUntil = (target) => {
    if (!target) return Infinity;
    const now = new Date();
    let months = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
    // Ajuste por dia do mês
    if (target.getDate() < now.getDate()) months -= 1;
    return months;
  };

  const monthsDiff = (start, end) => {
    if (!start || !end) return null;
    let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (end.getDate() < start.getDate()) months -= 1;
    return months;
  };

  const splitYearsMonths = (totalMonths) => {
    if (totalMonths === null || totalMonths === undefined) return { anos: null, meses: null };
    const m = Number(totalMonths);
    if (Number.isNaN(m) || m < 0) return { anos: null, meses: null };
    const anos = Math.floor(m / 12);
    const meses = m % 12;
    return { anos, meses };
  };

  const addMonths = (dateObj, months) => {
    if (!dateObj || months == null) return null;
    const d = new Date(dateObj.getTime());
    const y = d.getFullYear();
    const m = d.getMonth();
    const targetMonth = m + Number(months);
    const ty = y + Math.floor(targetMonth / 12);
    const tm = targetMonth % 12;
    // Ajusta fim de mês
    const endOfTargetMonth = new Date(ty, tm + 1, 0).getDate();
    const day = Math.min(d.getDate(), endOfTargetMonth);
    return new Date(ty, tm, day);
  };

  // Motivos por incremento vindos do i18n (arrays de strings traduzidas)
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

  const isItemRevisado = (it) => {
    const normalize = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const s = normalize(it.status);
    const statusReviewed = (s === 'revisado' || s === 'revisada' || s === 'aprovado' || s === 'concluido');
    const adjusted = Boolean(it.alterado);
    const hasJustification = Boolean(String(it.justificativa || '').trim());
    const hasCondicao = Boolean(String(it.condicao_fisica || '').trim());
    return statusReviewed || adjusted || hasJustification || hasCondicao;
  };

  const columns = [
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
    { key: 'vida_util_anos', header: t('col_useful_life_years') },
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
    { key: 'comentarios', header: '💬', render: (_v, row) => (
      <button
        className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
        title="Ver comentários do supervisor"
        onClick={(e) => { e.stopPropagation(); openComments(row); }}
      >{commentsCount.get(row.id) ?? 0}</button>
    )},
  ];

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

  const currentUserId = React.useMemo(() => { try { return JSON.parse(localStorage.getItem('assetlife_user') || 'null')?.id || null; } catch { return null; } }, []);
  const myItemIds = React.useMemo(() => {
    const uid = currentUserId;
    if (!uid) return new Set();
    const list = Array.isArray(delegacoes) ? delegacoes : [];
    return new Set(list.filter((d) => String(d.revisor_id ?? d.revisorId ?? d.revisor) === String(uid)).map((d) => d.ativo_id));
  }, [delegacoes, currentUserId]);

  const filteredByTab = React.useMemo(() => {
    const base = (items || []).filter((i) => myItemIds.size > 0 && myItemIds.has(i.id));
    return base.filter((it) => (activeTab === 'revisados' ? isItemRevisado(it) : !isItemRevisado(it)));
  }, [items, activeTab, myItemIds]);

  const delegatedFilteredBase = React.useMemo(() => {
    let list = (items || []).filter((i) => myItemIds.size > 0 && myItemIds.has(i.id));
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
    const fv = String(filterValue || '').trim().toLowerCase();
    if (filterType === 'cc' && fv) {
      list = list.filter((i) => String(i.centro_custo || '').toLowerCase().includes(fv));
    } else if (filterType === 'classe' && fv) {
      list = list.filter((i) => String(i.classe || '').toLowerCase().includes(fv));
    } else if (filterType === 'ug' && fv) {
      list = list.filter((i) => {
        const directCode = String(i.ug_codigo || i.unidade_gerencial || i.ug || '').toLowerCase();
        const directName = String(i.ug_nome || i.unidade_gerencial_nome || '').toLowerCase();
        if (directCode || directName) {
          return directCode.includes(fv) || directName.includes(fv);
        }
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
    return list;
  }, [items, myItemIds, advancedQuery, filterType, filterValue, valorMin, valorMax, ccByCodigo, ugById]);

  const delegatedFilteredCount = React.useMemo(() => delegatedFilteredBase.length, [delegatedFilteredBase]);
  const availableFilteredCount = React.useMemo(() => delegatedFilteredBase.filter((it) => !isItemRevisado(it)).length, [delegatedFilteredBase]);
  const reviewedFilteredCount = React.useMemo(() => delegatedFilteredBase.filter((it) => isItemRevisado(it)).length, [delegatedFilteredBase]);

  const filtered = React.useMemo(() => {
    let list = [...filteredByTab];
    // Complemento via campo editável (mesmo padrão da tela de Massa)
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
        const directCode = String(i.ug_codigo || i.unidade_gerencial || i.ug || '').toLowerCase();
        const directName = String(i.ug_nome || i.unidade_gerencial_nome || '').toLowerCase();
        if (directCode || directName) {
          return directCode.includes(fv) || directName.includes(fv);
        }
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

    return list;
  }, [filteredByTab, advancedQuery, filterType, filterValue, valorMin, valorMax, ccByCodigo, ugById]);

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
      // Ambos são soon ou ambos não: ordenar por meses ascendente
      return aMonths - bMonths;
    });
    return arr;
  }, [filtered]);

  const currentClassInfo = React.useMemo(() => {
    if (!editingItem || !classesInfo.length) return null;
    return classesInfo.find(c => String(c.codigo) === String(editingItem.classe));
  }, [editingItem, classesInfo]);

  const handleStartEdit = (row) => {
    setEditingItem(row);
    setEditForm({
      revisada_anos: row.vida_util_revisada != null ? Math.floor(Number(row.vida_util_revisada) / 12) : '',
      revisada_meses: row.vida_util_revisada != null ? (Number(row.vida_util_revisada) % 12) : '',
      nova_data_fim: row.data_fim_revisada || '',
      condicao_fisica: row.condicao_fisica ?? '',
      incremento: row.auxiliar2 ?? 'Manter',
      motivo: row.auxiliar3 ?? '',
      justificativa: (row.auxiliar2 ?? 'Manter') === 'Manter' ? (row.justificativa ?? 'A vida útil está correta') : (row.justificativa ?? ''),
    });
  };

  const openComments = async (row) => {
    try {
      const list = await listarComentariosRVU(row.id);
      const arr = Array.isArray(list) ? list : [];
      setCommentsList(arr);
      setCommentsItem(row);
      setReplyText('');
      setCommentsCount((prev) => new Map(prev).set(row.id, arr.length));
    } catch (err) {
      setCommentsList([]);
      setCommentsItem(row);
    }
  };

  const sendReply = async (c) => {
    const revisorId = getUserId();
    if (!revisorId) { setError(t('error_missing_user') || 'Usuário não identificado'); return; }
    if (!replyText.trim()) { setError(t('error_reply_required') || 'Resposta obrigatória'); return; }
    try {
      await responderComentarioRVU({ comentario_id: c.id, revisor_id: revisorId, resposta: replyText.trim(), periodo_id: periodoId });
      const refreshed = await listarComentariosRVU(commentsItem.id);
      const arr = Array.isArray(refreshed) ? refreshed : [];
      setCommentsList(arr);
      setCommentsCount((prev) => new Map(prev).set(commentsItem.id, arr.length));
      setReplyText('');
    } catch (err) {
      setError(String(err?.message || err));
    }
  };

  const handleSave = async () => {
    if (!editingItem || !periodoId) return;
    // Guardar: exige data de início da nova vida útil definida no cadastro de períodos
    const periodoSel = periodos.find((p) => p.id === periodoId);
    if (!periodoSel?.data_inicio_nova_vida_util) {
      setError(t('error_missing_start_new_useful_life_date'));
      return;
    }
    try {
      // Converter entrada em anos + meses para meses totais (12 meses/ano)
      let mesesRevisados = null;
      const anosInformados = editForm.revisada_anos === '' ? null : Number(editForm.revisada_anos);
      const mesesInformados = editForm.revisada_meses === '' ? null : Number(editForm.revisada_meses);
      if (anosInformados !== null || mesesInformados !== null) {
        const a = Number(anosInformados || 0);
        const m = Number(mesesInformados || 0);
        mesesRevisados = a * 12 + m;
      }

      // Bidirecional: se usuário informou nova_data_fim, recalculamos mesesRevisados com base no início do período
      const inicioNovaVida = parseDate(periodoSel.data_inicio_nova_vida_util);
      const novaFim = parseDate(editForm.nova_data_fim);
      if (!mesesRevisados && novaFim && inicioNovaVida) {
        const m = monthsDiff(inicioNovaVida, novaFim);
        mesesRevisados = m;
      }

      // Validações e avisos
      const now = new Date();
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthsToEnd = novaFim ? monthsUntil(novaFim) : (mesesRevisados != null ? monthsUntil(addMonths(inicioNovaVida, mesesRevisados)) : null);
      
      // Fallback: se vida_util_periodos for 0 ou nulo, tentar usar vida_util_anos * 12
      const originalMonths = Number(editingItem.vida_util_periodos || (editingItem.vida_util_anos ? editingItem.vida_util_anos * 12 : 0));

      // Comparação deve ser feita sobre a vida útil TOTAL (início da depreciação -> nova data fim)
      const inicioOriginal = parseDate(editingItem.data_inicio_depreciacao);
      const novoFimCalculado = novaFim || (inicioNovaVida && mesesRevisados != null ? addMonths(inicioNovaVida, mesesRevisados) : null);
      const totalNewMonths = (inicioOriginal && novoFimCalculado) ? monthsDiff(inicioOriginal, novoFimCalculado) : null;
      
      // Recuperar data fim original para comparação fina (em dias) quando meses são iguais
      const fimOriginal = editingItem.data_fim_revisada ? parseDate(editingItem.data_fim_revisada) : parseDate(editingItem.data_fim_depreciacao);

      if (editForm.incremento !== 'Manter' && novaFim && novaFim < startOfThisMonth) {
        const ok = window.confirm(t('confirm_past_end_msg') || 'A nova data de fim está anterior ao mês corrente. Deseja continuar?');
        if (!ok) return;
      }
      if (editForm.incremento !== 'Manter' && monthsToEnd != null && monthsToEnd >= 0 && monthsToEnd <= 18) {
        // Requer justificativa
        if (!editForm.justificativa) {
          setError(t('warning_less_18_months_require_justification') || 'Itens com vencimento < 18 meses exigem justificativa.');
          return;
        }
      }
      if ((editForm.incremento === 'Decréscimo') && (mesesRevisados != null) && originalMonths > 0 && (mesesRevisados < Math.floor(originalMonths / 2))) {
        const ok = window.confirm(t('confirm_drastic_reduction') || 'Redução drástica de vida útil detectada (>50%). Deseja continuar?');
        if (!ok) return;
      }
      // Regras de incremento coerentes com a opção selecionada
      if (editForm.incremento === 'Manter') {
        mesesRevisados = null; // ignora alterações de vida útil
      } else if (editForm.incremento === 'Decréscimo') {
        // Para redução, a vida útil TOTAL deve ser menor que a original
        // Permite se meses iguais mas data efetiva menor (ajuste de dias)
        const isLessDays = (totalNewMonths === originalMonths) && (novoFimCalculado && fimOriginal && novoFimCalculado < fimOriginal);
        
        if (totalNewMonths == null || (!(totalNewMonths < originalMonths) && !isLessDays)) {
          setError(`${t('error_increment_decrease_requires_less')} (Atual: ${originalMonths}, Novo: ${totalNewMonths})`);
          return;
        }
        if (!editForm.justificativa) {
          setError(t('error_justification_required_decrease') || 'Justificativa obrigatória para redução de vida útil.');
          return;
        }
      } else if (editForm.incremento === 'Acréscimo') {
        // Para aumento, a vida útil TOTAL deve ser maior que a original
        // Permite se meses iguais mas data efetiva maior
        const isMoreDays = (totalNewMonths === originalMonths) && (novoFimCalculado && fimOriginal && novoFimCalculado > fimOriginal);

        if (totalNewMonths == null || (!(totalNewMonths > originalMonths) && !isMoreDays)) {
          setError(`${t('error_increment_increase_requires_more')} (Atual: ${originalMonths}, Novo: ${totalNewMonths})`);
          return;
        }
      }

      const payload = {
        vida_util_revisada: editForm.incremento === 'Manter' ? null : mesesRevisados,
        condicao_fisica: editForm.condicao_fisica || null,
        incremento: editForm.incremento || 'Manter',
        motivo: editForm.motivo || null,
        nova_data_fim: editForm.incremento === 'Manter' ? undefined : (editForm.nova_data_fim || undefined),
        justificativa: editForm.justificativa || null,
      };
      const updated = await updateReviewItem(periodoId, editingItem.id, payload);
      setItems((prev) => prev.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)));
      // Após salvar, recarrega itens do período para refletir campos calculados no backend
      try {
        const refreshed = await getReviewItems(periodoId);
        setItems(refreshed);
      } catch (e) {
        // Se falhar o refresh, mantém merge local para não interromper fluxo
      }
      setEditingItem(null);
    } catch (err) {
      setError(String(err?.message || err));
    }
  };

  // Removido: edição do cabeçalho do período ocorre no cadastro de períodos

  return (
    <section>
      <div className="mb-2 px-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{t('review_title')}</h2>
      </div>

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
            className="min-w-[240px] w-[320px] md:w-[380px] rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5"
          >
            {periodos.map((p) => (
              <option key={p.id} value={p.id}>{p.codigo} - {p.descricao}</option>
            ))}
          </select>
        </div>

        {/* Filtros avançados: UG/CC/Classe/Valor + Pesquisa */}
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
          <div className="ml-auto flex items-center gap-2">
            <span
              className="badge badge-primary"
              title={t('to_review_count_tooltip') || 'A revisar / Delegados'}
              aria-label={t('to_review_count_tooltip') || 'A revisar / Delegados'}
            >{availableFilteredCount}/{delegatedFilteredCount}</span>
            <span
              className="badge badge-secondary"
              title={t('reviewed_count_tooltip') || 'Revisados / Delegados'}
              aria-label={t('reviewed_count_tooltip') || 'Revisados / Delegados'}
            >{reviewedFilteredCount}/{delegatedFilteredCount}</span>
          </div>
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}
      </div>

      <div className="px-4">
        {/* Alinha a largura com a tela de Revisões em Massa quando painel está recolhido */}
        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="min-w-0 lg:col-span-12">
            {loading ? (
              <div className="p-4 text-slate-700 dark:text-slate-300">{t('loading_items')}</div>
            ) : (
              <>
              <Table
                columns={columns}
                data={sorted}
                className="w-full pr-1"
                onRowClick={handleStartEdit}
                getRowClassName={(row) => {
                  const target = parseDate(row.data_fim_revisada) || parseDate(row.data_fim_depreciacao);
                  const m = monthsUntil(target);
                  const isSoon = m >= 0 && m <= 18;
                  return isSoon ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' : '';
                }}
              />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de comentários supervisor -> revisor */}
      {commentsItem && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={() => setCommentsItem(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg w-full max-w-xl p-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Comentários do supervisor</h3>
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {commentsList.map((c) => (
                <div key={c.id} className="p-2 rounded border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500">{new Date(c.data_comentario).toLocaleString('pt-BR')} • Supervisor: {c.supervisor_id}</div>
                  <div className="text-sm mb-1">{c.comentario}</div>
                  <div className="text-xs">Status: {c.status} • Tipo: {c.tipo}</div>
                  {c.resposta ? (
                    <div className="mt-1 pl-2 border-l-2 border-slate-300">
                      <div className="text-xs text-slate-500">Resposta ({new Date(c.data_resposta).toLocaleString('pt-BR')} • {c.respondido_por})</div>
                      <div className="text-sm">{c.resposta}</div>
                    </div>
                  ) : (
                    !periodoEncerrado && (
                      <div className="mt-2">
                        <label className="block text-sm mb-1">Responder</label>
                        <textarea className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2" value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Escreva sua resposta" />
                        <div className="mt-2 flex gap-2">
                          <button className="px-3 py-1 rounded border" onClick={() => setCommentsItem(null)}>Fechar</button>
                          <button className="px-3 py-1 rounded bg-blue-600 text-white" onClick={() => sendReply(c)}>Responder</button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ))}
              {commentsList.length === 0 && <div className="text-xs text-slate-500">Sem comentários.</div>}
            </div>
            {periodoEncerrado && (
              <div className="mt-2 text-xs text-amber-700">⚠️ Período encerrado: respostas bloqueadas.</div>
            )}
          </div>
        </div>
      )}

      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg w-full max-w-2xl p-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">{t('edit_review_title')}</h3>
            {error && <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
            
            {currentClassInfo && (
              <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-blue-800 dark:text-blue-200 border border-blue-100 dark:border-blue-800">
                <div className="font-semibold mb-1 flex items-center gap-2">
                  <span className="text-lg">ℹ️</span>
                  <span>{t('class_reference_values') || 'Valores de Referência'} ({currentClassInfo.codigo})</span>
                </div>
                <div className="grid grid-cols-2 gap-4 ml-7">
                  <div>
                    <span className="font-medium">{t('std_lifespan') || 'Vida Útil Padrão'}:</span> {currentClassInfo.vida_util_anos} {t('years') || 'anos'}
                  </div>
                  <div>
                    <span className="font-medium">{t('std_depreciation') || 'Taxa Depreciação'}:</span> {currentClassInfo.taxa_depreciacao}% a.a.
                  </div>
                </div>
              </div>
            )}

            {currentClassInfo && editForm.incremento !== 'Manter' && (() => {
              const stdYears = Number(currentClassInfo.vida_util_anos);
              if (!stdYears) return null;
              
              const inicioOriginal = parseDate(editingItem.data_inicio_depreciacao);
              let novaFim = parseDate(editForm.nova_data_fim);
              
              if (!novaFim && (editForm.revisada_anos !== '' || editForm.revisada_meses !== '')) {
                  const inicioNova = periodoSelecionado?.data_inicio_nova_vida_util ? parseDate(periodoSelecionado.data_inicio_nova_vida_util) : null;
                  if (inicioNova) {
                      const a = Number(editForm.revisada_anos || 0);
                      const m = Number(editForm.revisada_meses || 0);
                      novaFim = addMonths(inicioNova, a * 12 + m);
                  }
              }
              
              if (inicioOriginal && novaFim) {
                  const totalMonths = monthsDiff(inicioOriginal, novaFim);
                  const totalYears = totalMonths / 12;
                  const diff = totalYears - stdYears;
                  const pct = (diff / stdYears) * 100;
                  
                  if (Math.abs(pct) > 50) {
                      return (
                          <div className="mb-3 p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-sm rounded border border-amber-200 dark:border-amber-800 flex items-center gap-2">
                              <span className="text-lg">⚠️</span>
                              <span>
                                  {t('warning_deviation_from_standard') || 'Atenção: A vida útil total projetada desvia significativamente do padrão.'}
                                  {' '}({totalYears.toFixed(1)} vs {stdYears} {t('years') || 'anos'})
                              </span>
                          </div>
                      );
                  }
              }
              return null;
            })()}

            {/* Linha 1: Condição Física e Incremento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">{t('physical_condition_label')}</label>
                <select
                  value={editForm.condicao_fisica}
                  onChange={(e) => setEditForm({ ...editForm, condicao_fisica: e.target.value })}
                  className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2"
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
                  value={editForm.incremento}
                  onChange={(e) => {
                    const novoInc = e.target.value;
                    setEditForm((prev) => ({
                      ...prev,
                      incremento: novoInc,
                      motivo: '',
                      justificativa: novoInc === 'Manter' ? 'A vida útil está correta' : '',
                      revisada_anos: novoInc === 'Manter' ? '' : prev.revisada_anos,
                      revisada_meses: novoInc === 'Manter' ? '' : prev.revisada_meses,
                      nova_data_fim: novoInc === 'Manter' ? '' : prev.nova_data_fim,
                    }));
                  }}
                  disabled={periodoEncerrado}
                  className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2 disabled:bg-slate-100 dark:disabled:bg-slate-800"
                >
                  <option value="Acréscimo">{t('increment_increase')}</option>
                  <option value="Decréscimo">{t('increment_decrease')}</option>
                  <option value="Manter">{t('increment_keep')}</option>
                </select>
              </div>
            </div>

            {/* Linha 2: Nova vida útil (anos e meses) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">{t('new_life_years_label')}</label>
                <input
                  type="number"
                  min="0"
                  value={editForm.revisada_anos}
                  onChange={(e) => {
                    const val = e.target.value;
                    const periodoSel = periodos.find((p) => p.id === periodoId);
                    const inicioNovaVida = parseDate(periodoSel?.data_inicio_nova_vida_util);
                    const anos = Number(val || 0);
                    const meses = Number(editForm.revisada_meses || 0);
                    const total = anos * 12 + meses;
                    const fim = addMonths(inicioNovaVida, total);
                    setEditForm({ ...editForm, revisada_anos: val, nova_data_fim: toISO(fim) });
                  }}
                  disabled={editForm.incremento === 'Manter'}
                  className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2 disabled:bg-slate-100 dark:disabled:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">{t('new_life_months_label')}</label>
                <input
                  type="number"
                  min="0"
                  max="11"
                  value={editForm.revisada_meses}
                  onChange={(e) => {
                    const val = e.target.value;
                    const periodoSel = periodos.find((p) => p.id === periodoId);
                    const inicioNovaVida = parseDate(periodoSel?.data_inicio_nova_vida_util);
                    const anos = Number(editForm.revisada_anos || 0);
                    const meses = Number(val || 0);
                    const total = anos * 12 + meses;
                    const fim = addMonths(inicioNovaVida, total);
                    setEditForm({ ...editForm, revisada_meses: val, nova_data_fim: toISO(fim) });
                  }}
                  disabled={editForm.incremento === 'Manter'}
                  className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2 disabled:bg-slate-100 dark:disabled:bg-slate-800"
                />
              </div>
            </div>

            {/* Linha 2b: Nova data fim (bidirecional) */}
            <div className="mb-3">
              <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">{t('new_end_date_label')}</label>
              <input
                type="date"
                value={editForm.nova_data_fim}
                onChange={(e) => {
                  const val = e.target.value;
                  const periodoSel = periodos.find((p) => p.id === periodoId);
                  const inicioNovaVida = parseDate(periodoSel?.data_inicio_nova_vida_util);
                  const novaFim = parseDate(val);
                  let total = null;
                  if (inicioNovaVida && novaFim) total = monthsDiff(inicioNovaVida, novaFim);
                  const { anos, meses } = splitYearsMonths(total);
                  setEditForm({ ...editForm, nova_data_fim: val, revisada_anos: anos ?? '', revisada_meses: meses ?? '' });
                }}
                disabled={editForm.incremento === 'Manter'}
                className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2 disabled:bg-slate-100 dark:disabled:bg-slate-800"
              />
              {/* Avisos contextuais */}
              {(() => {
                const periodoSel = periodos.find((p) => p.id === periodoId);
                const inicioNovaVida = parseDate(periodoSel?.data_inicio_nova_vida_util);
                const novaFim = parseDate(editForm.nova_data_fim);
                const monthsToEnd = novaFim ? monthsUntil(novaFim) : null;
                const originalMonths = Number(editingItem?.vida_util_periodos || 0);
                const revisadosTotal = (editForm.revisada_anos || editForm.revisada_meses) ? (Number(editForm.revisada_anos || 0) * 12 + Number(editForm.revisada_meses || 0)) : (inicioNovaVida && novaFim ? monthsDiff(inicioNovaVida, novaFim) : null);
                return (
                  <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    {monthsToEnd != null && monthsToEnd >= 0 && monthsToEnd <= 18 && (
                      <div className="text-amber-600 dark:text-amber-400">{t('warning_less_18_months') || 'Atenção: vencimento em menos de 18 meses.'}</div>
                    )}
                    {(editForm.incremento === 'Decréscimo') && revisadosTotal != null && originalMonths > 0 && (revisadosTotal < Math.floor(originalMonths / 2)) && (
                      <div className="text-red-600 dark:text-red-400">{t('warning_drastic_reduction') || 'Redução drástica (>50%) detectada.'}</div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Linha 3: Motivo dinâmico */}
            <div className="mb-3">
              <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">{t('reason_label')}</label>
              <select
                value={editForm.motivo}
                onChange={(e) => {
                  const val = e.target.value;
                  const selectedText = e.target.options[e.target.selectedIndex]?.text || val;
                  setEditForm((prev) => ({ ...prev, motivo: val, justificativa: selectedText }));
                }}
                className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2"
              >
                <option value="">{t('select_reason')}</option>
                {(
                  editForm.incremento === 'Acréscimo' ? motivosAumento :
                  editForm.incremento === 'Decréscimo' ? motivosReducao :
                  motivosManter
                ).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Justificativa dinâmica */}
            <div className="mb-2">
              <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">{t('justification_label')}</label>
              <textarea
                value={editForm.justificativa}
                onChange={(e) => setEditForm({ ...editForm, justificativa: e.target.value })}
                rows={3}
                placeholder={t('justification_placeholder')}
                disabled
                className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2 disabled:bg-slate-100 dark:disabled:bg-slate-800"
              />
            </div>

            {/* Informações do ativo */}
            <div className="mt-3 p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <div className="text-slate-500 dark:text-slate-400">{t('asset_code_label') || 'Código do ativo'}</div>
                  <div className="text-slate-800 dark:text-slate-200">{String(editingItem?.numero_imobilizado || '')}{editingItem?.sub_numero ? `/${editingItem.sub_numero}` : ''}</div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400">{t('asset_description_label') || 'Descrição'}</div>
                  <div className="text-slate-800 dark:text-slate-200">{String(editingItem?.descricao || '')}</div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400">{t('asset_start_label') || 'Início de depreciação'}</div>
                  <div className="text-slate-800 dark:text-slate-200">{formatDateBR(editingItem?.data_inicio_depreciacao)}</div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400">{t('asset_original_end_label') || 'Fim da depreciação (original)'}</div>
                  <div className="text-slate-800 dark:text-slate-200">{formatDateBR(editingItem?.data_fim_depreciacao)}</div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-3 py-2 rounded border border-slate-300 dark:border-slate-700"
              >{t('close') || t('cancel')}</button>
              {!periodoEncerrado && (
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >{t('save')}</button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
