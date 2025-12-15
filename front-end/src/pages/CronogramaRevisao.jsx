import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import ActionToolbar from '../components/ActionToolbar';
// import Table from '../components/ui/Table'; // Custom table implementation used
import { ChevronUp, ChevronDown, Eye, FileText, ClipboardList, Upload, Trash, Plus, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

import { 
  getReviewPeriods,
  getUsers,
  getCronogramas,
  createCronograma,
  getCronogramaTarefas,
  createCronogramaTarefa,
  updateCronogramaTarefa,
  getCronogramaResumo,
  listCronogramaTarefaEvidencias,
  uploadCronogramaTarefaEvidencia,
  downloadCronogramaTarefaEvidencia,
  deleteCronogramaTarefaEvidencia,
} from '../apiClient';

function toDate(d) {
  if (!d) return null;
  try { return new Date(d); } catch { return null; }
}

export default function CronogramaRevisao() {
  const { t, i18n } = useTranslation();
  const location = useLocation();

  const getStatusLabel = (s) => {
    if (s === 'Pendente') return t('status_pending');
    if (s === 'Em Andamento') return t('status_in_progress');
    if (s === 'Concluída') return t('status_completed');
    if (s === 'Atrasada') return t('status_delayed');
    return s;
  };
  const [periodos, setPeriodos] = React.useState([]);
  const [users, setUsers] = React.useState([]);
  const [periodoId, setPeriodoId] = React.useState('');
  const [cronogramas, setCronogramas] = React.useState([]);
  const [cronogramaId, setCronogramaId] = React.useState('');
  const [tarefas, setTarefas] = React.useState([]);
  const [resumo, setResumo] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({ nome: '', tipo: 'Tarefa', responsavel_id: '', data_inicio: '', data_fim: '', status: 'Pendente', progresso_percentual: 0 });
  const [selectedTaskId, setSelectedTaskId] = React.useState(null);
  const [editingTaskId, setEditingTaskId] = React.useState(null);
  const [showNewModal, setShowNewModal] = React.useState(false);
  const [evidencias, setEvidencias] = React.useState([]);
  const [uploadFile, setUploadFile] = React.useState(null);
  const [viewTaskId, setViewTaskId] = React.useState(null);
  const [viewEvidencias, setViewEvidencias] = React.useState([]);
  const [selectedEvidencias, setSelectedEvidencias] = React.useState([]);
  const [canEdit, setCanEdit] = React.useState(false);


  React.useEffect(() => {
    try {
      const perms = JSON.parse(localStorage.getItem('assetlife_permissoes') || '{}');
      const rotas = perms.rotas || [];
      setCanEdit(rotas.includes('/reviews/cronogramas/edit'));
    } catch {
      setCanEdit(false);
    }
  }, []);

  const loadBase = React.useCallback(() => {
    setLoading(true);
    Promise.all([getReviewPeriods(), getUsers()])
      .then(([ps, us]) => {
        const abertos = (ps || []).filter((p) => p.status === 'Aberto');
        setPeriodos(abertos);
        setUsers(us || []);
      })
      .catch((err) => toast.error(err.message || t('error_generic')))
      .finally(() => setLoading(false));
  }, [t]);

  React.useEffect(() => { loadBase(); }, [loadBase]);

  const loadCronogramas = React.useCallback(() => {
    if (!periodoId) { setCronogramas([]); setCronogramaId(''); setTarefas([]); setResumo(null); return; }
    setLoading(true);
    getCronogramas({ periodo_id: Number(periodoId) })
      .then((list) => {
        setCronogramas(list || []);
        const first = (list || [])[0];
        if (first) {
          setCronogramaId(String(first.id));
        } else {
          setCronogramaId('');
        }
      })
      .catch((err) => toast.error(err.message || t('error_loading_cronogramas')))
      .finally(() => setLoading(false));
  }, [periodoId, t]);

  React.useEffect(() => { loadCronogramas(); }, [loadCronogramas]);

  const orderKey = React.useMemo(() => (cronogramaId ? `assetlife_cronograma_order_${cronogramaId}` : ''), [cronogramaId]);

  const applyOrder = React.useCallback((list) => {
    try {
      const raw = orderKey ? localStorage.getItem(orderKey) : null;
      const arr = raw ? JSON.parse(raw) : null;
      if (Array.isArray(arr) && arr.length > 0) {
        const pos = new Map(arr.map((id, idx) => [Number(id), idx]));
        const withPos = list.map((it) => ({ it, p: pos.has(Number(it.id)) ? pos.get(Number(it.id)) : Infinity }));
        withPos.sort((a, b) => (a.p - b.p) || (a.it.id - b.it.id));
        return withPos.map((x) => x.it);
      }
    } catch {}
    return list;
  }, [orderKey]);

  const loadTarefas = React.useCallback(() => {
    if (!cronogramaId) { setTarefas([]); setResumo(null); return; }
    setLoading(true);
    Promise.all([getCronogramaTarefas(Number(cronogramaId)), getCronogramaResumo(Number(cronogramaId))])
      .then(([ts, rs]) => { 
        setTarefas(applyOrder(ts || [])); 
        setResumo(rs || null); 
      })
      .catch((err) => {
        toast.error(err.message || t('error_loading_tasks'));
      })
      .finally(() => setLoading(false));
  }, [cronogramaId, applyOrder, t]);

  React.useEffect(() => { loadTarefas(); }, [loadTarefas]);

  const loadEvidencias = React.useCallback(async () => {
    if (!cronogramaId || !selectedTaskId) { setEvidencias([]); return; }
    try {
      const list = await listCronogramaTarefaEvidencias(Number(cronogramaId), Number(selectedTaskId));
      setEvidencias(Array.isArray(list) ? list : []);
    } catch {
      setEvidencias([]);
    }
  }, [cronogramaId, selectedTaskId]);

  React.useEffect(() => { loadEvidencias(); }, [loadEvidencias]);

  const handleViewEvidencias = async (taskId) => {
    setViewTaskId(taskId);
    setViewEvidencias([]); 
    setSelectedEvidencias([]);
    try {
      const list = await listCronogramaTarefaEvidencias(Number(cronogramaId), Number(taskId));
      setViewEvidencias(Array.isArray(list) ? list : []);
    } catch {
      toast.error(t('error_loading_evidences'));
    }
  };

  const onCreateCronograma = async () => {
    const p = periodos.find((x) => String(x.id) === String(periodoId));
    if (!p) return toast.error(t('select_open_period'));
    const payload = { periodo_id: p.id, empresa_id: p.empresa_id, responsavel_id: p.responsavel_id, descricao: p.descricao || '' };
    try {
      const c = await createCronograma(payload, { template: true });
      toast.success(t('cronogram_created'));
      setCronogramaId(String(c.id));
      await loadCronogramas();
      await loadTarefas();
    } catch (err) {
      toast.error(err.message || t('cronogram_create_error'));
    }
  };

  const [uploadTaskId, setUploadTaskId] = React.useState(null);
  const fileInputRef = React.useRef(null);

  const checkDurationLimit = (newStart, newEnd, excludeId = null) => {
    if (!newStart || !newEnd) return true;
    const ns = new Date(newStart).getTime();
    const ne = new Date(newEnd).getTime();
    let min = ns;
    let max = ne;
    tarefas.forEach(t => {
      if (t.id === excludeId) return;
      if (t.data_inicio) min = Math.min(min, new Date(t.data_inicio).getTime());
      if (t.data_fim) max = Math.max(max, new Date(t.data_fim).getTime());
    });
    const diff = (max - min) / (1000 * 60 * 60 * 24);
    return diff <= 92;
  };

  const handleTableUploadClick = (id) => {
    setUploadTaskId(id);
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleTableFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !uploadTaskId) return;
    try {
      await uploadCronogramaTarefaEvidencia(Number(cronogramaId), Number(uploadTaskId), file);
      toast.success(t('evidence_sent'));
      if (selectedTaskId === uploadTaskId) loadEvidencias();
    } catch (err) {
      toast.error(err.message || t('error_sending_evidence'));
    } finally {
      setUploadTaskId(null);
      e.target.value = '';
    }
  };

  const onAddTask = async () => {
    try {
      if (!cronogramaId) { toast.error(t('select_cronogram')); return; }
      if (!form.nome) { toast.error(t('name_required')); return; }
      if (!checkDurationLimit(form.data_inicio, form.data_fim)) {
        toast.error(t('cronogram_duration_limit'));
        return;
      }
      const payload = {
        cronograma_id: Number(cronogramaId),
        tipo: form.tipo || 'Tarefa',
        nome: form.nome,
        descricao: '',
        data_inicio: form.data_inicio || null,
        data_fim: form.data_fim || null,
        responsavel_id: form.responsavel_id ? Number(form.responsavel_id) : null,
        status: form.status || 'Pendente',
        progresso_percentual: Math.max(0, Math.min(100, Number(form.progresso_percentual || 0))),
      };
      const created = await createCronogramaTarefa(Number(cronogramaId), payload);
      if (form.file) {
        await uploadCronogramaTarefaEvidencia(Number(cronogramaId), created.id, form.file);
      }
      setForm({ nome: '', tipo: 'Tarefa', responsavel_id: '', data_inicio: '', data_fim: '', status: 'Pendente', progresso_percentual: 0, file: null });
      await loadTarefas();
      toast.success(t('task_added'));
      setShowNewModal(false);
    } catch (err) {
      toast.error(err.message || t('error_saving'));
    }
  };

  const onNew = () => {
    setEditingTaskId(null);
    setSelectedTaskId(null);
    setForm({ nome: '', tipo: 'Tarefa', responsavel_id: '', data_inicio: '', data_fim: '', status: 'Pendente', progresso_percentual: 0, file: null });
    setShowNewModal(true);
  };

  const onEditSelected = async () => {
    if (!selectedTaskId) { toast.error(t('error_generic')); return; }
    const task = tarefas.find((x) => x.id === selectedTaskId);
    if (!task) { toast.error(t('task_not_found')); return; }
    
    setViewEvidencias([]);
    
    setEditingTaskId(task.id);
    setForm({
      nome: task.nome || '',
      tipo: task.tipo || 'Tarefa',
      responsavel_id: task.responsavel_id ? String(task.responsavel_id) : '',
      data_inicio: task.data_inicio || '',
      data_fim: task.data_fim || '',
      status: task.status || 'Pendente',
      progresso_percentual: Number(task.progresso_percentual ?? 0),
      file: null
    });
    
    // Load evidences for edit modal
    try {
      const list = await listCronogramaTarefaEvidencias(Number(cronogramaId), Number(task.id));
      setViewEvidencias(Array.isArray(list) ? list : []);
    } catch {
      setViewEvidencias([]);
    }

    toast.success(t('editing_task'));
  };

  const handleEditFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !editingTaskId) return;
    try {
      await uploadCronogramaTarefaEvidencia(Number(cronogramaId), Number(editingTaskId), file);
      toast.success(t('evidence_sent'));
      const list = await listCronogramaTarefaEvidencias(Number(cronogramaId), Number(editingTaskId));
      setViewEvidencias(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error(err.message || t('error_sending_evidence'));
    } finally {
      e.target.value = '';
    }
  };

  const handleEditFileDelete = async (evidenceId) => {
    if (!window.confirm(t('confirm_delete'))) return;
    try {
      await deleteCronogramaTarefaEvidencia(Number(cronogramaId), Number(editingTaskId), Number(evidenceId));
      toast.success(t('evidences_deleted'));
      const list = await listCronogramaTarefaEvidencias(Number(cronogramaId), Number(editingTaskId));
      setViewEvidencias(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error(t('error_deleting_evidences'));
    }
  };

  const onSave = async () => {
    try {
      if (editingTaskId) {
        if (!checkDurationLimit(form.data_inicio, form.data_fim, editingTaskId)) {
            toast.error(t('cronogram_duration_limit'));
            return;
        }
        const payload = {
          tipo: form.tipo || undefined,
          nome: form.nome || undefined,
          responsavel_id: form.responsavel_id ? Number(form.responsavel_id) : null,
          data_inicio: form.data_inicio || undefined,
          data_fim: form.data_fim || undefined,
          status: form.status || undefined,
          progresso_percentual: Math.max(0, Math.min(100, Number(form.progresso_percentual ?? 0))),
        };
        const updated = await updateCronogramaTarefa(Number(cronogramaId), Number(editingTaskId), payload);
        toast.success(t('task_updated'));
        setEditingTaskId(null);
        setSelectedTaskId(updated?.id || null);
        await loadTarefas();
      } else {
        await onAddTask();
      }
    } catch (err) {
      toast.error(err?.message || t('error_saving'));
    }
  };

  const exportExcel = () => {
    const data = tarefas.map((task) => ({
      [t('task_name')]: task.nome || '',
      [t('task_responsible')]: users.find((u) => u.id === task.responsavel_id)?.nome_completo || '',
      [t('task_start')]: task.data_inicio ? formatDate(task.data_inicio) : '',
      [t('task_end')]: task.data_fim ? formatDate(task.data_fim) : '',
      [t('task_status')]: task.status || '',
      [`${t('task_progress')} (%)`]: task.progresso_percentual ?? 0
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cronograma');
    XLSX.writeFile(wb, `cronograma_${cronogramaId}.xlsx`);
    toast.success(t('export_excel_done'));
  };

  const exportPDF = () => {
    const win = window.open('', '', 'height=700,width=1000');
    
    // Build table header
    const tableHeader = `
    <thead>
        <tr>
            <th style="text-align: left; padding: 8px; border: 1px solid #cbd5e1;">${t('task_name')}</th>
            <th style="text-align: left; padding: 8px; border: 1px solid #cbd5e1;">${t('task_responsible')}</th>
            <th style="text-align: left; padding: 8px; border: 1px solid #cbd5e1;">${t('task_start')}</th>
            <th style="text-align: left; padding: 8px; border: 1px solid #cbd5e1;">${t('task_end')}</th>
            <th style="text-align: left; padding: 8px; border: 1px solid #cbd5e1;">${t('task_status')}</th>
            <th style="text-align: left; padding: 8px; border: 1px solid #cbd5e1;">${t('task_progress')} (%)</th>
        </tr>
    </thead>
    `;

    // Build table body
    const tableRows = tarefas.map((task) => {
        const isTitle = task.tipo === 'Título' || /^(\[TÍTULO\]|\(TÍTULO\))/i.test(task.nome);
        const bg = isTitle ? '#e2e8f0' : '#fff';
        const fw = isTitle ? 'bold' : 'normal';
        
        return `
        <tr style="background-color: ${bg}; font-weight: ${fw};">
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${task.nome || ''}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${users.find((u) => u.id === task.responsavel_id)?.nome_completo || ''}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${formatDate(task.data_inicio)}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${formatDate(task.data_fim)}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${task.status || ''}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${task.progresso_percentual ?? 0}%</td>
        </tr>
        `;
    }).join('');

    win.document.write(`<html>
      <head>
        <title>${t('cronogram_schedule_label')}</title>
        <style>
          @page { size: landscape; margin: 1cm; }
          body { font-family: Arial, sans-serif; -webkit-print-color-adjust: exact; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          h3 { margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <h3>${t('cronogram_tasks_title')}</h3>
        <table>
          ${tableHeader}
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
    </html>`);
    
    win.document.close();
    win.focus();
    // Delay print slightly to ensure render
    setTimeout(() => {
        win.print();
        win.close();
    }, 500);
    toast.success(t('export_pdf_done'));
  };

  const selectedIndex = React.useMemo(() => tarefas.findIndex((t) => t.id === selectedTaskId), [tarefas, selectedTaskId]);
  const canMoveUp = selectedIndex > 0;
  const canMoveDown = selectedIndex >= 0 && selectedIndex < tarefas.length - 1;

  const moveSelected = (dir) => {
    if (selectedIndex < 0) return;
    const swapIdx = dir === 'up' ? selectedIndex - 1 : selectedIndex + 1;
    if (swapIdx < 0 || swapIdx >= tarefas.length) return;
    const next = tarefas.slice();
    const tmp = next[selectedIndex];
    next[selectedIndex] = next[swapIdx];
    next[swapIdx] = tmp;
    setTarefas(next);
    try {
      const ids = next.map((t) => t.id);
      if (orderKey) localStorage.setItem(orderKey, JSON.stringify(ids));
    } catch {}
  };

  // --- New Gantt Logic ---
  const timeline = React.useMemo(() => {
    const ds = tarefas.map((t) => toDate(t.data_inicio)).filter(Boolean);
    const de = tarefas.map((t) => toDate(t.data_fim)).filter(Boolean);
    
    if (ds.length === 0) return { start: new Date(), days: 60 };
    
    // Find min date
    const min = new Date(Math.min(...ds.map((d) => d.getTime())));
    const max = de.length > 0 ? new Date(Math.max(...de.map((d) => d.getTime()))) : new Date(min.getTime() + (60 * 24 * 60 * 60 * 1000));
    
    // Normalize to UTC midnight to avoid timezone offsets affecting diffs
    const start = new Date(Date.UTC(min.getUTCFullYear(), min.getUTCMonth(), min.getUTCDate()));
    const end = new Date(Date.UTC(max.getUTCFullYear(), max.getUTCMonth(), max.getUTCDate()));
    
    // Calculate difference in days
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 5; // +5 buffer
    
    // Clamp between 60 and 92
    const days = Math.min(92, Math.max(60, diffDays));
    
    return { start, days };
  }, [tarefas]);

  const totalDays = timeline.days; 
  const dayWidth = 40; // Increased width for better visibility

  // Generate array of Date objects for the header
  const headerDates = React.useMemo(() => {
    const dates = [];
    if (!timeline.start) return dates;
    const s = new Date(timeline.start);
    for (let i = 0; i < totalDays; i++) {
        const d = new Date(s);
        d.setUTCDate(s.getUTCDate() + i);
        dates.push(d);
    }
    return dates;
  }, [timeline.start, totalDays]);

  const getStatusColor = (status, progress) => {
    // Concluída or 100% -> Green/Slate
    if (progress === 100 || status === 'Concluída') return 'bg-emerald-500 border-emerald-600';
    // Atrasada -> Red
    if (status === 'Atrasada') return 'bg-rose-500 border-rose-600';
    // Em Andamento -> Blue striped
    if (status === 'Em Andamento') return 'bg-blue-500 border-blue-600 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:10px_10px]';
    // Pendente -> Slate/Gray striped
    return 'bg-slate-400 border-slate-500 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:10px_10px]'; 
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    // Assume YYYY-MM-DD
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const handleDeleteEvidencias = async () => {
    if (!canEdit) return;
    if (selectedEvidencias.length === 0) return;
    if (!window.confirm(t('confirm_delete'))) return;
    try {
      await Promise.all(selectedEvidencias.map(id => deleteCronogramaTarefaEvidencia(Number(cronogramaId), Number(viewTaskId), Number(id))));
      toast.success(t('evidences_deleted'));
      setSelectedEvidencias([]);
      const list = await listCronogramaTarefaEvidencias(Number(cronogramaId), Number(viewTaskId));
      setViewEvidencias(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error(t('error_deleting_evidences'));
    }
  };

  return (
    <div className="p-6">

        <section>
          <style>{`
        @media print {
            @page { size: landscape; margin: 5mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print, header, nav, footer, .sidebar, button:not(.print-visible) { display: none !important; }
            section { margin: 0; padding: 0; width: 100%; max-width: none; }
            /* Expand the scrollable area for print */
            .overflow-auto { overflow: visible !important; height: auto !important; max-height: none !important; }
            /* Adjust font size for print to fit more */
            .text-xs, .text-sm { font-size: 10px !important; }
            /* Hide action column in print */
            .sticky.left-\[830px\] { display: none !important; } 
            /* Hide the column header for actions */
            .sticky.left-\[830px\] + div { display: none !important; }
        }
      `}</style>
      <div className="mb-4 px-4 flex items-center justify-between gap-2 flex-wrap no-print">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{t('cronogram_title')}</h2>
        <ActionToolbar
          onNew={canEdit ? onNew : undefined}
          onSave={canEdit ? onSave : undefined}
          onEdit={canEdit ? onEditSelected : undefined}
          onDelete={() => toast.error(t('delete_not_available'))}
          onPrint={() => window.print()}
          onExportPdf={exportPDF}
          onExportExcel={exportExcel}
          canEditDelete={!!selectedTaskId && canEdit}
        />
        <div className="flex items-center gap-2">
          <Button variant="secondary" title="Mover para cima" aria-label="Mover para cima" onClick={() => moveSelected('up')} disabled={!canMoveUp || !canEdit} className="p-1 h-8 w-8 sm:h-9 sm:w-9 justify-center"><ChevronUp size={18} /></Button>
          <Button variant="secondary" title="Mover para baixo" aria-label="Mover para baixo" onClick={() => moveSelected('down')} disabled={!canMoveDown || !canEdit} className="p-1 h-8 w-8 sm:h-9 sm:w-9 justify-center"><ChevronDown size={18} /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 mb-4 no-print">
        <Select label={t('period_label')} value={periodoId} onChange={(e) => setPeriodoId(e.target.value)}>
          <option value="">{t('select')}</option>
          {periodos.map((p) => (
            <option key={p.id} value={p.id}>{p.codigo} - {p.descricao}</option>
          ))}
        </Select>
        <Select label={t('cronogram_schedule_label')} value={cronogramaId} onChange={(e) => setCronogramaId(e.target.value)}>
          <option value="">{t('select')}</option>
          {cronogramas.map((c) => (
            <option key={c.id} value={c.id}>{c.descricao || `Cronograma ${c.id}`}</option>
          ))}
        </Select>
        <div className="flex items-end">
          <Button onClick={onCreateCronograma} disabled={!periodoId || cronogramas.length > 0 || !canEdit} title={cronogramas.length > 0 ? t('schedule_already_exists') : t('create_cronogram_btn')} className="p-1 h-8 w-8 sm:h-9 sm:w-9 justify-center">
            <Plus size={18} />
          </Button>
        </div>
      </div>

      {resumo && (
        <div className="px-4 mb-4 grid grid-cols-2 md:grid-cols-6 gap-2 no-print">
          <div className="p-3 rounded-lg border bg-white dark:bg-slate-900 shadow-sm">Total: {resumo.total_tarefas}</div>
          <div className="p-3 rounded-lg border bg-white dark:bg-slate-900 shadow-sm">Concluídas: {resumo.concluido}</div>
          <div className="p-3 rounded-lg border bg-white dark:bg-slate-900 shadow-sm">Em andamento: {resumo.em_andamento}</div>
          <div className="p-3 rounded-lg border bg-white dark:bg-slate-900 shadow-sm">Pendentes: {resumo.pendente}</div>
          <div className="p-3 rounded-lg border bg-white dark:bg-slate-900 shadow-sm">Atrasadas: {resumo.atrasada}</div>
          <div className="p-3 rounded-lg border bg-white dark:bg-slate-900 shadow-sm">Progresso: {resumo.progresso_percentual}%</div>
        </div>
      )}

      {/* Main Combined View */}
      <div className="mx-4 overflow-auto border rounded-lg h-[600px] relative bg-white dark:bg-slate-950 shadow-sm">
        {/* Header */}
        <div className="flex min-w-max border-b bg-slate-100 dark:bg-slate-900 sticky top-0 z-40 font-semibold text-xs text-slate-700 dark:text-slate-300 shadow-sm">
            <div className="sticky left-0 z-50 bg-slate-100 dark:bg-slate-900 w-[40px] p-2 border-r flex items-center justify-center">
              <Eye size={16} />
            </div>
            <div className="sticky left-[40px] z-50 bg-slate-100 dark:bg-slate-900 w-[300px] p-2 border-r flex items-center">{t('activity')}</div>
            <div className="sticky left-[340px] z-50 bg-slate-100 dark:bg-slate-900 w-[150px] p-2 border-r flex items-center">{t('task_responsible')}</div>
            <div className="sticky left-[490px] z-50 bg-slate-100 dark:bg-slate-900 w-[90px] p-2 border-r flex items-center">{t('task_start')}</div>
            <div className="sticky left-[580px] z-50 bg-slate-100 dark:bg-slate-900 w-[90px] p-2 border-r flex items-center">{t('task_end')}</div>
            <div className="sticky left-[670px] z-50 bg-slate-100 dark:bg-slate-900 w-[100px] p-2 border-r flex items-center">{t('task_status')}</div>
            <div className="sticky left-[770px] z-50 bg-slate-100 dark:bg-slate-900 w-[60px] p-2 border-r flex items-center text-center">{t('execution_col')}</div>
            <div className="sticky left-[830px] z-50 bg-slate-100 dark:bg-slate-900 w-[60px] p-2 border-r flex items-center text-center">{t('actions')}</div>
            
            {/* Gantt Header */}
            <div className="flex">
                {headerDates.map(d => (
                    <div key={d.toISOString()} className="flex-shrink-0 border-r text-center flex flex-col items-center justify-center text-[10px] text-slate-500" style={{ width: dayWidth }}>
                        <span className="font-bold">{d.getUTCDate()}</span>
                        <span className="text-[9px]">{d.toLocaleString(i18n.language, { month: 'short', timeZone: 'UTC' }).replace('.','')}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Body */}
        <div className="min-w-max">
            {tarefas.map((task, idx) => {
                const isTitle = task.tipo === 'Título' || /^(\[TÍTULO\]|\(TÍTULO\))/i.test(task.nome);
                const startDate = toDate(task.data_inicio);
                const endDate = toDate(task.data_fim);
                let startDiff = 0;
                let duration = 0;

                if (startDate && timeline.start) {
                    // Ensure startDate is treated as UTC midnight for comparison
                    const s = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
                    const diffTime = s.getTime() - timeline.start.getTime();
                    startDiff = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    
                    const end = endDate ? new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate())) : s;
                    const durTime = end.getTime() - s.getTime();
                    duration = Math.floor(durTime / (1000 * 60 * 60 * 24)) + 1;
                }

                const isSelected = task.id === selectedTaskId;
                const rowBg = isTitle ? 'bg-slate-200 dark:bg-slate-800' : isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-white dark:bg-slate-950';
                const stickyBg = isTitle ? 'bg-slate-200 dark:bg-slate-800' : isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-white dark:bg-slate-950 group-hover:bg-slate-50 dark:group-hover:bg-slate-900/50';

                return (
                    <div key={task.id} 
                         className={`flex border-b text-sm group hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer ${rowBg}`}
                         onClick={() => setSelectedTaskId(task.id)}>
                        
                        {/* Sticky Columns */}
                        <div className={`sticky left-0 z-30 w-[40px] p-2 border-r flex items-center justify-center ${stickyBg}`}>
                            <Button variant="ghost" size="sm" className="h-10 w-10 p-0" title={t('view_evidence_btn')} onClick={(e) => { e.stopPropagation(); handleViewEvidencias(task.id); }}>
                                <Eye className="w-6 h-6 text-blue-500" />
                            </Button>
                        </div>
                        <div className={`sticky left-[40px] z-30 w-[300px] p-2 border-r flex items-center gap-2 truncate ${stickyBg} ${isTitle ? 'font-bold uppercase text-slate-700 dark:text-slate-200' : ''}`}>
                             {!isTitle && <ClipboardList size={14} className="text-slate-400 flex-shrink-0" />}
                             <span title={task.nome}>{task.nome.replace(/^(\[TÍTULO\]|\(TÍTULO\))\s*/i, '')}</span>
                        </div>
                        <div className={`sticky left-[340px] z-30 w-[150px] p-2 border-r flex items-center truncate ${stickyBg}`}>
                             {users.find((u) => u.id === task.responsavel_id)?.nome_completo || ''}
                        </div>
                        <div className={`sticky left-[490px] z-30 w-[90px] p-2 border-r flex items-center text-xs ${stickyBg}`}>
                             {formatDate(task.data_inicio)}
                        </div>
                        <div className={`sticky left-[580px] z-30 w-[90px] p-2 border-r flex items-center text-xs ${stickyBg}`}>
                             {formatDate(task.data_fim)}
                        </div>
                        <div className={`sticky left-[670px] z-30 w-[100px] p-2 border-r flex items-center text-xs ${stickyBg}`}>
                             {task.status}
                        </div>
                        <div className={`sticky left-[770px] z-30 w-[60px] p-2 border-r flex items-center justify-center text-xs ${stickyBg}`}>
                             {task.progresso_percentual ?? 0}%
                        </div>
                        <div className={`sticky left-[830px] z-30 w-[60px] p-2 border-r flex items-center justify-center ${stickyBg}`}>
                           {/* Actions */}
                           {canEdit && (
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-6 w-6" title={t('edit_task_title')} onClick={(e) => { e.stopPropagation(); setSelectedTaskId(task.id); onEditSelected(); }}>
                                    <FileText size={14} />
                                </Button>
                            </div>
                           )}
                        </div>

                        {/* Gantt Bar */}
                        <div className="flex relative" style={{ height: '40px' }}>
                            {startDiff >= 0 && duration > 0 && (
                                <div className={`absolute top-2 h-6 rounded border shadow-sm ${getStatusColor(task.status, task.progresso_percentual)}`}
                                     style={{
                                         left: startDiff * dayWidth,
                                         width: duration * dayWidth,
                                         opacity: 0.9
                                     }}
                                     title={`${task.nome} (${formatDate(task.data_inicio)} - ${formatDate(task.data_fim)})`}
                                />
                            )}
                            {/* Grid lines */}
                            {headerDates.map(d => (
                                <div key={d.toISOString()} className="border-r h-full" style={{ width: dayWidth }} />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      {showNewModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl p-4">
            <div className="text-lg font-semibold mb-2">{t('new_record')}</div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
              <Select label={t('task_type')} value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}>
                {['Tarefa','Título'].map((s) => (<option key={s} value={s}>{s === 'Tarefa' ? t('type_task') : t('type_title')}</option>))}
              </Select>
              <Input label={t('task_name')} value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
              <Select label={t('task_responsible')} value={form.responsavel_id} onChange={(e) => setForm((f) => ({ ...f, responsavel_id: e.target.value }))}>
                <option value="">{t('select')}</option>
                {users.map((u) => (<option key={u.id} value={u.id}>{u.nome_completo}</option>))}
              </Select>
              <Input label={t('task_start')} type="date" value={form.data_inicio} onChange={(e) => setForm((f) => ({ ...f, data_inicio: e.target.value }))} />
              <Input label={t('task_end')} type="date" value={form.data_fim} onChange={(e) => setForm((f) => ({ ...f, data_fim: e.target.value }))} />
              <Select label={t('task_status')} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                {['Pendente','Em Andamento','Concluída','Atrasada'].map((s) => (<option key={s} value={s}>{getStatusLabel(s)}</option>))}
              </Select>
              <Input label={`${t('task_progress')} (%)`} type="number" min={0} max={100} value={form.progresso_percentual} onChange={(e) => setForm((f) => ({ ...f, progresso_percentual: e.target.value }))} />
              <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">{t('task_file')} ({t('optional')})</label>
                  <Input type="file" onChange={(e) => setForm((f) => ({ ...f, file: e.target.files[0] }))} />
              </div>
            </div>
            <div className="mt-3 flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setShowNewModal(false)}>{t('cancel')}</Button>
              <Button onClick={onAddTask} disabled={!periodoId || !cronogramaId}>{t('save')}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Editing Form (if needed outside modal, or just reuse modal? The original code had a separate editing form below the table in the TabPanel. I will put it in a Modal or below the table.) */}
      {editingTaskId && !showNewModal && (
         <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl p-4">
              <div className="text-lg font-semibold mb-2">{t('edit_task_title')}</div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-3">
                    <Select label={t('task_type')} value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}>
                    {['Tarefa','Título'].map((s) => (<option key={s} value={s}>{s === 'Tarefa' ? t('type_task') : t('type_title')}</option>))}
                    </Select>
                </div>
                <div className="md:col-span-9">
                    <Input label={t('task_name')} value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
                </div>
                
                <div className="md:col-span-4">
                    <Select label={t('task_responsible')} value={form.responsavel_id} onChange={(e) => setForm((f) => ({ ...f, responsavel_id: e.target.value }))}>
                    <option value="">{t('select')}</option>
                    {users.map((u) => (<option key={u.id} value={u.id}>{u.nome_completo}</option>))}
                    </Select>
                </div>
                <div className="md:col-span-2">
                    <Input label={t('task_start')} type="date" value={form.data_inicio} onChange={(e) => setForm((f) => ({ ...f, data_inicio: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                    <Input label={t('task_end')} type="date" value={form.data_fim} onChange={(e) => setForm((f) => ({ ...f, data_fim: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                    <Select label={t('task_status')} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                    {['Pendente','Em Andamento','Concluída','Atrasada'].map((s) => (<option key={s} value={s}>{getStatusLabel(s)}</option>))}
                    </Select>
                </div>
                <div className="md:col-span-2">
                    <Input label={`${t('task_progress')} (%)`} type="number" min={0} max={100} value={form.progresso_percentual} onChange={(e) => setForm((f) => ({ ...f, progresso_percentual: e.target.value }))} />
                </div>
              </div>
              
              <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-3">
                <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{t('attachments_title') || 'Anexos'}</div>
                    <label className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-slate-100 text-slate-900 hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-800/80 h-9 w-9 cursor-pointer" title={t('add_attachment') || 'Adicionar Anexo'}>
                        <Upload size={18} />
                        <input type="file" className="hidden" onChange={handleEditFileUpload} />
                    </label>
                </div>
                
                <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                    {viewEvidencias.map((ev) => (
                        <div key={ev.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-700 text-sm">
                            <div className="truncate flex-1 mr-2 text-slate-700 dark:text-slate-300">{ev.nome_arquivo}</div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title={t('download')} onClick={async () => {
                                      try {
                                        const blob = await downloadCronogramaTarefaEvidencia(Number(cronogramaId), Number(editingTaskId), Number(ev.id));
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = ev.nome_arquivo || 'arquivo';
                                        a.click();
                                        URL.revokeObjectURL(url);
                                      } catch (err) {
                                        toast.error(err?.message || t('download_failed'));
                                      }
                                }}>
                                    <Download size={16} />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600" title={t('delete')} onClick={() => handleEditFileDelete(ev.id)}>
                                    <Trash size={16} />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {viewEvidencias.length === 0 && <div className="text-slate-500 text-sm italic">{t('no_attachments') || 'Sem anexos.'}</div>}
                </div>
              </div>

              <div className="mt-3 flex gap-2 justify-end">
                <Button variant="secondary" onClick={() => { setEditingTaskId(null); }}>{t('cancel')}</Button>
                <Button onClick={onSave} disabled={!cronogramaId}>{t('save')}</Button>
              </div>
            </div>
         </div>
      )}

      {viewTaskId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl p-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div className="text-lg font-semibold">{t('evidences_title')}</div>
              <div className="flex items-center gap-2">
                 {canEdit && (
                   <Button variant="danger" size="sm" className="h-8 w-8 p-0 justify-center" title={t('delete_selected')} onClick={handleDeleteEvidencias} disabled={selectedEvidencias.length === 0}>
                      <Trash size={16} />
                   </Button>
                 )}
                 <Button variant="ghost" size="sm" onClick={() => setViewTaskId(null)}>✕</Button>
              </div>
            </div>
            
            {viewEvidencias.length === 0 ? (
              <div className="text-center py-8 text-slate-500">{t('no_evidences')}</div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {viewEvidencias.map((ev) => (
                  <div key={ev.id} className="p-3 rounded border flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={selectedEvidencias.includes(ev.id)}
                        onChange={(e) => {
                            if (e.target.checked) setSelectedEvidencias(prev => [...prev, ev.id]);
                            else setSelectedEvidencias(prev => prev.filter(id => id !== ev.id));
                        }}
                        className="rounded border-slate-300"
                      />
                      <div>
                        <div className="font-medium break-all">{ev.nome_arquivo}</div>
                        <div className="text-xs text-slate-500">{Math.round((ev.tamanho_bytes || 0) / 1024)} KB</div>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm" className="h-8 w-8 p-0 justify-center" title={t('download')} onClick={async () => {
                      try {
                        const blob = await downloadCronogramaTarefaEvidencia(Number(cronogramaId), Number(viewTaskId), Number(ev.id));
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = ev.nome_arquivo || 'arquivo';
                        a.click();
                        URL.revokeObjectURL(url);
                      } catch (err) {
                        toast.error(err?.message || t('download_failed'));
                      }
                    }}>
                      <Download size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleTableFileChange} />
        </section>

    </div>
  );
}
