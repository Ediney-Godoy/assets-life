import React from 'react';
import { useTranslation } from 'react-i18next';
import Table from '../components/ui/Table';
import { getReviewPeriods, getReviewItems, updateReviewItem } from '../apiClient';

export default function RevisaoVidasUteis() {
  const { t } = useTranslation();
  const [periodos, setPeriodos] = React.useState([]);
  const [periodoId, setPeriodoId] = React.useState(null);
  const [items, setItems] = React.useState([]);
  const [filter, setFilter] = React.useState({ texto: '' });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [editingItem, setEditingItem] = React.useState(null);
  const [editForm, setEditForm] = React.useState({ revisada_anos: '', revisada_meses: '', condicao_fisica: '', incremento: 'Manter', motivo: '', justificativa: '' });
  const [activeTab, setActiveTab] = React.useState('pendentes'); // 'pendentes' | 'revisados'

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

  React.useEffect(() => {
    const loadItems = async () => {
      if (!periodoId) return;
      setLoading(true);
      setError('');
      try {
        const data = await getReviewItems(periodoId);
        setItems(data);
        // dados do período já carregados via getReviewPeriods
      } catch (err) {
        setError(String(err?.message || err));
      } finally {
        setLoading(false);
      }
    };
    loadItems();
  }, [periodoId]);

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

  const formatNumberBR = (num) => {
    if (num === null || num === undefined) return '-';
    const n = Number(num);
    if (Number.isNaN(n)) return '-';
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
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
    return months < 0 ? 0 : months;
  };

  const splitYearsMonths = (totalMonths) => {
    if (totalMonths === null || totalMonths === undefined) return { anos: null, meses: null };
    const m = Number(totalMonths);
    if (Number.isNaN(m) || m < 0) return { anos: null, meses: null };
    const anos = Math.floor(m / 12);
    const meses = m % 12;
    return { anos, meses };
  };

  // Motivos por incremento vindos do i18n (arrays de strings traduzidas)
  const motivosAumento = t('review_reasons_increase', { returnObjects: true }) || [];
  const motivosReducao = t('review_reasons_decrease', { returnObjects: true }) || [];

  const isItemRevisado = (it) => {
    // Considera revisado se status for 'Revisado', ou se houve alteração, ou se tem justificativa/condição física preenchida
    return (it.status === 'Revisado') || Boolean(it.alterado) || Boolean(it.justificativa) || Boolean(it.condicao_fisica);
  };

  const columns = [
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
  ];

  const filteredByTab = React.useMemo(() => {
    return items.filter((it) => (activeTab === 'revisados' ? isItemRevisado(it) : !isItemRevisado(it)));
  }, [items, activeTab]);

  const filtered = filteredByTab.filter((it) => {
    const q = filter.texto.trim().toLowerCase();
    if (!q) return true;
    return (
      String(it.numero_imobilizado).toLowerCase().includes(q) ||
      String(it.descricao).toLowerCase().includes(q) ||
      String(it.centro_custo || '').toLowerCase().includes(q)
    );
  });

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

  const handleStartEdit = (row) => {
    setEditingItem(row);
    setEditForm({
      revisada_anos: row.vida_util_revisada != null ? Math.floor(Number(row.vida_util_revisada) / 12) : '',
      revisada_meses: row.vida_util_revisada != null ? (Number(row.vida_util_revisada) % 12) : '',
      condicao_fisica: row.condicao_fisica ?? '',
      incremento: row.incremento ?? 'Manter',
      motivo: row.motivo ?? '',
      justificativa: row.justificativa ?? '',
    });
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

      const payload = {
        vida_util_revisada: mesesRevisados,
        condicao_fisica: editForm.condicao_fisica || null,
        incremento: editForm.incremento || 'Manter',
        motivo: editForm.motivo || null,
        justificativa: editForm.justificativa || null,
      };
      const updated = await updateReviewItem(periodoId, editingItem.id, payload);
      setItems((prev) => prev.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)));
      setEditingItem(null);
    } catch (err) {
      setError(String(err?.message || err));
    }
  };

  // Removido: edição do cabeçalho do período ocorre no cadastro de períodos

  return (
    <section>
      <div className="mb-4 px-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{t('review_title')}</h2>
        <p className="text-slate-600 dark:text-slate-300">{t('review_subtitle')}</p>
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

      <div className="px-4 flex flex-wrap gap-3 items-end mb-4">
        <div>
          <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">{t('period_label')}</label>
          <select
            value={periodoId ?? ''}
            onChange={(e) => setPeriodoId(Number(e.target.value) || null)}
            className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2"
          >
            {periodos.map((p) => (
              <option key={p.id} value={p.id}>{p.codigo} - {p.descricao}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">{t('quick_filter_label')}</label>
          <input
            type="text"
            value={filter.texto}
            onChange={(e) => setFilter({ ...filter, texto: e.target.value })}
            placeholder={t('quick_filter_placeholder')}
            className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2"
          />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
      </div>

      <div className="px-4">
        {loading ? (
          <div className="p-4 text-slate-700 dark:text-slate-300">{t('loading_items')}</div>
        ) : (
          <Table
            columns={columns}
            data={sorted}
            onRowClick={handleStartEdit}
            getRowClassName={(row) => {
              const target = parseDate(row.data_fim_revisada) || parseDate(row.data_fim_depreciacao);
              const m = monthsUntil(target);
              const isSoon = m >= 0 && m <= 18;
              return isSoon ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' : '';
            }}
          />
        )}
      </div>

      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg w-full max-w-2xl p-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">{t('edit_review_title')}</h3>

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
                    setEditForm((prev) => ({ ...prev, incremento: novoInc, motivo: '', justificativa: '' }));
                  }}
                  className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2"
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
                  onChange={(e) => setEditForm({ ...editForm, revisada_anos: e.target.value })}
                  className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">{t('new_life_months_label')}</label>
                <input
                  type="number"
                  min="0"
                  max="11"
                  value={editForm.revisada_meses}
                  onChange={(e) => setEditForm({ ...editForm, revisada_meses: e.target.value })}
                  className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2"
                />
              </div>
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
                disabled={editForm.incremento === 'Manter'}
                className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2 disabled:bg-slate-100 dark:disabled:bg-slate-800"
              >
                <option value="">{editForm.incremento === 'Manter' ? t('select_increment_to_see_reasons') : t('select_reason')}</option>
                {(editForm.incremento === 'Acréscimo' ? motivosAumento : editForm.incremento === 'Decréscimo' ? motivosReducao : []).map((m) => (
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
                className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-3 py-2 rounded border border-slate-300 dark:border-slate-700"
              >{t('cancel')}</button>
              <button
                type="button"
                onClick={handleSave}
                className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >{t('save')}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}