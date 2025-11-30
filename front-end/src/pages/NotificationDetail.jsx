import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import { getNotification, markNotificationRead, archiveNotification } from '../apiClient';

export default function NotificationDetailPage() {
  const { t } = useTranslation();
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
        setError(String(err?.message || err));
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
      setError(String(err?.message || err));
    }
  };

  if (loading) return <p className="text-slate-500">{t('loading') || 'Carregando...'}</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!item) return <p className="text-slate-500">{t('not_found') || 'Não encontrada'}</p>;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{item.titulo || t('notification') || 'Notificação'}</h2>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => navigate('/notifications')}>{t('back') || 'Voltar'}</Button>
          <Button variant="danger" onClick={onArchive}>{t('archive') || 'Arquivar'}</Button>
        </div>
      </div>
      <div className="space-y-2 text-slate-700 dark:text-slate-300">
        <div>{t('date') || 'Data'}: {item.created_at ? new Date(item.created_at).toLocaleString('pt-BR') : ''}</div>
        <div>{t('sender') || 'Remetente'}: {item.remetente || '-'}</div>
        <div className="whitespace-pre-wrap text-slate-900 dark:text-slate-100">{item.mensagem || item.message || ''}</div>
      </div>
      <div className="mt-4">
        <Button variant="primary" onClick={() => markNotificationRead(id)}>{t('mark_read') || 'Marcar como lida'}</Button>
      </div>
    </section>
  );
}

