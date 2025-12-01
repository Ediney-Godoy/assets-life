import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import { getCompanies, getUsers, createNotification } from '../apiClient';
import toast from 'react-hot-toast';

export default function NotificationSendPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [companies, setCompanies] = React.useState([]);
  const [users, setUsers] = React.useState([]);
  const [form, setForm] = React.useState({ titulo: '', mensagem: '', empresa_ids: [], usuario_ids: [], enviar_email: false, notificar_todos: false });
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
      const empresasSelecionadas = form.empresa_ids.map((x) => Number(x));
      const usuariosSelecionados = form.usuario_ids.map((x) => Number(x));
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

  if (loading) return <p className="text-slate-500">{t('loading') || 'Carregando...'}</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{t('send_notification') || 'Enviar Notificação'}</h2>
        <Button variant="secondary" onClick={() => navigate('/notifications')}>{t('back') || 'Voltar'}</Button>
      </div>
      <form className="grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={onSubmit}>
        <Input label={t('title') || 'Título'} value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} />
        <div className="md:col-span-2">
          <Input label={t('content') || 'Conteúdo'} value={form.mensagem} onChange={(e) => setForm((f) => ({ ...f, mensagem: e.target.value }))} multiline rows={6} />
        </div>
        <div>
          <label className="block text-sm mb-1">{t('companies') || 'Empresas'}</label>
          <select multiple className="select w-full h-40" value={form.empresa_ids} onChange={(e) => setForm((f) => ({ ...f, empresa_ids: Array.from(e.target.selectedOptions).map((o) => o.value) }))}>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">{t('users') || 'Usuários'}</label>
          <select multiple className="select w-full h-40" disabled={form.notificar_todos} value={form.usuario_ids} onChange={(e) => setForm((f) => ({ ...f, usuario_ids: Array.from(e.target.selectedOptions).map((o) => o.value) }))}>
            {users.map((u) => <option key={u.id} value={u.id}>{u.nome_completo}</option>)}
          </select>
          {form.notificar_todos && (
            <p className="text-xs text-slate-500 mt-1">{t('notify_all_hint') || 'Todos os usuários das empresas selecionadas serão notificados.'}</p>
          )}
        </div>
        <div className="md:col-span-2 flex items-center gap-2">
          <input type="checkbox" checked={form.notificar_todos} onChange={(e) => setForm((f) => ({ ...f, notificar_todos: e.target.checked }))} />
          <span>{t('notify_all_users') || 'Notificar todos os usuários'}</span>
        </div>
        <div className="md:col-span-2 flex items-center gap-2">
          <input type="checkbox" checked={form.enviar_email} onChange={(e) => setForm((f) => ({ ...f, enviar_email: e.target.checked }))} />
          <span>{t('send_email') || 'Enviar por e-mail'}</span>
        </div>
        <div className="md:col-span-2">
          <Button variant="primary" type="submit">{t('send') || 'Enviar'}</Button>
        </div>
      </form>
    </section>
  );
}
