import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import { getNotifications } from '../apiClient';

export default function NotificationsPage() {
  const { t } = useTranslation();
  const tt = (k, fb) => { const v = t(k); return v === k ? fb : v; };
  const navigate = useNavigate();
  const [list, setList] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [status, setStatus] = React.useState('pendente');
  const [query, setQuery] = React.useState('');

  const canSend = React.useMemo(() => {
    try {
      const raw = localStorage.getItem('assetlife_permissoes');
      const rotas = raw ? JSON.parse(raw)?.rotas : [];
      const allowed = new Set(Array.isArray(rotas) ? rotas : []);
      return (
        allowed.size === 0
          ? true
          : (allowed.has('/notifications/new') || allowed.has('/notificacoes/nova'))
      );
    } catch { return true; }
  }, []);

  const load = React.useCallback(async () => {
    setLoading(true); setError('');
    try {
      const effectiveStatus = (!canSend && status === 'enviadas') ? 'pendente' : status;
      const data = (effectiveStatus === 'enviadas')
        ? await getNotifications({ from_me: 1 })
        : effectiveStatus === 'recebidas'
          ? await getNotifications({})
          : await getNotifications({ status: effectiveStatus });
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      setList([]);
      setError('');
    } finally {
      setLoading(false);
    }
  }, [status, canSend]);

  React.useEffect(() => { load(); }, [load]);

  const normalized = React.useMemo(() => {
    const arr = Array.isArray(list) ? list : [];
    return arr.map((n) => ({
      ...n,
      titulo: n.titulo ?? n.title ?? n.assunto ?? '',
      remetente: n.remetente ?? n.sender ?? n.remetente_nome ?? '',
      created_at: n.created_at ?? n.createdAt ?? n.data_criacao ?? n.data ?? null,
    }));
  }, [list]);

  const filtered = React.useMemo(() => {
    const term = (query || '').trim().toLowerCase();
    const arr = normalized;
    if (!term) return arr;
    return arr.filter((n) => String(n.titulo || '').toLowerCase().includes(term));
  }, [normalized, query]);

  const columns = [
    { key: 'titulo', header: tt('title', 'Título') },
    { key: 'status', header: tt('status', 'Status'), width: 140 },
    { key: 'created_at', header: tt('date', 'Data'), width: 160, render: (v) => (v ? new Date(v).toLocaleString('pt-BR') : '') },
    { key: 'remetente', header: tt('sender', 'Remetente'), width: 220 },
  ];

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{tt('notifications', 'Notificações')}</h2>
      <div className="flex items-center gap-2">
          {canSend && (
            <Button variant="primary" onClick={() => navigate('/notifications/new')}>{tt('new', 'Nova')}</Button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-2 mb-3">
        <input className="px-3 py-2 rounded-md border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder={tt('search', 'Pesquisar por título')} value={query} onChange={(e) => setQuery(e.target.value)} />
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pendente">{tt('pending', 'Pendente')}</option>
          <option value="lida">{tt('read', 'Lida')}</option>
          <option value="arquivada">{tt('archived', 'Arquivada')}</option>
          {canSend && <option value="enviadas">{tt('sent_by_me', 'Enviadas')}</option>}
          <option value="recebidas">{tt('received', 'Recebidas')}</option>
        </Select>
      </div>
      {loading && <p className="text-slate-500">{tt('loading', 'Carregando...')}</p>}
      {!loading && (
        filtered.length === 0 ? (
          <p className="text-slate-500">{tt('no_notifications', 'Sem notificações')}</p>
        ) : (
          <Table columns={columns} data={filtered} onRowClick={(row) => navigate(`/notifications/${row.id}`)} />
        )
      )}
    </section>
  );
}
