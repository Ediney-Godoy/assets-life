import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import { getNotification, markNotificationRead, archiveNotification } from '../apiClient';
import { ArrowLeft, Archive as ArchiveIcon, CheckCircle } from 'lucide-react';

export default function NotificationDetailPage() {
  const { t } = useTranslation();
  const tt = (k, fb) => { const v = t(k); return v === k ? fb : v; };
  const navigate = useNavigate();
  const { id } = useParams();
  const [item, setItem] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true); setError('');
      try {
        const data = await getNotification(id);
        if (active) setItem(data || null);
        try { await markNotificationRead(id); } catch {}
      } catch (err) {
        setError('');
      } finally {
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  const onArchive = async () => {
    try {
      await archiveNotification(id);
      navigate('/notifications', { replace: true });
    } catch (err) {
      setError('');
    }
  };

  if (loading) return <p className="text-slate-500">{tt('loading', 'Carregando...')}</p>;
  if (error) return <p className="text-slate-500">{tt('no_notifications', 'Sem notificações')}</p>;
  if (!item) return <p className="text-slate-500">{tt('not_found', 'Não encontrada')}</p>;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{item.titulo || tt('notification', 'Notificação')}</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/notifications')}
            title={tt('back', 'Voltar')}
            aria-label={tt('back', 'Voltar')}
            className="p-0 h-10 w-10 justify-center"
            icon={<ArrowLeft size={18} />}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              try {
                const updated = await markNotificationRead(id);
                setItem((prev) => updated || (prev ? { ...prev, status: 'lida', read: true } : prev));
              } catch {}
            }}
            title={tt('mark_read', 'Marcar como lida')}
            aria-label={tt('mark_read', 'Marcar como lida')}
            className="p-0 h-10 w-10 justify-center"
            icon={<CheckCircle size={18} />}
          />
          <Button
            variant="danger"
            size="sm"
            onClick={onArchive}
            title={tt('archive', 'Arquivar')}
            aria-label={tt('archive', 'Arquivar')}
            className="p-0 h-10 w-10 justify-center"
            icon={<ArchiveIcon size={18} />}
          />
        </div>
      </div>
      <div className="space-y-2 text-slate-700 dark:text-slate-300">
        <div>{tt('date', 'Data')}: {item.created_at ? new Date(item.created_at).toLocaleString('pt-BR') : ''}</div>
        <div>{tt('sender', 'Remetente')}: {item.remetente ?? item.sender ?? item.remetente_nome ?? '-'}</div>
        <div className="whitespace-pre-wrap text-slate-900 dark:text-slate-100">{item.mensagem || item.message || ''}</div>
      </div>
    </section>
  );
}
