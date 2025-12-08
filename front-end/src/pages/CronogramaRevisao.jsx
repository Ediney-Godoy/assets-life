import React from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import ActionToolbar from '../components/ActionToolbar';
import Table from '../components/ui/Table';
import { Tabs, TabPanel } from '../components/ui/Tabs';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { 
  getReviewPeriods,
  getUsers,
  getCronogramas,
  createCronograma,
  getCronogramaTarefas,
  createCronogramaTarefa,
  updateCronogramaTarefa,
  getCronogramaResumo,
} from '../apiClient';

function toDate(d) {
  if (!d) return null;
  try { return new Date(d); } catch { return null; }
}

export default function CronogramaRevisao() {
  const { t } = useTranslation();
  const [periodos, setPeriodos] = React.useState([]);
  const [users, setUsers] = React.useState([]);
  const [periodoId, setPeriodoId] = React.useState('');
  const [cronogramas, setCronogramas] = React.useState([]);
  const [cronogramaId, setCronogramaId] = React.useState('');
  const [tarefas, setTarefas] = React.useState([]);
  const [resumo, setResumo] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({ nome: '', responsavel_id: '', data_inicio: '', data_fim: '', status: 'Pendente' });
  const [selectedTaskId, setSelectedTaskId] = React.useState(null);
  const [editingTaskId, setEditingTaskId] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState('tarefas');

  const loadBase = React.useCallback(() => {
    setLoading(true);
    Promise.all([getReviewPeriods(), getUsers()])
      .then(([ps, us]) => {
        const abertos = (ps || []).filter((p) => p.status === 'Aberto');
        setPeriodos(abertos);
        setUsers(us || []);
      })
      .catch((err) => toast.error(err.message || 'Erro'))
      .finally(() => setLoading(false));
  }, []);

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
      .catch((err) => toast.error(err.message || 'Erro ao carregar cronogramas'))
      .finally(() => setLoading(false));
  }, [periodoId]);

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
      .then(([ts, rs]) => { setTarefas(applyOrder(ts || [])); setResumo(rs || null); })
      .catch((err) => toast.error(err.message || 'Erro ao carregar tarefas'))
      .finally(() => setLoading(false));
  }, [cronogramaId]);

  React.useEffect(() => { loadTarefas(); }, [loadTarefas]);

  const onCreateCronograma = async () => {
    const p = periodos.find((x) => String(x.id) === String(periodoId));
    if (!p) return toast.error('Selecione um período aberto');
    const payload = { periodo_id: p.id, empresa_id: p.empresa_id, responsavel_id: p.responsavel_id, descricao: p.descricao || '' };
    try {
      const c = await createCronograma(payload, { template: true });
      toast.success('Cronograma criado');
      setCronogramaId(String(c.id));
      await loadCronogramas();
      await loadTarefas();
    } catch (err) {
      toast.error(err.message || 'Erro ao criar cronograma');
    }
  };

  const onAddTask = async () => {
    if (!cronogramaId) return toast.error('Selecione um cronograma');
    if (!form.nome) return toast.error('Nome é obrigatório');
    try {
      const payload = {
        nome: form.nome,
        descricao: '',
        data_inicio: form.data_inicio || null,
        data_fim: form.data_fim || null,
        responsavel_id: form.responsavel_id ? Number(form.responsavel_id) : null,
        status: form.status || 'Pendente',
        progresso_percentual: 0,
      };
      await createCronogramaTarefa(Number(cronogramaId), payload);
      setForm({ nome: '', responsavel_id: '', data_inicio: '', data_fim: '', status: 'Pendente' });
      await loadTarefas();
      toast.success('Tarefa adicionada');
    } catch (err) {
      toast.error(err.message || 'Erro ao adicionar tarefa');
    }
  };

  const onNew = () => {
    setEditingTaskId(null);
    setSelectedTaskId(null);
    setForm({ nome: '', responsavel_id: '', data_inicio: '', data_fim: '', status: 'Pendente' });
    toast('Novo');
  };

  const onEditSelected = () => {
    if (!selectedTaskId) { toast.error('Selecione uma tarefa'); return; }
    const t = tarefas.find((x) => x.id === selectedTaskId);
    if (!t) { toast.error('Tarefa não encontrada'); return; }
    setEditingTaskId(t.id);
    setForm({
      nome: t.nome || '',
      responsavel_id: t.responsavel_id ? String(t.responsavel_id) : '',
      data_inicio: t.data_inicio || '',
      data_fim: t.data_fim || '',
      status: t.status || 'Pendente',
    });
    toast.success('Editando tarefa');
  };

  const onSave = async () => {
    try {
      if (editingTaskId) {
        const payload = {
          nome: form.nome || undefined,
          responsavel_id: form.responsavel_id ? Number(form.responsavel_id) : null,
          data_inicio: form.data_inicio || undefined,
          data_fim: form.data_fim || undefined,
          status: form.status || undefined,
        };
        const updated = await updateCronogramaTarefa(Number(cronogramaId), Number(editingTaskId), payload);
        toast.success('Tarefa atualizada');
        setEditingTaskId(null);
        setSelectedTaskId(updated?.id || null);
        await loadTarefas();
      } else {
        await onAddTask();
      }
    } catch (err) {
      toast.error(err?.message || 'Erro ao salvar');
    }
  };

  const exportCSV = () => {
    const rows = [
      ['Tarefa','Responsável','Início','Fim','Status','Progresso (%)'],
      ...tarefas.map((t) => [
        t.nome || '',
        users.find((u) => u.id === t.responsavel_id)?.nome_completo || '',
        t.data_inicio || '',
        t.data_fim || '',
        t.status || '',
        String(t.progresso_percentual ?? 0),
      ]),
    ];
    const csv = rows.map((r) => r.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cronograma_tarefas.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exportado CSV');
  };

  const exportPDF = () => {
    const win = window.open('', 'PRINT', 'height=700,width=900');
    const rows = tarefas.map((t) => `<div style="padding:8px;border:1px solid #ddd;border-radius:8px;margin-bottom:6px;">
      <div style="font-weight:bold">${t.nome || ''}</div>
      <div>Responsável: ${users.find((u) => u.id === t.responsavel_id)?.nome_completo || ''}</div>
      <div>Período: ${t.data_inicio || ''} → ${t.data_fim || ''}</div>
      <div>Status: ${t.status || ''} • Progresso: ${t.progresso_percentual ?? 0}%</div>
    </div>`).join('');
    win.document.write(`<html><head><title>Cronograma</title></head><body>
      <h3 style="font-family:Arial">Tarefas do Cronograma</h3>
      ${rows}
    </body></html>`);
    win.document.close();
    win.focus();
    win.print();
    win.close();
    toast.success('Exportado PDF (via impressão)');
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

  const columns = [
    { key: 'nome', header: 'Tarefa' },
    { key: 'responsavel_id', header: 'Responsável', render: (v) => (users.find((u) => u.id === v)?.nome_completo || '') },
    { key: 'data_inicio', header: 'Início', render: (v) => (v || '') },
    { key: 'data_fim', header: 'Fim', render: (v) => (v || '') },
    { key: 'status', header: 'Status' },
    { key: 'progresso_percentual', header: '%', render: (v) => `${v ?? 0}%` },
  ];

  const timeline = React.useMemo(() => {
    const ds = tarefas.map((t) => toDate(t.data_inicio)).filter(Boolean);
    const df = tarefas.map((t) => toDate(t.data_fim)).filter(Boolean);
    const min = ds.length ? new Date(Math.min(...ds.map((d) => d.getTime()))) : null;
    const max = df.length ? new Date(Math.max(...df.map((d) => d.getTime()))) : null;
    return { start: min, end: max };
  }, [tarefas]);

  const ganttItems = React.useMemo(() => {
    if (!timeline.start || !timeline.end) return [];
    const total = timeline.end.getTime() - timeline.start.getTime();
    return tarefas.map((t) => {
      const di = toDate(t.data_inicio) || timeline.start;
      const df = toDate(t.data_fim) || timeline.end;
      const left = ((di.getTime() - timeline.start.getTime()) / total) * 100;
      const width = ((df.getTime() - di.getTime()) / total) * 100;
      return { id: t.id, nome: t.nome, left: Math.max(0, left), width: Math.max(2, width), status: t.status };
    });
  }, [timeline, tarefas]);

  return (
    <section>
      <div className="mb-4 px-4 flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Cronogramas de Revisão</h2>
        <ActionToolbar
          onNew={onNew}
          onSave={onSave}
          onEdit={onEditSelected}
          onDelete={() => toast.error('Exclusão não disponível')}
          onPrint={() => window.print()}
          onExportPdf={exportPDF}
          onExportExcel={exportCSV}
          canEditDelete={!!selectedTaskId}
        />
        <div className="flex items-center gap-2">
          <Button variant="secondary" title="Mover para cima" aria-label="Mover para cima" onClick={() => moveSelected('up')} disabled={!canMoveUp} className="p-1 h-8 w-8 sm:h-9 sm:w-9 justify-center"><ChevronUp size={18} /></Button>
          <Button variant="secondary" title="Mover para baixo" aria-label="Mover para baixo" onClick={() => moveSelected('down')} disabled={!canMoveDown} className="p-1 h-8 w-8 sm:h-9 sm:w-9 justify-center"><ChevronDown size={18} /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4">
        <Select label="Período Aberto" value={periodoId} onChange={(e) => setPeriodoId(e.target.value)}>
          <option value="">Selecione</option>
          {periodos.map((p) => (
            <option key={p.id} value={p.id}>{p.codigo} - {p.descricao}</option>
          ))}
        </Select>
        <Select label="Cronograma" value={cronogramaId} onChange={(e) => setCronogramaId(e.target.value)}>
          <option value="">Selecione</option>
          {cronogramas.map((c) => (
            <option key={c.id} value={c.id}>{c.descricao || `Cronograma ${c.id}`}</option>
          ))}
        </Select>
        <div className="flex items-end">
          <Button onClick={onCreateCronograma} disabled={!periodoId}>Criar Cronograma</Button>
        </div>
      </div>

      {resumo && (
        <div className="px-4 mt-4 grid grid-cols-2 md:grid-cols-6 gap-2">
          <div className="p-3 rounded-lg border">Total: {resumo.total_tarefas}</div>
          <div className="p-3 rounded-lg border">Concluídas: {resumo.concluido}</div>
          <div className="p-3 rounded-lg border">Em andamento: {resumo.em_andamento}</div>
          <div className="p-3 rounded-lg border">Pendentes: {resumo.pendente}</div>
          <div className="p-3 rounded-lg border">Atrasadas: {resumo.atrasada}</div>
          <div className="p-3 rounded-lg border">Progresso: {resumo.progresso_percentual}%</div>
        </div>
      )}
      <div className="px-4 mt-4">
        <Tabs value={activeTab} onChange={setActiveTab} items={[{ value: 'tarefas', label: 'Tarefas' }, { value: 'gantt', label: 'Gantt' }]} />

        <TabPanel active={activeTab === 'tarefas'}>
          <div className="mt-2">
            <Table
              columns={columns}
              data={tarefas}
              loading={loading}
              onRowClick={(row) => setSelectedTaskId(row.id)}
              getRowClassName={(row) => (row.id === selectedTaskId ? 'bg-blue-50 dark:bg-blue-900/30' : undefined)}
            />
          </div>

          <div className="mt-6">
            <div className="text-lg font-semibold mb-2">{editingTaskId ? 'Editar Tarefa' : 'Nova Tarefa'}</div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <Input label="Nome" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
              <Select label="Responsável" value={form.responsavel_id} onChange={(e) => setForm((f) => ({ ...f, responsavel_id: e.target.value }))}>
                <option value="">Selecione</option>
                {users.map((u) => (<option key={u.id} value={u.id}>{u.nome_completo}</option>))}
              </Select>
              <Input label="Início" type="date" value={form.data_inicio} onChange={(e) => setForm((f) => ({ ...f, data_inicio: e.target.value }))} />
              <Input label="Fim" type="date" value={form.data_fim} onChange={(e) => setForm((f) => ({ ...f, data_fim: e.target.value }))} />
              <Select label="Status" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                {['Pendente','Em Andamento','Concluída','Atrasada'].map((s) => (<option key={s} value={s}>{s}</option>))}
              </Select>
            </div>
            <div className="mt-3 flex gap-2">
              <Button onClick={onSave} disabled={!cronogramaId}>{editingTaskId ? 'Salvar' : 'Adicionar'}</Button>
              <Button variant="secondary" onClick={onNew}>Limpar</Button>
            </div>
          </div>
        </TabPanel>

        <TabPanel active={activeTab === 'gantt'}>
          <div className="mt-2">
            <div className="text-lg font-semibold mb-2">Gantt</div>
            <div className="relative w-full h-48 rounded-lg border overflow-hidden">
              <div className="absolute inset-0">
                {ganttItems.map((g) => (
                  <div key={g.id} title={g.nome}
                       className={"absolute h-6 rounded-full " + (g.status === 'Concluída' ? 'bg-emerald-500' : g.status === 'Em Andamento' ? 'bg-blue-500' : g.status === 'Atrasada' ? 'bg-red-500' : 'bg-slate-400')}
                       style={{ left: `${g.left}%`, width: `${g.width}%`, top: `${(g.id % 10) * 14}px` }} />
                ))}
              </div>
            </div>
          </div>
        </TabPanel>
      </div>
    </section>
  );
}
