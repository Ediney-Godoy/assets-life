import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { listAuditLogs, historicoSupervisaoRVU, listRelatoriosLog } from '../apiClient';

export default function LogsCenter() {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState('audit');

  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState('');
  const [auditFilters, setAuditFilters] = useState({
    acao: '',
    entidade: '',
    q: '',
  });

  const [superLogs, setSuperLogs] = useState([]);
  const [superLoading, setSuperLoading] = useState(false);
  const [superError, setSuperError] = useState('');
  const [superFilters, setSuperFilters] = useState({
    q: '',
  });

  const [reportLogs, setReportLogs] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');

  useEffect(() => {
    refreshAudit();
    refreshSupervision();
    refreshReports();
  }, []);

  const refreshAudit = async () => {
    setAuditLoading(true);
    setAuditError('');
    try {
      const params = {};
      if (auditFilters.acao) params.acao = auditFilters.acao;
      if (auditFilters.entidade) params.entidade = auditFilters.entidade;
      if (auditFilters.q) params.q = auditFilters.q;
      const res = await listAuditLogs(params);
      setAuditLogs(Array.isArray(res) ? res : []);
    } catch (err) {
      setAuditError(err?.message || 'Erro ao carregar logs de auditoria');
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  };

  const refreshSupervision = async () => {
    setSuperLoading(true);
    setSuperError('');
    try {
      const params = {};
      if (superFilters.q) params.q = superFilters.q;
      const res = await historicoSupervisaoRVU(params);
      setSuperLogs(Array.isArray(res) ? res : []);
    } catch (err) {
      setSuperError(err?.message || 'Erro ao carregar histórico de supervisão');
      setSuperLogs([]);
    } finally {
      setSuperLoading(false);
    }
  };

  const refreshReports = async () => {
    setReportLoading(true);
    setReportError('');
    try {
      const res = await listRelatoriosLog();
      setReportLogs(Array.isArray(res) ? res : []);
    } catch (err) {
      setReportError(err?.message || 'Erro ao carregar histórico de relatórios');
      setReportLogs([]);
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">
        {t('logs_center_title') || 'Central de Logs - Controles internos'}
      </h2>

      <div className="mb-3 border-b border-slate-200 dark:border-slate-800 flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === 'audit'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50'
          }`}
        >
          {t('logs_tab_audit') || 'Logs gerais'}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('supervision')}
          className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === 'supervision'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50'
          }`}
        >
          {t('logs_tab_supervision') || 'Logs de supervisão'}
        </button>
      </div>

      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4 mb-4">
          <div className="flex items-center justify-between mb-3 gap-2">
            <div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {t('logs_audit_title') || 'Logs gerais de auditoria'}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300">
                {t('logs_audit_subtitle') || 'Acessos, simulador e outras ações críticas do sistema.'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
            <input
              className="px-3 py-2 rounded-md border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 text-sm"
              placeholder="Ação (ex: LOGIN_SUCESSO, simulador_depreciacao)"
              value={auditFilters.acao}
              onChange={(e) =>
                setAuditFilters((f) => ({ ...f, acao: e.target.value }))
              }
            />
            <input
              className="px-3 py-2 rounded-md border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 text-sm"
              placeholder="Entidade (ex: Usuario, simulador_depreciacao)"
              value={auditFilters.entidade}
              onChange={(e) =>
                setAuditFilters((f) => ({ ...f, entidade: e.target.value }))
              }
            />
            <div className="flex gap-2">
              <input
                className="flex-1 px-3 py-2 rounded-md border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 text-sm"
                placeholder={t('logs_audit_search_placeholder') || 'Busca em detalhes'}
                value={auditFilters.q}
                onChange={(e) =>
                  setAuditFilters((f) => ({ ...f, q: e.target.value }))
                }
              />
              <button
                type="button"
                onClick={refreshAudit}
                className="px-3 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700"
              >
                {auditLoading ? (t('loading') || 'Carregando…') : (t('refresh') || 'Atualizar')}
              </button>
            </div>
          </div>

          {auditError && (
            <div className="text-sm text-red-600 mb-2">{auditError}</div>
          )}

          <div className="overflow-auto max-h-[60vh]">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b bg-slate-50 dark:bg-slate-900">
                  <th className="p-2">{t('logs_date') || 'Data'}</th>
                  <th className="p-2">{t('logs_user') || 'Usuário'}</th>
                  <th className="p-2">{t('logs_action') || 'Ação'}</th>
                  <th className="p-2">{t('logs_entity') || 'Entidade'}</th>
                  <th className="p-2">{t('logs_entity_id') || 'ID Entidade'}</th>
                  <th className="p-2">{t('logs_details') || 'Detalhes'}</th>
                </tr>
              </thead>
              <tbody>
                {(auditLogs || []).map((l) => (
                  <tr
                    key={l.id}
                    className="border-b hover:bg-slate-50 dark:hover:bg-slate-900"
                  >
                    <td className="p-2">
                      {l.data_evento
                        ? new Date(l.data_evento).toLocaleString('pt-BR')
                        : ''}
                    </td>
                    <td className="p-2">
                      {l.usuario_nome || l.usuario_id || ''}
                    </td>
                    <td className="p-2">{l.acao}</td>
                    <td className="p-2">{l.entidade}</td>
                    <td className="p-2">{l.entidade_id ?? ''}</td>
                    <td className="p-2 max-w-[280px] truncate">
                      {typeof l.detalhes === 'string'
                        ? l.detalhes
                        : JSON.stringify(l.detalhes || '')}
                    </td>
                  </tr>
                ))}
                {!auditLoading && (auditLogs || []).length === 0 && (
                  <tr>
                    <td className="p-2 text-slate-600" colSpan={6}>
                      {t('logs_empty') || 'Nenhum log encontrado.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'supervision' && (
        <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4 mb-4">
          <div className="flex items-center justify-between mb-3 gap-2">
            <div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {t('logs_supervision_title') || 'Histórico Supervisão RVU'}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300">
                {t('logs_supervision_subtitle') || 'Histórico detalhado de ajustes de vida útil por ativo.'}
              </div>
            </div>
          </div>

          <div className="flex gap-2 mb-3">
            <input
              className="flex-1 px-3 py-2 rounded-md border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 text-sm"
              placeholder={t('logs_supervision_search_placeholder') || 'Busca por motivo, descrição ou nº imobilizado'}
              value={superFilters.q}
              onChange={(e) =>
                setSuperFilters((f) => ({ ...f, q: e.target.value }))
              }
            />
            <button
              type="button"
              onClick={refreshSupervision}
              className="px-3 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700"
            >
              {superLoading ? (t('loading') || 'Carregando…') : (t('refresh') || 'Atualizar')}
            </button>
          </div>

          {superError && (
            <div className="text-sm text-red-600 mb-2">{superError}</div>
          )}

          <div className="overflow-auto max-h-[60vh]">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b bg-slate-50 dark:bg-slate-900">
                  <th className="p-2">{t('logs_date') || 'Data'}</th>
                  <th className="p-2">{t('logs_user') || 'Usuário'}</th>
                  <th className="p-2">{t('th_asset_number') || 'Nº Imobilizado'}</th>
                  <th className="p-2">{t('logs_asset_description') || 'Descrição'}</th>
                  <th className="p-2">{t('logs_action') || 'Ação'}</th>
                  <th className="p-2">{t('logs_original_life') || 'Vida Anterior'}</th>
                  <th className="p-2">{t('logs_revised_life') || 'Vida Revisada'}</th>
                  <th className="p-2">{t('logs_reason') || 'Motivo'}</th>
                  <th className="p-2">{t('logs_status') || 'Status'}</th>
                </tr>
              </thead>
              <tbody>
                {(superLogs || []).map((h) => (
                  <tr
                    key={h.id}
                    className="border-b hover:bg-slate-50 dark:hover:bg-slate-900"
                  >
                    <td className="p-2">
                      {h.data_evento || h.data_reversao
                        ? new Date(
                            h.data_evento || h.data_reversao
                          ).toLocaleString('pt-BR')
                        : ''}
                    </td>
                    <td className="p-2">
                      {h.usuario_nome || h.supervisor_id || h.revisor_id}
                    </td>
                    <td className="p-2">{h.numero_imobilizado || '-'}</td>
                    <td className="p-2 max-w-[220px] truncate">
                      {h.descricao || '-'}
                    </td>
                    <td className="p-2">{h.acao}</td>
                    <td className="p-2">{h.vida_util_anterior ?? ''}</td>
                    <td className="p-2">{h.vida_util_revisada ?? ''}</td>
                    <td className="p-2 max-w-[220px] truncate">
                      {h.motivo_reversao || ''}
                    </td>
                    <td className="p-2">{h.status || ''}</td>
                  </tr>
                ))}
                {!superLoading && (superLogs || []).length === 0 && (
                  <tr>
                    <td className="p-2 text-slate-600" colSpan={9}>
                      {t('logs_supervision_empty') || 'Nenhum histórico encontrado.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-4 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-center justify-between mb-3 gap-2">
          <div>
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {t('logs_reports_title') || 'Histórico de relatórios RVU'}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300">
              {t('logs_reports_subtitle') || 'Consultas e arquivos gerados a partir do módulo de relatórios RVU.'}
            </div>
          </div>
          <button
            type="button"
            onClick={refreshReports}
            className="px-3 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700"
          >
            {reportLoading ? (t('loading') || 'Carregando…') : (t('refresh') || 'Atualizar')}
          </button>
        </div>

        {reportError && (
          <div className="text-sm text-red-600 mb-2">{reportError}</div>
        )}

        <div className="overflow-auto max-h-[60vh]">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b bg-slate-50 dark:bg-slate-900">
                <th className="p-2">{t('logs_date') || 'Data'}</th>
                <th className="p-2">{t('logs_user') || 'Usuário'}</th>
                <th className="p-2">{t('company_colon') ? t('company_colon').replace(':', '') : 'Empresa'}</th>
                <th className="p-2">{t('logs_reports_type') || 'Tipo'}</th>
                <th className="p-2">{t('logs_reports_params') || 'Parâmetros'}</th>
                <th className="p-2">{t('open') || 'Abrir'}</th>
              </tr>
            </thead>
            <tbody>
              {(reportLogs || []).map((l) => {
                const tipo =
                  l.tipo_arquivo === 'excel_resumo'
                    ? 'Excel - Resumo RVU'
                    : l.tipo_arquivo === 'pdf_resumo'
                    ? 'PDF - Laudo RVU'
                    : l.tipo_arquivo || '';
                return (
                  <tr key={l.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-900">
                    <td className="p-2">
                      {l.data_emissao
                        ? new Date(l.data_emissao).toLocaleString('pt-BR')
                        : ''}
                    </td>
                    <td className="p-2">
                      {l.usuario?.nome_completo || l.usuario_id}
                    </td>
                    <td className="p-2">
                      {l.empresa?.name || l.empresa_id}
                    </td>
                    <td className="p-2">{tipo}</td>
                    <td className="p-2 max-w-[260px]">
                      <code className="text-xs break-all">
                        {l.parametros_usados}
                      </code>
                    </td>
                    <td className="p-2">
                      {l.caminho_arquivo ? (
                        <a
                          className="text-blue-600 underline"
                          href={l.caminho_arquivo}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {t('open') || 'Abrir'}
                        </a>
                      ) : (
                        ''
                      )}
                    </td>
                  </tr>
                );
              })}
              {!reportLoading && (reportLogs || []).length === 0 && (
                <tr>
                  <td className="p-2 text-slate-600" colSpan={6}>
                    {t('logs_reports_empty') || 'Nenhum relatório gerado encontrado.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
