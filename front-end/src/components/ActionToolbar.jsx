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
        'bg-neutral-100 dark:bg-neutral-800',
        'rounded-lg border border-neutral-200 dark:border-neutral-700',
        className
      )}
    >
      {actions.map((action, index) => {
        if (action.type === 'divider') {
          return (
            <div
              key={index}
              className="w-px h-6 bg-neutral-300 dark:bg-neutral-600 mx-1"
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
                'bg-brand-500 text-white',
                'hover:bg-brand-600',
                'focus:ring-brand-500',
              ],
              isDanger && !isDisabled && [
                'text-danger-600 dark:text-danger-500',
                'hover:bg-danger-50 dark:hover:bg-danger-500/10',
                'focus:ring-danger-500',
              ],
              !isPrimary && !isDanger && !isDisabled && [
                'text-neutral-600 dark:text-neutral-400',
                'hover:bg-white dark:hover:bg-neutral-700',
                'hover:text-neutral-900 dark:hover:text-neutral-100',
                'focus:ring-neutral-500',
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
