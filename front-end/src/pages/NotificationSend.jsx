import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { getCompanies, getUsers, getReviewPeriods, createNotification } from '../apiClient';
import { Tabs, TabPanel } from '../components/ui/Tabs';
import { Search, Plus, X, ChevronLeft, ListChecks, RotateCcw, AlertTriangle, Users as UsersIcon, CalendarClock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import RichTextEditor from '../components/notifications/send/RichTextEditor';
import { sanitizeBasicRichHtml, stripHtmlToText } from '../utils/htmlText';

export default function NotificationSendPage() {
  const { t } = useTranslation();
  const tt = (k, fb) => { const v = t(k); return v === k ? fb : v; };
  const navigate = useNavigate();
  const currentUser = React.useMemo(() => {
    try { return JSON.parse(localStorage.getItem('assetlife_user') || 'null'); } catch { return null; }
  }, []);
  const [companies, setCompanies] = React.useState([]);
  const [periods, setPeriods] = React.useState([]);
  const [users, setUsers] = React.useState([]);
  const [form, setForm] = React.useState({
    titulo: '',
    mensagem: '',
    periodo_ids: [],
    usuario_ids: [],
    cc_usuario_ids: [],
    enviar_email: false,
    notificar_todos: false,
  });
  const [activeTab, setActiveTab] = React.useState('periodos');
  const [userQuery, setUserQuery] = React.useState('');
  const [periodQuery, setPeriodQuery] = React.useState('');
  const [ccQuery, setCcQuery] = React.useState('');
  const [periodModalOpen, setPeriodModalOpen] = React.useState(false);
  const [selectedPeriodId, setSelectedPeriodId] = React.useState('');
  const [userModalOpen, setUserModalOpen] = React.useState(false);
  const [selectedUserIds, setSelectedUserIds] = React.useState([]);
  const [ccModalOpen, setCcModalOpen] = React.useState(false);
  const [selectedCcIds, setSelectedCcIds] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const run = async () => {
      setLoading(true); setError('');
      try {
        const [ps, c, u] = await Promise.all([getReviewPeriods(), getCompanies(), getUsers()]);
        setPeriods(Array.isArray(ps) ? ps : []);
        setCompanies(Array.isArray(c) ? c : []);
        setUsers(Array.isArray(u) ? u : []);
      } catch (err) {
        setError(String(err?.message || err));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const periodosSelecionados = (Array.isArray(form.periodo_ids) ? form.periodo_ids : []).map((x) => Number(x));
      const periodosAbertosSelecionados = periodosSelecionados.filter((pid) => {
        const p = periods.find((x) => Number(x.id) === Number(pid));
        const status = String(p?.status || '').trim().toLowerCase();
        const fechado = status === 'fechado' || status === 'encerrado' || !!p?.data_fechamento;
        return !!p && !fechado;
      });
      if (periodosAbertosSelecionados.length === 0) {
        toast.error('Envio bloqueado: selecione um período aberto');
        setActiveTab('periodos');
        return;
      }
      const empresasSelecionadas = (() => {
        const ids = new Set();
        for (const pid of periodosAbertosSelecionados) {
          const p = periods.find((x) => Number(x.id) === Number(pid));
          if (p?.empresa_id) ids.add(Number(p.empresa_id));
        }
        return Array.from(ids);
      })();
      if ((usersFiltered || []).length === 0) {
        toast.error('Envio bloqueado: não há usuários cadastrados no projeto');
        setActiveTab('emails');
        return;
      }
      const usuariosSelecionados = (Array.isArray(form.usuario_ids) ? form.usuario_ids : []).map((x) => Number(x));
      const ccRaw = Array.isArray(form.cc_usuario_ids) ? form.cc_usuario_ids : [];
      const ccIds = [];
      const ccEmails = [];
      for (const v of ccRaw) {
        const s = String(v || '').trim();
        if (!s) continue;
        if (/^\d+$/.test(s)) ccIds.push(Number(s));
        else if (s.includes('@')) ccEmails.push(s.toLowerCase());
      }
      const ccIdsUniq = Array.from(new Set(ccIds));
      const ccEmailsUniq = Array.from(new Set(ccEmails));
      const isValidEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim());
      const selectedUserEmails = Array.from(new Set(
        (usuariosSelecionados || [])
          .map((id) => {
            const u = (usersFiltered || []).find((x) => Number(x.id) === Number(id));
            return (u && (u.email_corporativo || u.email)) ? String(u.email_corporativo || u.email).trim().toLowerCase() : '';
          })
          .filter((e) => isValidEmail(e))
      ));
      const selectedCcUserEmails = Array.from(new Set(
        (ccIdsUniq || [])
          .map((id) => {
            const u = (usersFiltered || []).find((x) => Number(x.id) === Number(id));
            return (u && (u.email_corporativo || u.email)) ? String(u.email_corporativo || u.email).trim().toLowerCase() : '';
          })
          .filter((e) => isValidEmail(e))
      ));
      const ccEmailsFinal = Array.from(new Set([...(ccEmailsUniq || []), ...(selectedCcUserEmails || [])]));
      if (!form.notificar_todos && usuariosSelecionados.length === 0 && ccIdsUniq.length === 0 && ccEmailsUniq.length === 0) {
        toast.error(tt('select_users_or_notify_all', 'Selecione ao menos um usuário ou marque "Notificar todos"'));
        setActiveTab('notificacao');
        return;
      }
      if (form.notificar_todos && periodosSelecionados.length === 0) {
        toast.error(tt('select_periods_for_notify_all', 'Selecione ao menos um período para "Notificar todos"'));
        setActiveTab('periodos');
        return;
      }
      const messageHtml = sanitizeBasicRichHtml(form.mensagem);
      const messageText = stripHtmlToText(messageHtml);
      if (!messageText) {
        toast.error('Escreva uma mensagem antes de enviar');
        setActiveTab('mensagem');
        return;
      }
      const payload = {
        // campos em PT
        titulo: form.titulo,
        mensagem: messageHtml,
        empresa_ids: empresasSelecionadas,
        periodo_ids: periodosAbertosSelecionados,
        usuario_ids: form.notificar_todos ? [] : usuariosSelecionados,
        cc_usuario_ids: ccIdsUniq,
        cc_emails: ccEmailsFinal,
        to_emails: form.notificar_todos ? [] : selectedUserEmails,
        notificar_todos: !!form.notificar_todos,
        enviar_email: !!form.enviar_email,
        remetente_id: currentUser?.id ? Number(currentUser.id) : undefined,
        // espelhamento em EN (compatibilidade com variações de backend)
        title: form.titulo,
        message: messageHtml,
        company_ids: empresasSelecionadas,
        period_ids: periodosAbertosSelecionados,
        user_ids: form.notificar_todos ? [] : usuariosSelecionados,
        cc_user_ids: ccIdsUniq,
        ccEmails: ccEmailsFinal,
        toEmails: form.notificar_todos ? [] : selectedUserEmails,
        notify_all: !!form.notificar_todos,
        send_email: !!form.enviar_email,
        sender_id: currentUser?.id ? Number(currentUser.id) : undefined,
        message_text: messageText,
      };
      const res = await createNotification(payload);
      const sent = Number(res?.email_sent ?? res?.emailSent ?? 0);
      const failed = Number(res?.email_failed ?? res?.emailFailed ?? 0);
      if (payload.enviar_email || payload.send_email) {
        if (sent > 0 && failed === 0) {
          toast.success(tt('sent', 'Enviado'));
        } else if (sent > 0 && failed > 0) {
          toast.success(`${tt('sent', 'Enviado')} (${sent} ok, ${failed} falha)`);
        } else if (sent === 0 && failed > 0) {
          toast.error(`Falha ao enviar e-mails (${failed} falha)`);
          return;
        } else {
          toast.success(tt('sent', 'Enviado'));
        }
      } else {
        toast.success(tt('sent', 'Enviado'));
      }
      navigate('/notifications');
    } catch (err) {
      toast.error(String(err?.message || err));
    }
  };

  const usersFiltered = React.useMemo(() => {
    const pids = Array.isArray(form.periodo_ids) ? form.periodo_ids : [];
    const empresas = new Set((() => {
      const list = [];
      for (const pid of pids) {
        const p = periods.find((x) => Number(x.id) === Number(pid));
        if (p?.empresa_id) list.push(Number(p.empresa_id));
      }
      return list;
    })());
    const base = empresas.size === 0 ? users : users.filter((u) => {
      const companyId = Number(u.empresa_id ?? u.company_id ?? u.companyId ?? 0);
      return empresas.has(companyId);
    });
    return base.filter((u) => String(u.status || 'Ativo').toLowerCase() !== 'inativo');
  }, [users, periods, form.periodo_ids]);

  const selectedOpenPeriods = React.useMemo(() => {
    const ids = new Set((Array.isArray(form.periodo_ids) ? form.periodo_ids : []).map((x) => String(x)));
    const allowedCompanyIds = new Set(companies.map((c) => Number(c.id)));
    return (periods || []).filter((p) => {
      if (!p) return false;
      if (!ids.has(String(p.id))) return false;
      const status = String(p.status || '').trim().toLowerCase();
      const fechado = status === 'fechado' || status === 'encerrado' || !!p.data_fechamento;
      if (fechado) return false;
      if (p.empresa_id && !allowedCompanyIds.has(Number(p.empresa_id))) return false;
      return true;
    });
  }, [form.periodo_ids, periods, companies]);

  const canSendByRules = React.useMemo(() => {
    return selectedOpenPeriods.length > 0 && (usersFiltered || []).length > 0;
  }, [selectedOpenPeriods.length, usersFiltered]);

  const blockingReasons = React.useMemo(() => {
    const r = [];
    if (selectedOpenPeriods.length === 0) r.push('Selecione um período aberto para habilitar o envio.');
    if ((usersFiltered || []).length === 0) r.push('Este projeto não possui usuários cadastrados.');
    return r;
  }, [selectedOpenPeriods.length, usersFiltered]);

  if (loading) return <p className="text-slate-500">{tt('loading', 'Carregando...')}</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{tt('send_notification', 'Enviar Notificação')}</h2>
        <Button
          variant="secondary"
          onClick={() => navigate('/notifications')}
          title={tt('back', 'Voltar')}
          aria-label={tt('back', 'Voltar')}
          icon={<ChevronLeft size={18} />}
          className="p-0 h-10 w-10 justify-center"
        />
      </div>
      <form className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm" onSubmit={onSubmit}>
        {blockingReasons.length > 0 ? (
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100 p-3">
              <div className="mt-0.5"><AlertTriangle size={18} /></div>
              <div className="min-w-0">
                <div className="font-semibold">Envio bloqueado</div>
                <ul className="mt-1 text-sm list-disc pl-5">
                  {blockingReasons.map((x) => (<li key={x}>{x}</li>))}
                </ul>
              </div>
            </div>
          </div>
        ) : null}

        <div className="p-4">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-2 text-xs rounded-full border border-slate-200 dark:border-slate-800 px-3 py-1 text-slate-700 dark:text-slate-200">
              <CalendarClock size={14} />
              <span>Períodos abertos: {selectedOpenPeriods.length}</span>
            </div>
            <div className="inline-flex items-center gap-2 text-xs rounded-full border border-slate-200 dark:border-slate-800 px-3 py-1 text-slate-700 dark:text-slate-200">
              <UsersIcon size={14} />
              <span>Usuários: {(usersFiltered || []).length}</span>
            </div>
            <div className="inline-flex items-center gap-2 text-xs rounded-full border border-slate-200 dark:border-slate-800 px-3 py-1 text-slate-700 dark:text-slate-200">
              <Mail size={14} />
              <span>E-mail: {form.enviar_email ? 'sim' : 'não'}</span>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onChange={setActiveTab}
            items={[
              { value: 'periodos', label: 'Períodos' },
              { value: 'mensagem', label: 'Mensagem' },
              { value: 'notificacao', label: 'Notificação' },
              { value: 'emails', label: 'E-mails' },
            ]}
          />

          <TabPanel active={activeTab === 'periodos'}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Input label={tt('nav_review_periods', 'Períodos')} value={periodQuery} onChange={(e) => setPeriodQuery(e.target.value)} placeholder={tt('all', 'Todos')} />
                  </div>
                  <Button variant="secondary" size="sm" type="button" title={tt('search', 'Buscar')} aria-label={tt('search', 'Buscar')} className="p-0 h-10 w-10 justify-center" onClick={() => setPeriodModalOpen(true)} icon={<Search size={16} />} />
                  <Button variant="primary" size="sm" type="button" title={tt('add', 'Adicionar')} aria-label={tt('add', 'Adicionar')} className="p-0 h-10 w-10 justify-center" onClick={() => {
                    const q = periodQuery.trim().toLowerCase();
                    const allowedCompanyIds = new Set(companies.map((c) => Number(c.id)));
                    const openAndAllowed = periods.filter((p) => p && String(p.status || '').toLowerCase() !== 'fechado' && String(p.status || '').toLowerCase() !== 'encerrado' && !p.data_fechamento && allowedCompanyIds.has(Number(p.empresa_id || 0)));
                    const match = openAndAllowed.find((p) => String(p.codigo || '').toLowerCase().includes(q) || String(p.descricao || '').toLowerCase().includes(q));
                    if (match) setForm((f) => ({ ...f, periodo_ids: Array.from(new Set([...(f.periodo_ids || []), String(match.id)])) }));
                  }} icon={<Plus size={16} />} />
                </div>

                <div className="mt-3 h-[260px] overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 p-2">
                  {(form.periodo_ids || []).length === 0 ? (
                    <p className="text-sm text-slate-500">{tt('no_periods_selected', 'Nenhum período selecionado.')}</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {(form.periodo_ids || []).map((id) => {
                        const p = periods.find((x) => String(x.id) === String(id));
                        const status = String(p?.status || '').trim().toLowerCase();
                        const fechado = status === 'fechado' || status === 'encerrado' || !!p?.data_fechamento;
                        return (
                          <div key={id} className="flex items-center justify-between px-2 py-2 rounded border border-slate-200 dark:border-slate-800">
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{p ? `${p.codigo} — ${p.descricao}` : id}</div>
                              <div className={`text-xs ${fechado ? 'text-slate-500' : 'text-emerald-700 dark:text-emerald-300'}`}>{fechado ? 'Fechado' : 'Aberto'}</div>
                            </div>
                            <button type="button" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setForm((f) => ({ ...f, periodo_ids: (f.periodo_ids || []).filter((x) => String(x) !== String(id)) }))}><X size={16} /></button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button variant="secondary" size="sm" type="button" title={tt('select_all_open_periods', 'Selecionar abertos')} aria-label={tt('select_all_open_periods', 'Selecionar abertos')} className="p-0 h-10 w-10 justify-center" icon={<ListChecks size={16} />} onClick={() => {
                    const allowedCompanyIds = new Set(companies.map((c) => Number(c.id)));
                    const openAndAllowed = periods.filter((p) => p && String(p.status || '').toLowerCase() !== 'fechado' && String(p.status || '').toLowerCase() !== 'encerrado' && !p.data_fechamento && allowedCompanyIds.has(Number(p.empresa_id || 0)));
                    setForm((f) => ({ ...f, periodo_ids: openAndAllowed.map((p) => String(p.id)) }));
                  }} />
                  <Button variant="secondary" size="sm" type="button" title={tt('clear', 'Limpar')} aria-label={tt('clear', 'Limpar')} className="p-0 h-10 w-10 justify-center" icon={<RotateCcw size={16} />} onClick={() => setForm((f) => ({ ...f, periodo_ids: [] }))} />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Resumo</div>
                <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                  Selecione ao menos um período aberto para habilitar o envio.
                </div>
                <div className="mt-4 rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                  <div className="text-xs text-slate-600 dark:text-slate-300">Dica</div>
                  <div className="mt-1 text-sm text-slate-800 dark:text-slate-100">Use “Selecionar abertos” para marcar todos os períodos abertos das empresas permitidas.</div>
                </div>
              </div>
            </div>
          </TabPanel>

          <TabPanel active={activeTab === 'mensagem'}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <Input label={tt('title', 'Título')} value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} />
                <div className="mt-4">
                  <RichTextEditor
                    label={tt('content', 'Mensagem')}
                    value={form.mensagem}
                    onChange={({ html }) => setForm((f) => ({ ...f, mensagem: html }))}
                  />
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Prévia</div>
                <div className="mt-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4">
                  <div className="text-base font-semibold text-slate-900 dark:text-slate-100">{form.titulo || 'Notificação'}</div>
                  <div className="mt-3">
                    {form.mensagem ? (
                      <div className="prose prose-slate dark:prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: sanitizeBasicRichHtml(form.mensagem) }} />
                    ) : (
                      <div className="text-sm text-slate-600 dark:text-slate-300">Digite a mensagem para visualizar.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>

          <TabPanel active={activeTab === 'notificacao'}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Input label={tt('users', 'Usuário')} value={userQuery} onChange={(e) => setUserQuery(e.target.value)} placeholder={tt('all', 'Todos')} disabled={form.notificar_todos} />
                  </div>
                  <Button variant="secondary" size="sm" type="button" title={tt('search', 'Buscar')} aria-label={tt('search', 'Buscar')} className="p-0 h-10 w-10 justify-center" onClick={() => setUserModalOpen(true)} disabled={form.notificar_todos || (usersFiltered || []).length === 0} icon={<Search size={16} />} />
                  <Button variant="primary" size="sm" type="button" title={tt('add', 'Adicionar')} aria-label={tt('add', 'Adicionar')} className="p-0 h-10 w-10 justify-center" onClick={() => {
                    if (form.notificar_todos) return;
                    const q = userQuery.trim().toLowerCase();
                    const match = usersFiltered.find((u) => String(u.nome_completo || '').toLowerCase().includes(q) || String(u.email_corporativo || u.email || '').toLowerCase().includes(q));
                    if (match) setForm((f) => ({ ...f, usuario_ids: Array.from(new Set([...(f.usuario_ids || []), String(match.id)])) }));
                  }} icon={<Plus size={16} />} disabled={form.notificar_todos || (usersFiltered || []).length === 0} />
                </div>

                <div className="mt-3 h-[260px] overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 p-2">
                  {form.notificar_todos ? (
                    <p className="text-sm text-slate-600 dark:text-slate-300">{tt('notify_all_hint_periods', 'Todos os usuários dos períodos selecionados serão notificados.')}</p>
                  ) : (
                    (form.usuario_ids || []).length === 0 ? (
                      <p className="text-sm text-slate-500">{tt('no_users_selected', 'Nenhum usuário selecionado.')}</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {(form.usuario_ids || []).map((id) => {
                          const u = usersFiltered.find((x) => String(x.id) === String(id));
                          return (
                            <div key={id} className="flex items-center justify-between px-2 py-2 rounded border border-slate-200 dark:border-slate-800">
                              <div className="min-w-0">
                                <div className="text-sm font-medium truncate">{u ? u.nome_completo : id}</div>
                                <div className="text-xs text-slate-600 dark:text-slate-300 truncate">{u ? (u.email_corporativo || u.email || '') : ''}</div>
                              </div>
                              <button type="button" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setForm((f) => ({ ...f, usuario_ids: (f.usuario_ids || []).filter((x) => String(x) !== String(id)) }))}><X size={16} /></button>
                            </div>
                          );
                        })}
                      </div>
                    )
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <input type="checkbox" checked={form.notificar_todos} onChange={(e) => setForm((f) => ({ ...f, notificar_todos: e.target.checked, usuario_ids: e.target.checked ? [] : f.usuario_ids }))} disabled={selectedOpenPeriods.length === 0} />
                  <span className="text-sm">{tt('notify_all_users', 'Notificar todos os usuários')}</span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Entrega na plataforma</div>
                <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">A notificação será entregue no sino para os destinatários selecionados.</div>
                <div className="mt-4 rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                  <div className="text-xs text-slate-600 dark:text-slate-300">Dica</div>
                  <div className="mt-1 text-sm text-slate-800 dark:text-slate-100">Se quiser enviar para todos, marque “Notificar todos os usuários” (exige período aberto).</div>
                </div>
              </div>
            </div>
          </TabPanel>

          <TabPanel active={activeTab === 'emails'}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Destinatários</div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={form.enviar_email} onChange={(e) => setForm((f) => ({ ...f, enviar_email: e.target.checked }))} />
                    <span className="text-sm">{tt('send_email', 'Enviar por e-mail')}</span>
                  </div>
                </div>

                <div className="mt-3 rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                  <div className="text-xs text-slate-600 dark:text-slate-300">Para</div>
                  <div className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                    {form.notificar_todos ? 'Todos os usuários do(s) período(s) aberto(s) selecionado(s)' : `${(form.usuario_ids || []).length} usuário(s) selecionado(s)`}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Input label={tt('cc', 'Cc')} value={ccQuery} onChange={(e) => setCcQuery(e.target.value)} placeholder={tt('cc_placeholder', 'fulano.tal@empresa.com')} />
                    </div>
                    <Button variant="secondary" size="sm" type="button" title={tt('search', 'Buscar')} aria-label={tt('search', 'Buscar')} className="p-0 h-10 w-10 justify-center" onClick={() => setCcModalOpen(true)} disabled={(usersFiltered || []).length === 0} icon={<Search size={16} />} />
                    <Button variant="primary" size="sm" type="button" title={tt('add', 'Adicionar')} aria-label={tt('add', 'Adicionar')} className="p-0 h-10 w-10 justify-center" onClick={() => {
                      const q = ccQuery.trim().toLowerCase();
                      const match = usersFiltered.find((u) => String(u.nome_completo || '').toLowerCase().includes(q) || String(u.email_corporativo || u.email || '').toLowerCase().includes(q));
                      if (match) {
                        setForm((f) => ({ ...f, cc_usuario_ids: Array.from(new Set([...(f.cc_usuario_ids || []), String(match.id)])) }));
                        return;
                      }
                      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(q)) {
                        setForm((f) => ({ ...f, cc_usuario_ids: Array.from(new Set([...(f.cc_usuario_ids || []), q])) }));
                      }
                    }} icon={<Plus size={16} />} disabled={(usersFiltered || []).length === 0} />
                  </div>

                  <div className="mt-3 h-[220px] overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 p-2">
                    {(form.cc_usuario_ids || []).length === 0 ? (
                      <p className="text-sm text-slate-500">{tt('no_cc_selected', 'Nenhum Cc adicionado.')}</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {(form.cc_usuario_ids || []).map((id) => {
                          const u = usersFiltered.find((x) => String(x.id) === String(id));
                          return (
                            <div key={id} className="flex items-center justify-between px-2 py-2 rounded border border-slate-200 dark:border-slate-800">
                              <div className="text-sm min-w-0 truncate">{u ? (u.email_corporativo || u.email || u.nome_completo) : id}</div>
                              <button type="button" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setForm((f) => ({ ...f, cc_usuario_ids: (f.cc_usuario_ids || []).filter((x) => String(x) !== String(id)) }))}><X size={16} /></button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Regras de envio</div>
                <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                  O envio fica disponível apenas quando existir um período aberto selecionado e houver usuários cadastrados no projeto.
                </div>
                <div className="mt-4 rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                  <div className="text-xs text-slate-600 dark:text-slate-300">Status</div>
                  <div className={`mt-1 text-sm font-medium ${canSendByRules ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
                    {canSendByRules ? 'Pronto para enviar' : 'Pendente'}
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => navigate('/notifications')}>{tt('back', 'Voltar')}</Button>
            <Button variant="primary" type="submit" disabled={!canSendByRules}>{tt('send', 'Enviar')}</Button>
          </div>
        </div>
      </form>
      {periodModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center">
          <div className="bg-white dark:bg-slate-950 w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{tt('select_periods', 'Selecionar Períodos')}</h3>
              <Button variant="secondary" onClick={() => setPeriodModalOpen(false)} title={tt('close', 'Fechar')} aria-label={tt('close', 'Fechar')} className="px-2 py-2"><X size={18} /></Button>
            </div>
            <Input label={tt('search', 'Buscar')} value={periodQuery} onChange={(e) => setPeriodQuery(e.target.value)} />
            <div className="mt-3 max-h-64 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800">
              {(() => {
                const q = periodQuery.trim().toLowerCase();
                const allowedCompanyIds = new Set(companies.map((c) => Number(c.id)));
                const openAndAllowed = periods.filter((p) => p && String(p.status || '').toLowerCase() !== 'fechado' && String(p.status || '').toLowerCase() !== 'encerrado' && !p.data_fechamento && allowedCompanyIds.has(Number(p.empresa_id || 0)));
                const filtered = q ? openAndAllowed.filter((p) => String(p.codigo || '').toLowerCase().includes(q) || String(p.descricao || '').toLowerCase().includes(q)) : openAndAllowed;
                if (filtered.length === 0) return <div className="px-3 py-2 text-slate-600 dark:text-slate-300">{tt('no_periods_found', 'Nenhum período encontrado.')}</div>;
                return filtered.map((p) => (
                  <button key={p.id} className={`w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 ${String(selectedPeriodId) === String(p.id) ? 'bg-slate-100 dark:bg-slate-800' : ''}`} onClick={() => setSelectedPeriodId(String(p.id))}>
                    <div className="font-medium text-slate-900 dark:text-slate-100">{p.codigo} — {p.descricao}</div>
                  </button>
                ));
              })()}
            </div>
            <div className="mt-3 flex items-center justify-end gap-2">
              <Button variant="primary" title={tt('add', 'Adicionar')} aria-label={tt('add', 'Adicionar')} className="p-0 h-10 w-10 justify-center" icon={<Plus size={18} />} onClick={() => {
                if (!selectedPeriodId) return;
                setForm((f) => ({ ...f, periodo_ids: Array.from(new Set([...(f.periodo_ids || []), String(selectedPeriodId)])) }));
                setSelectedPeriodId('');
                setPeriodModalOpen(false);
              }} />
              <Button variant="secondary" onClick={() => { setSelectedPeriodId(''); setPeriodModalOpen(false); }}>{tt('close', 'Fechar')}</Button>
            </div>
          </div>
        </div>
      )}

      {userModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center">
          <div className="bg-white dark:bg-slate-950 w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{tt('select_users', 'Selecionar Usuários')}</h3>
              <Button variant="secondary" onClick={() => setUserModalOpen(false)} title={tt('close', 'Fechar')} aria-label={tt('close', 'Fechar')} className="px-2 py-2"><X size={18} /></Button>
            </div>
            <Input label={tt('search', 'Buscar')} value={userQuery} onChange={(e) => setUserQuery(e.target.value)} />
            <div className="mt-3 max-h-64 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800">
              {(() => {
                const q = userQuery.trim().toLowerCase();
                const list = usersFiltered || [];
                const filtered = q ? list.filter((u) => String(u.nome_completo || '').toLowerCase().includes(q) || String(u.email_corporativo || u.email || '').toLowerCase().includes(q)) : list;
                if (filtered.length === 0) return <div className="px-3 py-2 text-slate-600 dark:text-slate-300">{tt('no_users_found', 'Nenhum usuário encontrado.')}</div>;
                return filtered.map((u) => {
                  const id = String(u.id);
                  const checked = selectedUserIds.includes(id);
                  return (
                    <label key={id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer">
                      <input type="checkbox" checked={checked} onChange={(e) => {
                        setSelectedUserIds((prev) => {
                          const set = new Set(prev);
                          if (e.target.checked) set.add(id); else set.delete(id);
                          return Array.from(set);
                        });
                      }} />
                      <span className="text-sm text-slate-900 dark:text-slate-100">{u.nome_completo} — {u.email_corporativo || u.email || ''}</span>
                    </label>
                  );
                });
              })()}
            </div>
            <div className="mt-3 flex items-center justify-end gap-2">
              <Button variant="primary" title={tt('add', 'Adicionar')} aria-label={tt('add', 'Adicionar')} className="p-0 h-10 w-10 justify-center" icon={<Plus size={18} />} onClick={() => {
                if (selectedUserIds.length === 0) return;
                setForm((f) => ({ ...f, usuario_ids: Array.from(new Set([...(f.usuario_ids || []), ...selectedUserIds])) }));
                setSelectedUserIds([]);
                setUserModalOpen(false);
              }} />
              <Button variant="secondary" onClick={() => { setSelectedUserIds([]); setUserModalOpen(false); }}>{tt('close', 'Fechar')}</Button>
            </div>
          </div>
        </div>
      )}

      {ccModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center">
          <div className="bg-white dark:bg-slate-950 w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{tt('select_cc', 'Selecionar Cc')}</h3>
              <Button variant="secondary" onClick={() => setCcModalOpen(false)} title={tt('close', 'Fechar')} aria-label={tt('close', 'Fechar')} className="px-2 py-2"><X size={18} /></Button>
            </div>
            <Input label={tt('search', 'Buscar')} value={ccQuery} onChange={(e) => setCcQuery(e.target.value)} />
            <div className="mt-3 max-h-64 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800">
              {(() => {
                const q = ccQuery.trim().toLowerCase();
                const list = usersFiltered || [];
                const filtered = q ? list.filter((u) => String(u.nome_completo || '').toLowerCase().includes(q) || String(u.email_corporativo || u.email || '').toLowerCase().includes(q)) : list;
                if (filtered.length === 0) return <div className="px-3 py-2 text-slate-600 dark:text-slate-300">{tt('no_cc_found', 'Nenhum colaborador encontrado.')}</div>;
                return filtered.map((u) => {
                  const id = String(u.id);
                  const checked = selectedCcIds.includes(id);
                  return (
                    <label key={id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer">
                      <input type="checkbox" checked={checked} onChange={(e) => {
                        setSelectedCcIds((prev) => {
                          const set = new Set(prev);
                          if (e.target.checked) set.add(id); else set.delete(id);
                          return Array.from(set);
                        });
                      }} />
                      <span className="text-sm text-slate-900 dark:text-slate-100">{u.nome_completo} — {u.email_corporativo || u.email || ''}</span>
                    </label>
                  );
                });
              })()}
            </div>
            <div className="mt-3 flex items-center justify-end gap-2">
              <Button variant="primary" title={tt('add', 'Adicionar')} aria-label={tt('add', 'Adicionar')} className="p-0 h-10 w-10 justify-center" icon={<Plus size={18} />} onClick={() => {
                if (selectedCcIds.length === 0) return;
                setForm((f) => ({ ...f, cc_usuario_ids: Array.from(new Set([...(f.cc_usuario_ids || []), ...selectedCcIds])) }));
                setSelectedCcIds([]);
                setCcModalOpen(false);
              }} />
              <Button variant="secondary" onClick={() => { setSelectedCcIds([]); setCcModalOpen(false); }}>{tt('close', 'Fechar')}</Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
