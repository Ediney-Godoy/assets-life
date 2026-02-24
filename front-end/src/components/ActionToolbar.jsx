import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Save, Pencil, Printer, Trash2 } from 'lucide-react';
import Button from './ui/Button';

export default function ActionToolbar({
  onNew,
  onSave,
  onEdit,
  onDelete,
  onPrint,
  onExportPdf,
  onExportExcel,
  canEditDelete = false,
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="secondary" title={t('new') || 'Novo'} aria-label={t('new') || 'Novo'} onClick={onNew} className="p-1 h-8 w-8 sm:h-9 sm:w-9 justify-center"><Plus size={18} /></Button>
      <Button variant="secondary" title={t('save') || 'Salvar'} aria-label={t('save') || 'Salvar'} onClick={onSave} className="p-1 h-8 w-8 sm:h-9 sm:w-9 justify-center"><Save size={18} className="text-slate-700" /></Button>
      <Button variant="secondary" title={t('edit') || 'Editar'} aria-label={t('edit') || 'Editar'} disabled={!canEditDelete} onClick={onEdit} className="p-1 h-8 w-8 sm:h-9 sm:w-9 justify-center"><Pencil size={18} /></Button>
      <Button variant="secondary" title={t('delete') || 'Excluir'} aria-label={t('delete') || 'Excluir'} disabled={!canEditDelete} onClick={onDelete} className="p-1 h-8 w-8 sm:h-9 sm:w-9 justify-center"><Trash2 size={18} /></Button>
      <Button variant="secondary" title={t('print') || 'Imprimir'} aria-label={t('print') || 'Imprimir'} onClick={onPrint} className="p-1 h-8 w-8 sm:h-9 sm:w-9 justify-center"><Printer size={18} /></Button>
      <Button variant="secondary" title={t('export_pdf') || 'Exportar PDF'} aria-label={t('export_pdf') || 'Exportar PDF'} onClick={onExportPdf} className="p-1 h-8 w-8 sm:h-9 sm:w-9 justify-center"><img src="/Pdf.svg" alt="PDF" className="h-5 w-5" /></Button>
      <Button variant="secondary" title={t('export_excel') || 'Exportar Excel'} aria-label={t('export_excel') || 'Exportar Excel'} onClick={onExportExcel} className="p-1 h-8 w-8 sm:h-9 sm:w-9 justify-center"><img src="/Excel.svg" alt="Excel" className="h-5 w-5" /></Button>
    </div>
  );
}
