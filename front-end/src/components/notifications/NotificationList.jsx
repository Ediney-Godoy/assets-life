import React from 'react';
import { useTranslation } from 'react-i18next';
import { stripHtmlToText } from '../../utils/htmlText';

function formatDate(value) {
  try {
    if (!value) return '';
    return new Date(value).toLocaleString('pt-BR');
  } catch {
    return '';
  }
}

function statusLabel(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'pendente') return 'notifications_status_pending';
  if (s === 'lida') return 'notifications_status_read';
  if (s === 'arquivada') return 'notifications_status_archived';
  if (s === 'enviada' || s === 'enviadas') return 'notifications_status_sent';
  return '';
}

export default function NotificationList({ items, selectedId, onSelect, emptyLabel }) {
  const { t } = useTranslation();
  const tt = (k, fb) => { const v = t(k); return v === k ? fb : v; };
  const list = Array.isArray(items) ? items : [];
  if (list.length === 0) {
    return (
      <div className="p-4 text-sm text-slate-600 dark:text-slate-300">{emptyLabel || tt('no_notifications', 'Sem notificações')}</div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {list.map((n) => {
          const id = String(n.id);
          const isSelected = String(selectedId) === id;
          const title = n.titulo || n.title || n.assunto || 'Notificação';
          const preview = stripHtmlToText(n.mensagem || n.message || '');
          const sender = n.remetente || n.sender || n.remetente_nome || '';
          const createdAt = n.created_at || n.createdAt || n.data_criacao || n.data || null;
          const stKey = statusLabel(n.status || '');
          const stLabel = stKey
            ? tt(stKey, String(n.status || ''))
            : (String(n.status || '').trim() ? String(n.status) : tt('notifications_status_unknown', '-'));

          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect && onSelect(id)}
              className={
                `w-full text-left px-3 py-3 transition relative ` +
                (isSelected
                  ? 'bg-blue-50 dark:bg-slate-900 '
                  : 'hover:bg-slate-50 dark:hover:bg-slate-900/60 ')
              }
            >
              <div className={
                `absolute left-0 top-0 bottom-0 w-1 ` +
                (isSelected ? 'bg-blue-600' : 'bg-transparent')
              } />
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{title}</div>
                  <div className="mt-0.5 text-xs text-slate-600 dark:text-slate-300 truncate">{sender || '—'}</div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="text-xs text-slate-600 dark:text-slate-300">{formatDate(createdAt)}</div>
                  <div className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200">{stLabel}</div>
                </div>
              </div>
              {preview ? (
                <div className="mt-2 text-sm text-slate-700 dark:text-slate-200 truncate">{preview}</div>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
