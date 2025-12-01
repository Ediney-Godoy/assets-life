import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import { getCompanies, getUsers, getReviewPeriods, createNotification } from '../apiClient';
import { Search, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

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
  const [form, setForm] = React.useState({ titulo: '', mensagem: '', periodo_ids: [], usuario_ids: [], cc_usuario_ids: [], enviar_email: false, notificar_todos: false });
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
      const empresasSelecionadas = (() => {
        const ids = new Set();
        for (const pid of periodosSelecionados) {
          const p = periods.find((x) => Number(x.id) === Number(pid));
          if (p?.empresa_id) ids.add(Number(p.empresa_id));
        }
        return Array.from(ids);
      })();
      const usuariosSelecionados = (Array.isArray(form.usuario_ids) ? form.usuario_ids : []).map((x) => Number(x));
      const ccSelecionados = (Array.isArray(form.cc_usuario_ids) ? form.cc_usuario_ids : []).map((x) => Number(x));
      if (!form.notificar_todos && usuariosSelecionados.length === 0) {
        toast.error(tt('select_users_or_notify_all', 'Selecione ao menos um usuário ou marque "Notificar todos"'));
        return;
      }
      if (form.notificar_todos && periodosSelecionados.length === 0) {
        toast.error(tt('select_periods_for_notify_all', 'Selecione ao menos um período para "Notificar todos"'));
        return;
      }
      const payload = {
        // campos em PT
        titulo: form.titulo,
        mensagem: form.mensagem,
        empresa_ids: empresasSelecionadas,
        periodo_ids: periodosSelecionados,
        usuario_ids: form.notificar_todos ? [] : usuariosSelecionados,
        cc_usuario_ids: ccSelecionados,
        notificar_todos: !!form.notificar_todos,
        enviar_email: !!form.enviar_email,
        remetente_id: currentUser?.id ? Number(currentUser.id) : undefined,
        // espelhamento em EN (compatibilidade com variações de backend)
        title: form.titulo,
        message: form.mensagem,
        company_ids: empresasSelecionadas,
        period_ids: periodosSelecionados,
        user_ids: form.notificar_todos ? [] : usuariosSelecionados,
        cc_user_ids: ccSelecionados,
        notify_all: !!form.notificar_todos,
        send_email: !!form.enviar_email,
        sender_id: currentUser?.id ? Number(currentUser.id) : undefined,
      };
      await createNotification(payload);
      toast.success(tt('sent', 'Enviado'));
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
    if (empresas.size === 0) return users;
    return users.filter((u) => {
      const companyId = Number(u.empresa_id ?? u.company_id ?? u.companyId ?? 0);
      return empresas.has(companyId);
    });
  }, [users, periods, form.periodo_ids]);

  if (loading) return <p className="text-slate-500">{tt('loading', 'Carregando...')}</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{tt('send_notification', 'Enviar Notificação')}</h2>
        <Button variant="secondary" onClick={() => navigate('/notifications')}>{tt('back', 'Voltar')}</Button>
      </div>
      <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={onSubmit}>
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 min-h-[360px]">
            <div className="space-y-3">
              <Input label={tt('title', 'Título')} value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} />
              <Input label={tt('content', 'Mensagem')} value={form.mensagem} onChange={(e) => setForm((f) => ({ ...f, mensagem: e.target.value }))} multiline rows={8} className="min-h-[180px]" />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 min-h-[360px]">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input label={tt('cc', 'Cc')} value={ccQuery} onChange={(e) => setCcQuery(e.target.value)} placeholder={tt('cc_placeholder', 'fulano.tal@empresa.com')} />
              </div>
              <Button variant="secondary" size="sm" type="button" title={tt('search', 'Buscar')} onClick={() => setCcModalOpen(true)} icon={<Search size={16} />} />
              <Button variant="primary" size="sm" type="button" onClick={() => {
                const q = ccQuery.trim().toLowerCase();
                const match = usersFiltered.find((u) => String(u.nome_completo || '').toLowerCase().includes(q) || String(u.email_corporativo || u.email || '').toLowerCase().includes(q));
                if (match) setForm((f) => ({ ...f, cc_usuario_ids: Array.from(new Set([...(f.cc_usuario_ids || []), String(match.id)])) }));
              }} icon={<Plus size={16} />}>{tt('add', 'Adicionar')}</Button>
            </div>
            <div className="mt-3 h-[220px] overflow-y-auto rounded-md border border-slate-200 dark:border-slate-800 p-2">
              {(form.cc_usuario_ids || []).length === 0 ? (
                <p className="text-sm text-slate-500">{tt('no_cc_selected', 'Nenhum Cc adicionado.')}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {(form.cc_usuario_ids || []).map((id) => {
                    const u = usersFiltered.find((x) => String(x.id) === String(id));
                    return (
                      <div key={id} className="flex items-center justify-between px-2 py-1 rounded border border-slate-200 dark:border-slate-800">
                        <div className="text-sm">{u ? (u.email_corporativo || u.email || u.nome_completo) : id}</div>
                        <button type="button" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setForm((f) => ({ ...f, cc_usuario_ids: (f.cc_usuario_ids || []).filter((x) => String(x) !== String(id)) }))}><X size={16} /></button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 min-h-[360px]">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input label={tt('nav_review_periods', 'Períodos')} value={periodQuery} onChange={(e) => setPeriodQuery(e.target.value)} placeholder={tt('all', 'Todos')} />
              </div>
              <Button variant="secondary" size="sm" type="button" title={tt('search', 'Buscar')} onClick={() => setPeriodModalOpen(true)} icon={<Search size={16} />} />
              <Button variant="primary" size="sm" type="button" onClick={() => {
                const q = periodQuery.trim().toLowerCase();
                const allowedCompanyIds = new Set(companies.map((c) => Number(c.id)));
                const openAndAllowed = periods.filter((p) => p && String(p.status || '').toLowerCase() !== 'fechado' && allowedCompanyIds.has(Number(p.empresa_id || 0)));
                const match = openAndAllowed.find((p) => String(p.codigo || '').toLowerCase().includes(q) || String(p.descricao || '').toLowerCase().includes(q));
                if (match) setForm((f) => ({ ...f, periodo_ids: Array.from(new Set([...(f.periodo_ids || []), String(match.id)])) }));
              }} icon={<Plus size={16} />}>{tt('add', 'Adicionar')}</Button>
            </div>
            <div className="mt-3 h-[220px] overflow-y-auto rounded-md border border-slate-200 dark:border-slate-800 p-2">
              {(form.periodo_ids || []).length === 0 ? (
                <p className="text-sm text-slate-500">{tt('no_periods_selected', 'Nenhum período selecionado.')}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {(form.periodo_ids || []).map((id) => {
                    const p = periods.find((x) => String(x.id) === String(id));
                    return (
                      <div key={id} className="flex items-center justify-between px-2 py-1 rounded border border-slate-200 dark:border-slate-800">
                        <div className="text-sm">{p ? `${p.codigo} — ${p.descricao}` : id}</div>
                        <button type="button" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setForm((f) => ({ ...f, periodo_ids: (f.periodo_ids || []).filter((x) => String(x) !== String(id)) }))}><X size={16} /></button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button variant="secondary" size="sm" type="button" onClick={() => {
                const allowedCompanyIds = new Set(companies.map((c) => Number(c.id)));
                const openAndAllowed = periods.filter((p) => p && String(p.status || '').toLowerCase() !== 'fechado' && allowedCompanyIds.has(Number(p.empresa_id || 0)));
                setForm((f) => ({ ...f, periodo_ids: openAndAllowed.map((p) => String(p.id)) }));
              }}>{tt('select_all_open_periods', 'Selecionar abertos')}</Button>
              <Button variant="secondary" size="sm" type="button" onClick={() => setForm((f) => ({ ...f, periodo_ids: [] }))}>{tt('clear', 'Limpar')}</Button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 min-h-[360px]">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input label={tt('users', 'Usuário')} value={userQuery} onChange={(e) => setUserQuery(e.target.value)} placeholder={tt('all', 'Todos')} />
              </div>
              <Button variant="secondary" size="sm" type="button" title={tt('search', 'Buscar')} onClick={() => setUserModalOpen(true)} disabled={form.notificar_todos} icon={<Search size={16} />} />
              <Button variant="primary" size="sm" type="button" onClick={() => {
                if (form.notificar_todos) return;
                const q = userQuery.trim().toLowerCase();
                const match = usersFiltered.find((u) => String(u.nome_completo || '').toLowerCase().includes(q) || String(u.email_corporativo || u.email || '').toLowerCase().includes(q));
                if (match) setForm((f) => ({ ...f, usuario_ids: Array.from(new Set([...(f.usuario_ids || []), String(match.id)])) }));
              }} icon={<Plus size={16} />}>{tt('add', 'Adicionar')}</Button>
            </div>
            <div className="mt-3 h-[220px] overflow-y-auto rounded-md border border-slate-200 dark:border-slate-800 p-2">
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
                        <div key={id} className="flex items-center justify-between px-2 py-1 rounded border border-slate-200 dark:border-slate-800">
                          <div className="text-sm">{u ? u.nome_completo : id}</div>
                          <button type="button" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setForm((f) => ({ ...f, usuario_ids: (f.usuario_ids || []).filter((x) => String(x) !== String(id)) }))}><X size={16} /></button>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input type="checkbox" checked={form.notificar_todos} onChange={(e) => setForm((f) => ({ ...f, notificar_todos: e.target.checked, usuario_ids: e.target.checked ? [] : f.usuario_ids }))} />
              <span className="text-sm">{tt('notify_all_users', 'Notificar todos os usuários')}</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.enviar_email} onChange={(e) => setForm((f) => ({ ...f, enviar_email: e.target.checked }))} />
            <span>{tt('send_email', 'Enviar por e-mail')}</span>
          </div>
          <div className="flex justify-end">
            <Button variant="primary" type="submit">{tt('send', 'Enviar')}</Button>
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
                const openAndAllowed = periods.filter((p) => p && String(p.status || '').toLowerCase() !== 'fechado' && allowedCompanyIds.has(Number(p.empresa_id || 0)));
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
              <Button variant="primary" onClick={() => {
                if (!selectedPeriodId) return;
                setForm((f) => ({ ...f, periodo_ids: Array.from(new Set([...(f.periodo_ids || []), String(selectedPeriodId)])) }));
                setSelectedPeriodId('');
                setPeriodModalOpen(false);
              }}>{tt('add', 'Adicionar')}</Button>
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
              <Button variant="primary" onClick={() => {
                if (selectedUserIds.length === 0) return;
                setForm((f) => ({ ...f, usuario_ids: Array.from(new Set([...(f.usuario_ids || []), ...selectedUserIds])) }));
                setSelectedUserIds([]);
                setUserModalOpen(false);
              }}>{tt('add', 'Adicionar')}</Button>
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
              <Button variant="primary" onClick={() => {
                if (selectedCcIds.length === 0) return;
                setForm((f) => ({ ...f, cc_usuario_ids: Array.from(new Set([...(f.cc_usuario_ids || []), ...selectedCcIds])) }));
                setSelectedCcIds([]);
                setCcModalOpen(false);
              }}>{tt('add', 'Adicionar')}</Button>
              <Button variant="secondary" onClick={() => { setSelectedCcIds([]); setCcModalOpen(false); }}>{tt('close', 'Fechar')}</Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
