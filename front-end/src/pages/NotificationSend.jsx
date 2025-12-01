import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import { getCompanies, getUsers, createNotification } from '../apiClient';
import { Search, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NotificationSendPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [companies, setCompanies] = React.useState([]);
  const [users, setUsers] = React.useState([]);
  const [form, setForm] = React.useState({ titulo: '', mensagem: '', empresa_ids: [], usuario_ids: [], cc_usuario_ids: [], enviar_email: false, notificar_todos: false });
  const [userQuery, setUserQuery] = React.useState('');
  const [companyQuery, setCompanyQuery] = React.useState('');
  const [ccQuery, setCcQuery] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const run = async () => {
      setLoading(true); setError('');
      try {
        const [c, u] = await Promise.all([getCompanies(), getUsers()]);
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
      const empresasSelecionadas = (Array.isArray(form.empresa_ids) ? form.empresa_ids : []).map((x) => Number(x));
      const usuariosSelecionados = (Array.isArray(form.usuario_ids) ? form.usuario_ids : []).map((x) => Number(x));
      const ccSelecionados = (Array.isArray(form.cc_usuario_ids) ? form.cc_usuario_ids : []).map((x) => Number(x));
      if (!form.notificar_todos && usuariosSelecionados.length === 0) {
        toast.error(t('select_users_or_notify_all') || 'Selecione ao menos um usuário ou marque "Notificar todos"');
        return;
      }
      if (form.notificar_todos && empresasSelecionadas.length === 0) {
        toast.error(t('select_companies_for_notify_all') || 'Selecione ao menos uma empresa para "Notificar todos"');
        return;
      }
      const payload = {
        titulo: form.titulo,
        mensagem: form.mensagem,
        empresa_ids: empresasSelecionadas,
        usuario_ids: form.notificar_todos ? [] : usuariosSelecionados,
        cc_usuario_ids: ccSelecionados,
        notificar_todos: !!form.notificar_todos,
        enviar_email: !!form.enviar_email,
      };
      await createNotification(payload);
      toast.success(t('sent') || 'Enviado');
      navigate('/notifications');
    } catch (err) {
      toast.error(String(err?.message || err));
    }
  };

  const usersFiltered = React.useMemo(() => {
    const ids = Array.isArray(form.empresa_ids) ? form.empresa_ids : [];
    const empresas = new Set(ids.map((x) => Number(x)));
    if (empresas.size === 0) return users;
    return users.filter((u) => {
      const companyId = Number(u.empresa_id ?? u.company_id ?? u.companyId ?? 0);
      return empresas.has(companyId);
    });
  }, [users, form.empresa_ids]);

  if (loading) return <p className="text-slate-500">{t('loading') || 'Carregando...'}</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{t('send_notification') || 'Enviar Notificação'}</h2>
        <Button variant="secondary" onClick={() => navigate('/notifications')}>{t('back') || 'Voltar'}</Button>
      </div>
      <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={onSubmit}>
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 min-h-[360px]">
            <div className="space-y-3">
              <Input label={t('title') || 'Título'} value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} />
              <Input label={t('content') || 'Mensagem'} value={form.mensagem} onChange={(e) => setForm((f) => ({ ...f, mensagem: e.target.value }))} multiline rows={8} className="min-h-[180px]" />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 min-h-[360px]">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input label={t('cc') || 'Cc'} value={ccQuery} onChange={(e) => setCcQuery(e.target.value)} placeholder="fulano.tal@empresa.com" />
              </div>
              <Button variant="secondary" size="sm" type="button" title="Buscar" icon={<Search size={16} />} />
              <Button variant="primary" size="sm" type="button" onClick={() => {
                const q = ccQuery.trim().toLowerCase();
                const match = usersFiltered.find((u) => String(u.nome_completo || '').toLowerCase().includes(q) || String(u.email_corporativo || u.email || '').toLowerCase().includes(q));
                if (match) setForm((f) => ({ ...f, cc_usuario_ids: Array.from(new Set([...(f.cc_usuario_ids || []), String(match.id)])) }));
              }} icon={<Plus size={16} />}>{t('add') || 'Adicionar'}</Button>
            </div>
            <div className="mt-3 h-[220px] overflow-y-auto rounded-md border border-slate-200 dark:border-slate-800 p-2">
              {(form.cc_usuario_ids || []).length === 0 ? (
                <p className="text-sm text-slate-500">{t('no_cc_selected') || 'Nenhum Cc adicionado.'}</p>
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
                <Input label={t('companies') || 'Empresa'} value={companyQuery} onChange={(e) => setCompanyQuery(e.target.value)} placeholder={t('all') || 'Todas'} />
              </div>
              <Button variant="secondary" size="sm" type="button" title="Buscar" icon={<Search size={16} />} />
              <Button variant="primary" size="sm" type="button" onClick={() => {
                const q = companyQuery.trim().toLowerCase();
                const match = companies.find((c) => String(c.name || '').toLowerCase().includes(q) || String(c.cnpj || '').toLowerCase().includes(q));
                if (match) setForm((f) => ({ ...f, empresa_ids: Array.from(new Set([...(f.empresa_ids || []), String(match.id)])) }));
              }} icon={<Plus size={16} />}>{t('add') || 'Adicionar'}</Button>
            </div>
            <div className="mt-3 h-[220px] overflow-y-auto rounded-md border border-slate-200 dark:border-slate-800 p-2">
              {(form.empresa_ids || []).length === 0 ? (
                <p className="text-sm text-slate-500">{t('no_companies_selected') || 'Nenhuma empresa selecionada.'}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {(form.empresa_ids || []).map((id) => {
                    const c = companies.find((x) => String(x.id) === String(id));
                    return (
                      <div key={id} className="flex items-center justify-between px-2 py-1 rounded border border-slate-200 dark:border-slate-800">
                        <div className="text-sm">{c ? c.name : id}</div>
                        <button type="button" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setForm((f) => ({ ...f, empresa_ids: (f.empresa_ids || []).filter((x) => String(x) !== String(id)) }))}><X size={16} /></button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button variant="secondary" size="sm" type="button" onClick={() => setForm((f) => ({ ...f, empresa_ids: companies.map((c) => String(c.id)) }))}>{t('select_all_companies') || 'Selecionar todas'}</Button>
              <Button variant="secondary" size="sm" type="button" onClick={() => setForm((f) => ({ ...f, empresa_ids: [] }))}>{t('clear') || 'Limpar'}</Button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 min-h-[360px]">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input label={t('users') || 'Usuário'} value={userQuery} onChange={(e) => setUserQuery(e.target.value)} placeholder={t('all') || 'Todos'} />
              </div>
              <Button variant="secondary" size="sm" type="button" title="Buscar" icon={<Search size={16} />} />
              <Button variant="primary" size="sm" type="button" onClick={() => {
                if (form.notificar_todos) return;
                const q = userQuery.trim().toLowerCase();
                const match = usersFiltered.find((u) => String(u.nome_completo || '').toLowerCase().includes(q) || String(u.email_corporativo || u.email || '').toLowerCase().includes(q));
                if (match) setForm((f) => ({ ...f, usuario_ids: Array.from(new Set([...(f.usuario_ids || []), String(match.id)])) }));
              }} icon={<Plus size={16} />}>{t('add') || 'Adicionar'}</Button>
            </div>
            <div className="mt-3 h-[220px] overflow-y-auto rounded-md border border-slate-200 dark:border-slate-800 p-2">
              {form.notificar_todos ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">{t('notify_all_hint') || 'Todos os usuários das empresas selecionadas serão notificados.'}</p>
              ) : (
                (form.usuario_ids || []).length === 0 ? (
                  <p className="text-sm text-slate-500">{t('no_users_selected') || 'Nenhum usuário selecionado.'}</p>
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
              <span className="text-sm">{t('notify_all_users') || 'Notificar todos os usuários'}</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.enviar_email} onChange={(e) => setForm((f) => ({ ...f, enviar_email: e.target.checked }))} />
            <span>{t('send_email') || 'Enviar por e-mail'}</span>
          </div>
          <div className="flex justify-end">
            <Button variant="primary" type="submit">{t('send') || 'Enviar'}</Button>
          </div>
        </div>
      </form>
    </section>
  );
}
