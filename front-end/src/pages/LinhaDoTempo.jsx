import React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { Search, X, CalendarDays, ClipboardList, CheckCircle2, Wrench, MapPin } from 'lucide-react';
import Button from '../components/ui/Button';
import { getLinhaDoTempoRVUPorNumero } from '../apiClient';

const EVENT_META = {
  incorporacao: {
    labelKey: 'timeline_event_incorporation',
    label: 'Incorporação',
    subtitleKey: 'timeline_event_incorporation_subtitle',
    subtitle: 'Ponto de partida',
    bg: '#D1FAE5',
    text: '#065F46',
    accent: '#10B981',
    Icon: CalendarDays,
  },
  ifrs: {
    labelKey: 'timeline_event_ifrs',
    label: 'Adoção IFRS',
    subtitleKey: 'timeline_event_ifrs_subtitle',
    subtitle: 'Revisão de vida útil passa a ser obrigatória',
    bg: '#DBEAFE',
    text: '#1E40AF',
    accent: '#2563EB',
    Icon: ClipboardList,
  },
  mantido_pre: {
    labelKey: 'timeline_event_kept_pre',
    label: 'Mantido — pré-IFRS',
    subtitleKey: 'timeline_event_kept_subtitle',
    subtitle: 'Expectativa de vida útil mantida',
    bg: '#F1F5F9',
    text: '#475569',
    accent: '#94A3B8',
    Icon: CheckCircle2,
  },
  mantido_pos: {
    labelKey: 'timeline_event_kept_post',
    label: 'Mantido — pós-IFRS',
    subtitleKey: 'timeline_event_kept_subtitle',
    subtitle: 'Expectativa de vida útil mantida',
    bg: '#EFF6FF',
    text: '#2563EB',
    accent: '#60A5FA',
    Icon: CheckCircle2,
  },
  ajuste: {
    labelKey: 'timeline_event_adjustment',
    label: 'Ajuste de vida útil',
    subtitleKey: 'timeline_event_adjustment_subtitle',
    subtitle: 'Vida útil revisada',
    bg: '#FEF3C7',
    text: '#92400E',
    accent: '#D97706',
    Icon: Wrench,
  },
  previsto: {
    labelKey: 'timeline_event_forecast',
    label: 'Período previsto de revisão',
    subtitleKey: 'timeline_event_forecast_subtitle',
    subtitle: 'Ano corrente ainda não aberto no sistema',
    bg: '#FCE7F3',
    text: '#9D174D',
    accent: '#EC4899',
    Icon: CalendarDays,
  },
  fim: {
    labelKey: 'timeline_event_end',
    label: 'Fim da depreciação',
    subtitleKey: 'timeline_event_end_subtitle',
    subtitle: 'Último período aberto',
    bg: '#FEE2E2',
    text: '#991B1B',
    accent: '#DC2626',
    Icon: MapPin,
  },
  atual: {
    labelKey: 'timeline_event_current',
    label: 'Situação atual',
    subtitleKey: 'timeline_event_current_subtitle',
    subtitle: 'Posição consolidada do ativo',
    bg: '#EDE9FE',
    text: '#5B21B6',
    accent: '#7C3AED',
    Icon: MapPin,
  },
};

function resolveEventMeta(type, t) {
  const meta = EVENT_META[type] || EVENT_META.mantido_pos;
  return {
    ...meta,
    label: t(meta.labelKey, meta.label),
    subtitle: t(meta.subtitleKey, meta.subtitle),
  };
}

function parseAssetQueries(input) {
  const raw = String(input || '')
    .split(/[\n,;]+/g)
    .map((s) => s.trim())
    .filter(Boolean);

  return raw.map((token) => {
    const cleaned = token.replace(/\s+/g, '');
    const match = cleaned.match(/^(.+?)[\-\/](.+)$/);
    if (match) {
      return { numero: match[1], sub_numero: match[2] };
    }
    return { numero: cleaned, sub_numero: '0' };
  });
}

function formatDate(value) {
  if (!value) return '—';
  const [year, month, day] = String(value).slice(0, 10).split('-');
  if (!year || !month || !day) return String(value).slice(0, 10);
  return `${day}/${month}/${year}`;
}

function formatCurrentMonthYear(locale = 'pt-BR') {
  try {
    return new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }).format(new Date());
  } catch {
    return '';
  }
}

function diffMonths(startValue, endValue = new Date()) {
  if (!startValue) return null;
  const start = new Date(startValue);
  const end = new Date(endValue);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (end.getDate() < start.getDate()) months -= 1;
  return Math.max(0, months);
}

function formatMonths(value, t) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const total = Math.max(0, Number(value));
  const years = Math.floor(total / 12);
  const months = total % 12;
  const yearLabel = t('timeline_year_short', 'a');
  const monthLabel = t('timeline_month_short', 'm');
  if (years > 0 && months > 0) return `${years}${yearLabel} ${months}${monthLabel}`;
  if (years > 0) return `${years}${yearLabel}`;
  return `${months}${monthLabel}`;
}

function getPeriodYear(row) {
  if (row?.data_abertura_periodo) {
    const year = Number(String(row.data_abertura_periodo).slice(0, 4));
    if (Number.isFinite(year)) return year;
  }
  const match = String(row?.periodo_codigo || '').match(/(20\d{2})/);
  return match ? Number(match[1]) : null;
}

function buildForecastDates(year) {
  return {
    inicio: `01/11/${year}`,
    fim: `31/01/${year + 1}`,
  };
}

function buildTimelinePresentation(timeline, t) {
  const rows = Array.isArray(timeline?.linha_do_tempo) ? timeline.linha_do_tempo : [];
  const sortedRows = [...rows].sort((a, b) => Number(a.ano) - Number(b.ano));
  const finalEndDate = timeline?.fim_depreciacao?.data || null;
  const finalEndYear = finalEndDate ? Number(String(finalEndDate).slice(0, 4)) : null;
  const years = Array.from(new Set([
    ...sortedRows.map((r) => Number(r.ano)).filter((y) => Number.isFinite(y)),
    ...(Number.isFinite(finalEndYear) ? [finalEndYear] : []),
  ])).sort((a, b) => a - b);
  const rowByYear = new Map(sortedRows.map((row) => [Number(row.ano), row]));
  const currentYear = new Date().getFullYear();
  const hasOpenedCurrentPeriod = sortedRows.some((row) => row?.origem === 'revisoes_itens' && getPeriodYear(row) === currentYear);

  const marcos = Array.isArray(timeline?.marcos) ? [...timeline.marcos] : [];
  marcos.sort((a, b) => String(a?.data || '').localeCompare(String(b?.data || '')));

  const marcosByYear = new Map();
  for (const marco of marcos) {
    const year = marco?.data ? Number(String(marco.data).slice(0, 4)) : NaN;
    if (!Number.isFinite(year)) continue;
    const list = marcosByYear.get(year) || [];
    list.push(marco);
    marcosByYear.set(year, list);
  }

  const orderedEvents = [];
  for (const year of years) {
    const yearMarcos = marcosByYear.get(year) || [];
    for (const marco of yearMarcos) {
      if (marco?.tipo === 'incorporacao') {
        const meta = resolveEventMeta('incorporacao', t);
        orderedEvents.push({
          key: `inc-${year}`,
          year,
          type: 'incorporacao',
          dateLabel: formatDate(marco.data),
          title: meta.label,
          subtitle: meta.subtitle,
          details: [],
        });
        continue;
      }
      if (marco?.tipo === 'adocao_ifrs') {
        const meta = resolveEventMeta('ifrs', t);
        orderedEvents.push({
          key: `ifrs-${year}`,
          year,
          type: 'ifrs',
          dateLabel: formatDate(marco.data),
          title: meta.label,
          subtitle: meta.subtitle,
          details: [],
        });
      }
    }

    const row = rowByYear.get(year);
    if (!row) continue;
    const hasRevisedLife = row?.vida_util_revisada_meses != null || !!row?.data_fim_revisada;
    const isAdjust = row?.origem === 'revisoes_itens' && (
      hasRevisedLife || (row?.incremento && String(row.incremento).toLowerCase() !== 'manter')
    );
    const isForecast = year === currentYear && row?.origem === 'assumido' && !hasOpenedCurrentPeriod;
    const phaseLabel = row?.fase === 'pre_ifrs' ? 'Pré-IFRS' : 'Pós-IFRS';
    const forecastDates = isForecast ? buildForecastDates(year) : null;
    const keptPreMeta = resolveEventMeta('mantido_pre', t);
    const keptPosMeta = resolveEventMeta('mantido_pos', t);
    const adjustMeta = resolveEventMeta('ajuste', t);
    const forecastMeta = resolveEventMeta('previsto', t);
    const baseDetails = [
      `${t('timeline_label_phase', 'Fase')}: ${phaseLabel}`,
      row?.origem === 'revisoes_itens'
        ? `${t('timeline_label_source', 'Origem')}: ${t('timeline_source_review', 'revisão')}`
        : `${t('timeline_label_source', 'Origem')}: ${t('timeline_source_projection', 'projeção')}`,
      isForecast ? t('timeline_forecast_for', 'Previsto para:') : null,
      isForecast ? `${t('timeline_forecast_start', 'Início')} ${forecastDates.inicio}` : null,
      isForecast ? `${t('timeline_forecast_end', 'Fim')} ${forecastDates.fim}` : null,
      row?.periodo_codigo ? `${t('timeline_label_period', 'Período')}: ${row.periodo_codigo}` : null,
      row?.data_inicio_nova_vida_util ? `${t('timeline_label_effective_date', 'Vigência')}: ${formatDate(row.data_inicio_nova_vida_util)}` : null,
      row?.vida_util_revisada_meses != null ? `${t('timeline_label_useful_life', 'Vida útil')}: ${row.vida_util_revisada_meses} ${t('timeline_months', 'meses')}` : null,
      row?.data_fim_revisada ? `${t('timeline_label_forecast', 'Previsão')}: ${formatDate(row.data_fim_revisada)}` : null,
      row?.motivo ? `${t('timeline_label_reason', 'Motivo')}: ${row.motivo}` : null,
    ].filter(Boolean);

    orderedEvents.push({
      key: `row-${year}`,
      year,
      type: isForecast ? 'previsto' : (isAdjust ? 'ajuste' : (row?.fase === 'pre_ifrs' ? 'mantido_pre' : 'mantido_pos')),
      dateLabel: isForecast
        ? t('timeline_fiscal_year', { year, defaultValue: `Exercício ${year}` })
        : (row?.data_evento ? formatDate(row.data_evento) : t('timeline_fiscal_year', { year, defaultValue: `Exercício ${year}` })),
      title: isForecast ? forecastMeta.label : (isAdjust ? adjustMeta.label : (row?.fase === 'pre_ifrs' ? keptPreMeta.label : keptPosMeta.label)),
      subtitle: isForecast
        ? t('timeline_forecast_subtitle_year', { year, defaultValue: `Previsto para abertura em novembro/${year}` })
        : isAdjust
        ? `${row?.periodo_codigo ? `${row.periodo_codigo} · ` : ''}${row?.incremento ? `${t('timeline_label_increment', 'Incremento')}: ${row.incremento}` : t('timeline_review_applied', 'Revisão aplicada')}`
        : `${phaseLabel} · ${t('timeline_kept_expectation', 'expectativa mantida')}`,
      details: baseDetails,
    });
  }

  if (finalEndDate && Number.isFinite(finalEndYear)) {
    const finalEndSource = timeline?.fim_depreciacao || {};
    const endMeta = resolveEventMeta('fim', t);
    orderedEvents.push({
      key: `fim-${finalEndYear}`,
      year: finalEndYear,
      type: 'fim',
      dateLabel: formatDate(finalEndDate),
      title: endMeta.label,
      subtitle: finalEndSource?.periodo_codigo
        ? `${finalEndSource.periodo_codigo} · ${endMeta.subtitle}`
        : endMeta.subtitle,
      details: [
        finalEndSource?.data_abertura_periodo ? `${t('timeline_label_period_opening', 'Abertura do período')}: ${formatDate(finalEndSource.data_abertura_periodo)}` : null,
        finalEndSource?.origem === 'revisada'
          ? t('timeline_end_source_revised', 'Origem: data revisada')
          : t('timeline_end_source_original', 'Origem: data original'),
      ].filter(Boolean),
    });
  }

  const groupedYears = years.map((year) => ({ year, top: [], bottom: [] }));
  const yearMap = new Map(groupedYears.map((item) => [item.year, item]));
  orderedEvents.forEach((event, index) => {
    const side = index % 2 === 0 ? 'top' : 'bottom';
    yearMap.get(event.year)?.[side].push({ ...event, side });
  });

  return {
    years,
    groupedYears,
    rows: sortedRows,
  };
}

function TimelineEventCard({ event }) {
  const meta = EVENT_META[event.type] || EVENT_META.mantido_pos;
  const Icon = meta.Icon;

  return (
    <div
      className="w-full max-w-[180px] rounded-[10px] px-3 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-black/5"
      style={{
        backgroundColor: meta.bg,
        color: meta.text,
        borderLeft: `4px solid ${meta.accent}`,
      }}
    >
      <div className="text-[13px] font-bold leading-tight">{event.dateLabel}</div>
      <div className="mt-1 flex items-center gap-1.5 text-[14px] font-semibold leading-tight">
        <Icon size={16} />
        <span>{event.title}</span>
      </div>
      <div className="mt-1 text-[11px] leading-snug opacity-80">{event.subtitle}</div>
      {event.details?.length ? (
        <div className="mt-1.5 space-y-0.5 text-[11px] leading-snug opacity-85">
          {event.details.map((detail) => (
            <div key={detail}>{detail}</div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SummaryCard({ timeline, t }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{t('asset_number', 'Número do Ativo')}</div>
        <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
          {timeline?.asset?.numero || '—'} / {timeline?.asset?.sub_numero || '0'}
        </div>
      </div>
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{t('timeline_asset_name', 'Nome')}</div>
        <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
          {timeline?.asset?.descricao || '—'}
        </div>
      </div>
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{t('timeline_incorporation_date', 'Data de Incorporação')}</div>
        <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
          {formatDate(timeline?.asset?.data_incorporacao)}
        </div>
      </div>
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{t('timeline_ifrs_date', 'Data de Adoção IFRS')}</div>
        <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
          {formatDate(timeline?.empresa?.data_adocao_ifrs)}
        </div>
      </div>
    </div>
  );
}

function CurrentStatusCard({ timeline, rows, t, locale }) {
  const nowLabel = formatCurrentMonthYear(locale);
  const lastWithFim = [...rows].reverse().find((r) => r?.data_fim_revisada);
  const previsaoTermino = lastWithFim?.data_fim_revisada ? formatDate(lastWithFim.data_fim_revisada) : '—';
  const months = diffMonths(timeline?.asset?.data_incorporacao);
  const currentMeta = resolveEventMeta('atual', t);
  const Icon = currentMeta.Icon;

  return (
    <div
      className="mt-5 flex w-full items-start gap-3 rounded-2xl border px-4 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
      style={{ backgroundColor: currentMeta.bg, borderColor: currentMeta.accent, color: currentMeta.text }}
    >
      <div className="mt-0.5 rounded-full p-2" style={{ backgroundColor: 'rgba(124,58,237,0.14)' }}>
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <div className="text-[14px] font-semibold leading-tight">
          {currentMeta.label} {nowLabel ? `— ${nowLabel}` : ''}
        </div>
        <div className="mt-1 text-[12px] leading-relaxed opacity-90">
          {t('timeline_accumulated_life', 'VU acumulada')}: {formatMonths(months, t)} · {t('timeline_end_forecast', 'Previsão de término')}: {previsaoTermino}
        </div>
      </div>
    </div>
  );
}

function Legend({ t }) {
  const items = [
    ['incorporacao', t('timeline_event_incorporation', 'Incorporação')],
    ['ifrs', t('timeline_event_ifrs', 'Adoção IFRS')],
    ['mantido_pre', t('timeline_event_kept_pre', 'Mantido — pré-IFRS')],
    ['mantido_pos', t('timeline_event_kept_post', 'Mantido — pós-IFRS')],
    ['ajuste', t('timeline_event_adjustment', 'Ajuste de vida útil')],
    ['previsto', t('timeline_event_forecast_short', 'Período previsto')],
    ['fim', t('timeline_event_end', 'Fim da depreciação')],
    ['atual', t('timeline_event_current', 'Situação atual')],
  ];

  return (
    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
      {items.map(([key, label]) => {
        const meta = EVENT_META[key];
        return (
          <div key={key} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: meta.bg, border: `1px solid ${meta.accent}` }} />
            <span>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function TimelineHorizontal({ timeline, t, locale }) {
  const { years, groupedYears, rows } = React.useMemo(() => buildTimelinePresentation(timeline, t), [timeline, t]);
  if (!years.length) return null;

  const columnWidth = 180;
  const axisHeight = 520;
  const colsStyle = { gridTemplateColumns: `repeat(${years.length}, minmax(${columnWidth}px, ${columnWidth}px))` };

  return (
    <div className="space-y-4">
      <SummaryCard timeline={timeline} t={t} />

      <div className="relative rounded-2xl border border-slate-200 bg-white px-0 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-white via-white/85 to-transparent dark:from-slate-800 dark:via-slate-800/80" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white via-white/85 to-transparent dark:from-slate-800 dark:via-slate-800/80" />

        <div className="overflow-x-auto scroll-smooth px-4 scrollbar-stable">
          <div className="relative min-w-max pb-2" style={{ minHeight: axisHeight + 24 }}>
            <div
              className="pointer-events-none absolute left-0 right-0 z-0"
              style={{
                top: `${axisHeight / 2}px`,
                height: '2px',
                backgroundColor: '#CBD5E1',
              }}
            />

            <div className="relative grid gap-0" style={colsStyle}>
              {groupedYears.map((group) => (
                <div key={group.year} className="relative min-h-[520px]">
                  <div className="flex min-h-[224px] flex-col items-center justify-end gap-3 px-2 pb-16">
                    {group.top.map((event) => {
                      const meta = resolveEventMeta(event.type, t);
                      return (
                        <div key={event.key} className="flex flex-col items-center">
                          <TimelineEventCard event={event} />
                          <div className="mt-2 h-12 w-0 border-l border-dashed" style={{ borderColor: meta.accent }} />
                        </div>
                      );
                    })}
                  </div>

                  <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
                    <div className="mb-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                      {group.year}
                    </div>
                    <div className="h-8 w-px bg-slate-300" />
                  </div>

                  <div className="flex min-h-[224px] flex-col items-center gap-3 px-2 pt-16">
                    {group.bottom.map((event) => {
                      const meta = resolveEventMeta(event.type, t);
                      return (
                        <div key={event.key} className="flex flex-col items-center">
                          <div className="mb-2 h-12 w-0 border-l border-dashed" style={{ borderColor: meta.accent }} />
                          <TimelineEventCard event={event} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4">
          <CurrentStatusCard timeline={timeline} rows={rows} t={t} locale={locale} />
          <Legend t={t} />
        </div>
      </div>
    </div>
  );
}

export default function LinhaDoTempoPage() {
  const { t, i18n } = useTranslation();
  const [queryText, setQueryText] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState([]);
  const locale = i18n.language === 'en' ? 'en-US' : i18n.language === 'es' ? 'es-ES' : 'pt-BR';

  React.useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const numero = url.searchParams.get('numero');
      if (numero) setQueryText(numero);
    } catch {}
  }, []);

  const runSearch = async () => {
    const empresaId = localStorage.getItem('assetlife_empresa');
    if (!empresaId) {
      toast.error(t('select_company_first') || 'Selecione uma empresa primeiro');
      return;
    }

    const queries = parseAssetQueries(queryText);
    if (queries.length === 0) {
      toast.error(t('asset_number_required') || 'Informe o número do ativo');
      return;
    }

    const unique = Array.from(
      new Map(queries.map((q) => [`${q.numero}__${q.sub_numero}`, q])).values()
    ).slice(0, 25);

    setLoading(true);
    setResults([]);

    try {
      const items = [];
      for (const q of unique) {
        try {
          const timeline = await getLinhaDoTempoRVUPorNumero({
            empresa_id: empresaId,
            numero: q.numero,
            sub_numero: q.sub_numero,
          });
          items.push({ numero: q.numero, sub_numero: q.sub_numero, status: 'ok', timeline });
        } catch (err) {
          const msg = err?.message || String(err || '');
          const status = /404/.test(msg) ? 'not_found' : 'error';
          items.push({ numero: q.numero, sub_numero: q.sub_numero, status, error: msg });
        }
      }
      setResults(items);
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setQueryText('');
    setResults([]);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t('timeline_menu_title', 'Linha do Tempo')}
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          {t('timeline_tool_subtitle', 'Pesquise a linha do tempo de vida útil por número do ativo')}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t('asset_number') || 'Número do Ativo'}
            </label>
            <textarea
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder={t('timeline_search_placeholder', 'Digite o número do ativo...')}
              rows={2}
              className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-900/40"
            />
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {t('timeline_search_hint', 'Padrão: 1 ativo. Você pode consultar vários de uma vez.')}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2 lg:pt-8">
            <Button
              loading={loading}
              onClick={runSearch}
              icon={<Search size={18} />}
              className="bg-[#2563EB] hover:bg-[#1d4ed8] focus:ring-blue-400"
            >
              {t('search', 'Buscar')}
            </Button>
            <Button variant="secondary" onClick={clear} disabled={loading} icon={<X size={18} />}>
              {t('clear', 'Limpar')}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {results.map((r) => (
          <div key={`${r.numero}-${r.sub_numero || '0'}`} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/30">
            {r.status === 'ok' ? (
              <TimelineHorizontal timeline={r.timeline} t={t} locale={locale} />
            ) : null}

            {r.status === 'not_found' ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
                {t('timeline_asset_not_found', { numero: r.numero, subnumero: r.sub_numero || '0', defaultValue: `Ativo ${r.numero}/${r.sub_numero || '0'} não encontrado na empresa selecionada.` })}
              </div>
            ) : null}

            {r.status === 'error' ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                {t('error_loading_data') || 'Erro ao carregar dados'}: {r.error || '—'}
              </div>
            ) : null}
          </div>
        ))}

        {!loading && results.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
            {t('timeline_empty_state', 'Informe o número do ativo e clique em Buscar.')}
          </div>
        ) : null}
      </div>
    </div>
  );
}
