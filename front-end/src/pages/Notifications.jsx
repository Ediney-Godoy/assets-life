import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import { getNotifications } from '../apiClient';

export default function NotificationsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [list, setList] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [status, setStatus] = React.useState('pendente');
  const [query, setQuery] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await getNotifications({ status });
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      setList([]);
      setError('');
    } finally {
      setLoading(false);
    }
  }, [status]);

  React.useEffect(() => { load(); }, [load]);

  const filtered = React.useMemo(() => {
    const term = (query || '').trim().toLowerCase();
    let arr = Array.isArray(list) ? list : [];
    if (!term) return arr;
    return arr.filter((n) => String(n.titulo || '').toLowerCase().includes(term));
  }, [list, query]);

  const columns = [
    { key: 'titulo', header: t('title') || 'Título' },
    { key: 'status', header: t('status') || 'Status', width: 140 },
    { key: 'created_at', header: t('date') || 'Data', width: 160, render: (v) => (v ? new Date(v).toLocaleString('pt-BR') : '') },
    { key: 'remetente', header: t('sender') || 'Remetente', width: 220 },
  ];

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{t('notifications') || 'Notificações'}</h2>
        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={() => navigate('/notifications/new')}>{t('new') || 'Nova'}</Button>
        </div>
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-2 mb-3">
        <input className="px-3 py-2 rounded-md border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder={t('search') || 'Pesquisar por título'} value={query} onChange={(e) => setQuery(e.target.value)} />
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pendente">{t('pending') || 'Pendente'}</option>
          <option value="lida">{t('read') || 'Lida'}</option>
          <option value="arquivada">{t('archived') || 'Arquivada'}</option>
          <option value="">{t('all') || 'Todas'}</option>
        </Select>
      </div>
      {loading && <p className="text-slate-500">{t('loading') || 'Carregando...'}</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && (
        filtered.length === 0 ? (
          <p className="text-slate-500">{t('no_notifications') || 'Sem notificações'}</p>
        ) : (
          <Table columns={columns} data={filtered} onRowClick={(row) => navigate(`/notifications/${row.id}`)} />
        )
      )}
    </section>
  );
}
