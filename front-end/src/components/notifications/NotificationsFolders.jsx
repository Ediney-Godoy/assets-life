import React from 'react';
import { Inbox, Send, CheckCircle2, Archive, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const DEFAULT_FOLDERS = [
  { id: 'pendente', label: 'Caixa de entrada', icon: Inbox },
  { id: 'recebidas', label: 'Todas', icon: Mail },
  { id: 'lida', label: 'Lidas', icon: CheckCircle2 },
  { id: 'arquivada', label: 'Arquivadas', icon: Archive },
  { id: 'enviadas', label: 'Enviadas', icon: Send },
];

export default function NotificationsFolders({
  activeId,
  onSelect,
  folders,
  disabledIds,
}) {
  const { t } = useTranslation();
  const tt = (k, fb) => { const v = t(k); return v === k ? fb : v; };
  const list = Array.isArray(folders) && folders.length > 0 ? folders : DEFAULT_FOLDERS;
  const disabled = new Set(Array.isArray(disabledIds) ? disabledIds : []);
  const defaultLabels = React.useMemo(() => ({
    pendente: tt('notifications_folder_inbox', 'Caixa de entrada'),
    recebidas: tt('notifications_folder_all', 'Todas'),
    lida: tt('notifications_folder_read', 'Lidas'),
    arquivada: tt('notifications_folder_archived', 'Arquivadas'),
    enviadas: tt('notifications_folder_sent', 'Enviadas'),
  }), [t]);
  const items = React.useMemo(() => {
    if (Array.isArray(folders) && folders.length > 0) return folders;
    return DEFAULT_FOLDERS.map((f) => ({ ...f, label: defaultLabels[String(f.id)] || f.label }));
  }, [folders, defaultLabels]);

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800">
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{tt('notifications_folders', 'Pastas')}</div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <div className="flex flex-col gap-1">
          {items.map((f) => {
            const isActive = String(activeId) === String(f.id);
            const Icon = f.icon || Inbox;
            const isDisabled = disabled.has(String(f.id));
            return (
              <button
                key={f.id}
                type="button"
                disabled={isDisabled}
                onClick={() => onSelect && onSelect(String(f.id))}
                className={
                  `w-full text-left rounded-lg px-3 py-2 flex items-center gap-2 transition ` +
                  (isDisabled
                    ? 'opacity-50 cursor-not-allowed '
                    : 'hover:bg-slate-100 dark:hover:bg-slate-900 ') +
                  (isActive
                    ? 'bg-slate-100 dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 '
                    : '')
                }
              >
                <div className={
                  `h-8 w-8 rounded-md flex items-center justify-center ` +
                  (isActive
                    ? 'bg-blue-600 text-white '
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200')
                }>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{f.label}</div>
                </div>
                {typeof f.count === 'number' ? (
                  <div className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200">{f.count}</div>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
