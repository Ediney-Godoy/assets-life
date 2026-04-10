import React from 'react';
import Button from '../ui/Button';
import { Archive, CheckCircle, RefreshCw } from 'lucide-react';
import { getNotification, markNotificationRead, archiveNotification } from '../../apiClient';
import { sanitizeBasicRichHtml } from '../../utils/htmlText';

function formatDate(value) {
  try {
    if (!value) return '';
    return new Date(value).toLocaleString('pt-BR');
  } catch {
    return '';
  }
}

export default function NotificationReadingPane({
  selectedId,
  selectedSummary,
  onRefresh,
}) {
  const [item, setItem] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    const id = selectedId ? String(selectedId) : '';
    if (!id) {
      setItem(null);
      setLoading(false);
      return () => {};
    }
    setItem(selectedSummary || null);
    setLoading(true);
    (async () => {
      try {
        const full = await getNotification(id);
        if (active) setItem(full || selectedSummary || null);
        const fromMe = (full && full.from_me) || (selectedSummary && selectedSummary.from_me) || false;
        if (!fromMe) {
          try {
            const updated = await markNotificationRead(id);
            if (active) {
              if (updated && (updated.mensagem || updated.message || updated.titulo || updated.title)) {
                setItem(updated);
              } else {
                setItem((prev) => (prev ? { ...prev, status: 'lida', read: true } : prev));
              }
            }
          } catch {}
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [selectedId, selectedSummary]);

  const title = item?.titulo || item?.title || item?.assunto || 'Notificação';
  const createdAt = item?.created_at || item?.createdAt || item?.data_criacao || item?.data || null;
  const sender = item?.remetente || item?.sender || item?.remetente_nome || '';
  const message = item?.mensagem || item?.message || '';
  const safeHtml = React.useMemo(() => {
    const s = String(message || '');
    if (!s) return '';
    if (!/[<>]/.test(s)) return '';
    return sanitizeBasicRichHtml(s);
  }, [message]);

  if (!selectedId) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-sm text-slate-600 dark:text-slate-300">
        Selecione uma notificação para ler
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">{title}</div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
            <div>Data: {formatDate(createdAt)}</div>
            <div>Remetente: {sender || '—'}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            title="Recarregar"
            aria-label="Recarregar"
            className="p-0 h-10 w-10 justify-center"
            icon={<RefreshCw size={18} />}
            onClick={() => onRefresh && onRefresh()}
          />
          {!(item && item.from_me) && (
            <Button
              variant="secondary"
              size="sm"
              title="Marcar como lida"
              aria-label="Marcar como lida"
              className="p-0 h-10 w-10 justify-center"
              icon={<CheckCircle size={18} />}
              onClick={async () => {
                const id = String(selectedId);
                try {
                  const updated = await markNotificationRead(id);
                  if (updated && (updated.mensagem || updated.message || updated.titulo || updated.title)) {
                    setItem(updated);
                  } else {
                    setItem((prev) => (prev ? { ...prev, status: 'lida', read: true } : prev));
                  }
                  if (onRefresh) onRefresh();
                } catch {}
              }}
            />
          )}
          <Button
            variant="danger"
            size="sm"
            title="Arquivar"
            aria-label="Arquivar"
            className="p-0 h-10 w-10 justify-center"
            icon={<Archive size={18} />}
            onClick={async () => {
              const id = String(selectedId);
              try {
                await archiveNotification(id);
                if (onRefresh) onRefresh();
              } catch {}
            }}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="space-y-3">
            <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          </div>
        ) : (
          safeHtml ? (
            <div
              className="prose prose-slate dark:prose-invert max-w-none text-sm"
              dangerouslySetInnerHTML={{ __html: safeHtml }}
            />
          ) : (
            <div className="whitespace-pre-wrap text-sm text-slate-900 dark:text-slate-100">{message}</div>
          )
        )}
      </div>
    </div>
  );
}
