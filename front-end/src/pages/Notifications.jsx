import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import { Plus } from 'lucide-react';
import { getNotifications } from '../apiClient';
import NotificationsFolders from '../components/notifications/NotificationsFolders';
import NotificationList from '../components/notifications/NotificationList';
import NotificationReadingPane from '../components/notifications/NotificationReadingPane';

export default function NotificationsPage() {
  const { t } = useTranslation();
  const tt = (k, fb) => { const v = t(k); return v === k ? fb : v; };
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [list, setList] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [status, setStatus] = React.useState('pendente');
  const [query, setQuery] = React.useState('');
  const [selectedId, setSelectedId] = React.useState(() => searchParams.get('id') || '');

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

  const selectedSummary = React.useMemo(() => {
    const id = String(selectedId || '');
    if (!id) return null;
    return filtered.find((n) => String(n.id) === id) || normalized.find((n) => String(n.id) === id) || null;
  }, [selectedId, filtered, normalized]);

  React.useEffect(() => {
    const urlId = searchParams.get('id') || '';
    if (urlId && String(urlId) !== String(selectedId || '')) {
      setSelectedId(String(urlId));
    }
  }, [searchParams, selectedId]);

  React.useEffect(() => {
    if (loading) return;
    const id = String(selectedId || '');
    if (id && filtered.some((n) => String(n.id) === id)) return;
    if (filtered.length > 0) {
      const next = String(filtered[0].id);
      setSelectedId(next);
      setSearchParams((prev) => {
        const p = new URLSearchParams(prev);
        p.set('id', next);
        return p;
      }, { replace: true });
      return;
    }
    if (id) {
      setSelectedId('');
      setSearchParams((prev) => {
        const p = new URLSearchParams(prev);
        p.delete('id');
        return p;
      }, { replace: true });
    }
  }, [filtered, loading, selectedId, setSearchParams]);

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{tt('notifications', 'Notificações')}</h2>
        </div>
        <div className="flex items-center gap-2">
          {canSend && (
            <Button
              variant="primary"
              onClick={() => navigate('/notifications/new')}
              title={tt('new', 'Nova')}
              aria-label={tt('new', 'Nova')}
              icon={<Plus size={18} />}
              className="p-0 h-10 w-10 justify-center"
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(360px,1fr)_minmax(360px,1fr)] gap-3 h-[calc(100vh-220px)] min-h-[520px]">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
          <NotificationsFolders
            activeId={status}
            disabledIds={!canSend ? ['enviadas'] : []}
            onSelect={(id) => {
              const next = (!canSend && id === 'enviadas') ? 'pendente' : id;
              setStatus(next);
            }}
          />
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden flex flex-col">
          <div className="p-3 border-b border-slate-200 dark:border-slate-800">
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <input
                className="px-3 py-2 rounded-md border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder={tt('search', 'Pesquisar por título')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Select value={status} onChange={(e) => setStatus((!canSend && e.target.value === 'enviadas') ? 'pendente' : e.target.value)}>
                <option value="pendente">{tt('pending', 'Pendente')}</option>
                <option value="lida">{tt('read', 'Lida')}</option>
                <option value="arquivada">{tt('archived', 'Arquivada')}</option>
                {canSend && <option value="enviadas">{tt('sent_by_me', 'Enviadas')}</option>}
                <option value="recebidas">{tt('received', 'Recebidas')}</option>
              </Select>
            </div>
          </div>
          {loading ? (
            <div className="p-4 text-sm text-slate-600 dark:text-slate-300">{tt('loading', 'Carregando...')}</div>
          ) : (
            <NotificationList
              items={filtered}
              selectedId={selectedId}
              emptyLabel={tt('no_notifications', 'Sem notificações')}
              onSelect={(id) => {
                setSelectedId(id);
                setSearchParams((prev) => {
                  const p = new URLSearchParams(prev);
                  p.set('id', String(id));
                  return p;
                }, { replace: true });
              }}
            />
          )}
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
          <NotificationReadingPane
            selectedId={selectedId}
            selectedSummary={selectedSummary}
            onRefresh={load}
          />
        </div>
      </div>

      {error ? (
        <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">{error}</div>
      ) : null}
    </section>
  );
}
