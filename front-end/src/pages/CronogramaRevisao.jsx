import React from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
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

  const loadTarefas = React.useCallback(() => {
    if (!cronogramaId) { setTarefas([]); setResumo(null); return; }
    setLoading(true);
    Promise.all([getCronogramaTarefas(Number(cronogramaId)), getCronogramaResumo(Number(cronogramaId))])
      .then(([ts, rs]) => { setTarefas(ts || []); setResumo(rs || null); })
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
      <div className="mb-4 px-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Cronogramas de Revisão</h2>
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
        <Table columns={columns} data={tarefas} loading={loading} />
      </div>

      <div className="px-4 mt-4">
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

      <div className="px-4 mt-6">
        <div className="text-lg font-semibold mb-2">Nova Tarefa</div>
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
        <div className="mt-3">
          <Button onClick={onAddTask} disabled={!cronogramaId}>Adicionar</Button>
        </div>
      </div>
    </section>
  );
}
