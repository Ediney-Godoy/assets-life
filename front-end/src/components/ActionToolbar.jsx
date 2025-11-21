import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Save, Pencil, Trash2, Printer, FileText, FileSpreadsheet } from 'lucide-react';
import clsx from 'clsx';

export default function ActionToolbar({
  onNew,
  onSave,
  onEdit,
  onDelete,
  onPrint,
  onExportPdf,
  onExportExcel,
  canEditDelete = false,
  className,
}) {
  const { t } = useTranslation();

  const actions = [
    {
      icon: Plus,
      label: t('new') || 'Novo',
      onClick: onNew,
      variant: 'primary',
    },
    {
      icon: Save,
      label: t('save') || 'Salvar',
      onClick: onSave,
      variant: 'default',
    },
    {
      icon: Pencil,
      label: t('edit') || 'Editar',
      onClick: onEdit,
      disabled: !canEditDelete,
      variant: 'default',
    },
    {
      icon: Trash2,
      label: t('delete') || 'Excluir',
      onClick: onDelete,
      disabled: !canEditDelete,
      variant: 'danger',
    },
    { type: 'divider' },
    {
      icon: Printer,
      label: t('print') || 'Imprimir',
      onClick: onPrint,
      variant: 'default',
    },
    {
      icon: FileText,
      label: t('export_pdf') || 'PDF',
      onClick: onExportPdf,
      variant: 'default',
    },
    {
      icon: FileSpreadsheet,
      label: t('export_excel') || 'Excel',
      onClick: onExportExcel,
      variant: 'default',
    },
  ];

  return (
    <div
      className={clsx(
        'inline-flex items-center gap-1 p-1.5',
        'bg-slate-100 dark:bg-slate-800',
        'rounded-lg border border-slate-200 dark:border-slate-700',
        className
      )}
    >
      {actions.map((action, index) => {
        if (action.type === 'divider') {
          return (
            <div
              key={index}
              className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"
            />
          );
        }

        const Icon = action.icon;
        const isDisabled = action.disabled;
        const isPrimary = action.variant === 'primary';
        const isDanger = action.variant === 'danger';

        return (
          <button
            key={index}
            type="button"
            onClick={action.onClick}
            disabled={isDisabled}
            title={action.label}
            aria-label={action.label}
            className={clsx(
              'flex items-center justify-center',
              'h-8 w-8 sm:h-9 sm:w-9',
              'rounded-md',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-1',
              isDisabled && 'opacity-40 cursor-not-allowed',
              isPrimary && !isDisabled && [
                'bg-blue-500 text-white',
                'hover:bg-blue-600',
                'focus:ring-blue-500',
              ],
              isDanger && !isDisabled && [
                'text-red-600 dark:text-red-500',
                'hover:bg-red-50 dark:hover:bg-red-500/10',
                'focus:ring-red-500',
              ],
              !isPrimary && !isDanger && !isDisabled && [
                'text-slate-600 dark:text-slate-400',
                'hover:bg-white dark:hover:bg-slate-700',
                'hover:text-slate-900 dark:hover:text-slate-100',
                'focus:ring-slate-500',
              ]
            )}
          >
            <Icon size={16} />
          </button>
        );
      })}
    </div>
  );
}
