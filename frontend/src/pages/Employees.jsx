import React from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Pencil, Trash2, Plus, Save, FileDown, FileText, Printer } from 'lucide-react';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, getCompanies } from '../apiClient';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';

function formatCpf(value) {
  const digits = (value || '').replace(/\D/g, '').slice(0, 11);
  const parts = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9), digits.slice(9, 11)].filter(Boolean);
  return parts.length === 4 ? `${parts[0]}.${parts[1]}.${parts[2]}-${parts[3]}` : parts.join('.');
}
function cleanCpf(value) { return (value || '').replace(/\D/g, ''); }
function formatPhone(value) {
  const d = (value || '').replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
}

export default function EmployeesPage() {
  const { t } = useTranslation();
  const [companies, setCompanies] = React.useState([]);
  const [employees, setEmployees] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [query, setQuery] = React.useState('');
  const [editingId, setEditingId] = React.useState(null);
  const [errors, setErrors] = React.useState({});

  const [form, setForm] = React.useState({
    full_name: '',
    cpf: '',
    matricula: '',
    cargo_funcao: '',
    empresa_id: '',
    ug_id: '',
    centro_custo_id: '',
    tipo_vinculo: 'proprio',
    data_admissao: '',
    data_desligamento: '',
    telefone: '',
    email_corporativo: '',
    endereco: '',
    cidade: '',
    estado: '',
    status: 'ativo',
    observacoes: '',
  });

  const load = React.useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([getCompanies(), getEmployees()])
      .then(([companiesData, employeesData]) => {
        setCompanies(companiesData || []);
        setEmployees(employeesData || []);
      })
      .catch((err) => setError(err.message || 'Erro'))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      full_name: '', cpf: '', matricula: '', cargo_funcao: '', empresa_id: '', ug_id: '', centro_custo_id: '',
      tipo_vinculo: 'proprio', data_admissao: '', data_desligamento: '', telefone: '', email_corporativo: '',
      endereco: '', cidade: '', estado: '', status: 'ativo', observacoes: '',
    });
    setErrors({});
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const next = {};
    if (!form.full_name) next.full_name = t('field_required') || 'Obrigatório';
    const clean = cleanCpf(form.cpf);
    if (!clean) next.cpf = t('field_required') || 'Obrigatório';
    else if (clean.length !== 11) next.cpf = t('invalid_cpf') || 'CPF inválido';
    if (!form.empresa_id) next.empresa_id = t('field_required') || 'Obrigatório';
    if (!form.data_admissao) next.data_admissao = t('field_required') || 'Obrigatório';
    if (form.email_corporativo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email_corporativo)) next.email_corporativo = t('invalid_email') || 'Email inválido';
    return next;
  };

  const onSave = async () => {
    try {
      const v = validate();
      setErrors(v);
      if (Object.keys(v).length) { toast.error(t('required_fields') || 'Preencha os campos obrigatórios'); return; }
      const payload = {
        ...form,
        cpf: cleanCpf(form.cpf),
        empresa_id: form.empresa_id ? Number(form.empresa_id) : null,
        ug_id: form.ug_id ? Number(form.ug_id) : null,
        centro_custo_id: form.centro_custo_id ? Number(form.centro_custo_id) : null,
        data_desligamento: form.data_desligamento ? form.data_desligamento : null,
      };
      if (editingId) {
        await updateEmployee(editingId, payload);
        toast.success(t('updated_successfully') || 'Atualizado com sucesso');
      } else {
        await createEmployee(payload);
        toast.success(t('created_successfully') || 'Criado com sucesso');
      }
      resetForm();
      load();
    } catch (err) {
      toast.error(err.message || t('backend_error') || 'Erro no backend');
    }
  };

  const onNew = () => { resetForm(); toast(t('new_record') || 'Novo cadastro'); };

  const onEdit = (c) => {
    setEditingId(c.id);
    setForm({
      full_name: c.full_name || '',
      cpf: formatCpf(c.cpf || ''),
      matricula: c.matricula || '',
      cargo_funcao: c.cargo_funcao || '',
      empresa_id: c.empresa_id?.toString() || '',
      ug_id: c.ug_id?.toString() || '',
      centro_custo_id: c.centro_custo_id?.toString() || '',
      tipo_vinculo: c.tipo_vinculo || 'proprio',
      data_admissao: c.data_admissao || '',
      data_desligamento: c.data_desligamento || '',
      telefone: formatPhone(c.telefone || ''),
      email_corporativo: c.email_corporativo || '',
      endereco: c.endereco || '',
      cidade: c.cidade || '',
      estado: c.estado || '',
      status: c.status || 'ativo',
      observacoes: c.observacoes || '',
    });
    setErrors({});
  };

  const onDelete = async (id) => {
    try {
      await deleteEmployee(id);
      toast.success(t('deleted_successfully') || 'Excluído com sucesso');
      if (editingId === id) resetForm();
      load();
    } catch (err) {
      toast.error(err.message || t('backend_error') || 'Erro no backend');
    }
  };

  const filtered = employees.filter((c) => (
    (c.full_name && c.full_name.toLowerCase().includes(query.toLowerCase())) ||
    (c.matricula && c.matricula.toLowerCase().includes(query.toLowerCase())) ||
    (c.cpf && c.cpf.replace(/\D/g, '').includes(query.replace(/\D/g, '')))
  ));

  const exportExcel = () => {
    const rows = [
      ['Nome', 'Matrícula', 'CPF', 'Empresa', 'UG', 'Cargo/Função', 'Status'],
      ...filtered.map((e) => [
        e.full_name || '', e.matricula || '', e.cpf || '',
        companies.find((co) => co.id === e.empresa_id)?.name || '',
        e.ug_id || '', e.cargo_funcao || '', e.status === 'ativo' ? 'Ativo' : 'Inativo',
      ]),
    ];
    const csv = rows.map((r) => r.map((x) => `"${(x || '').toString().replace(/"/g, '"')}"`).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'colaboradores.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exportado para CSV');
  };

  const exportPDF = () => {
    const html = `<!doctype html><html><head><meta charset=\"utf-8\" />
      <title>Colaboradores</title>
      <style>
        body{font-family:sans-serif;padding:24px;color:#111}
        h1{font-size:20px;margin-bottom:12px}
        table{width:100%;border-collapse:collapse}
        th,td{border:1px solid #e2e8f0;padding:8px;text-align:left;font-size:12px}
        th{background:#f8fafc}
      </style></head><body>
      <h1>Lista de Colaboradores</h1>
      <table><thead><tr>
        <th>Nome</th><th>Matrícula</th><th>CPF</th><th>Empresa</th><th>UG</th><th>Cargo/Função</th><th>Status</th>
      </tr></thead><tbody>
      ${filtered.map((e) => `<tr>
        <td>${e.full_name || ''}</td>
        <td>${e.matricula || ''}</td>
        <td>${e.cpf || ''}</td>
        <td>${companies.find((co) => co.id === e.empresa_id)?.name || ''}</td>
        <td>${e.ug_id || ''}</td>
        <td>${e.cargo_funcao || ''}</td>
        <td>${e.status === 'ativo' ? 'Ativo' : 'Inativo'}</td>
      </tr>`).join('')}
      </tbody></table></body></html>`;
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      w.focus();
      w.print();
    }
  };

  // Define printList to prevent runtime error and blank screen
  const printList = () => {
    exportPDF();
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{t('collab_title') || 'Colaboradores'}</h2>
        <div className="flex items-center gap-2">
          <Button variant="secondary" title={t('new')} aria-label={t('new')} onClick={onNew} className="px-2 py-2"><Plus size={18} /></Button>
          <Button variant="primary" title={t('save')} aria-label={t('save')} onClick={onSave} className="px-2 py-2"><Save size={18} /></Button>
          <Button variant="secondary" title={t('edit')} aria-label={t('edit')} disabled={!editingId} onClick={() => editingId && onEdit(employees.find((x) => x.id === editingId))} className="px-2 py-2"><Pencil size={18} /></Button>
          <Button variant="danger" title={t('delete')} aria-label={t('delete')} disabled={!editingId} onClick={() => editingId && onDelete(editingId)} className="px-2 py-2"><Trash2 size={18} /></Button>
          <Button variant="secondary" title={t('print')} aria-label={t('print')} onClick={printList} className="px-2 py-2"><Printer size={18} /></Button>
          <Button variant="secondary" title={t('export_excel')} aria-label={t('export_excel')} onClick={exportExcel} className="px-2 py-2"><FileDown size={18} /></Button>
          <Button variant="secondary" title={t('export_pdf')} aria-label={t('export_pdf')} onClick={exportPDF} className="px-2 py-2"><FileText size={18} /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="Nome completo" name="full_name" value={form.full_name} onChange={onChange} error={errors.full_name} />
            <Input label="CPF" name="cpf" value={formatCpf(form.cpf)} onChange={(e) => onChange({ target: { name: 'cpf', value: e.target.value } })} error={errors.cpf} />
            <Input label="Matrícula" name="matricula" value={form.matricula} onChange={onChange} />
            <Input label="Cargo/Função" name="cargo_funcao" value={form.cargo_funcao} onChange={onChange} />
            <Select label="Empresa" name="empresa_id" value={form.empresa_id} onChange={onChange} error={errors.empresa_id}>
              <option value="">Selecione</option>
              {companies.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </Select>
            <Select label="Unidade Gerencial (UG)" name="ug_id" value={form.ug_id} onChange={onChange}>
              <option value="">(opcional)</option>
            </Select>
            <Select label="Centro de Custos" name="centro_custo_id" value={form.centro_custo_id} onChange={onChange}>
              <option value="">(opcional)</option>
            </Select>
            <Select label="Tipo de vínculo" name="tipo_vinculo" value={form.tipo_vinculo} onChange={onChange}>
              <option value="proprio">Próprio</option>
              <option value="terceiro">Terceiro</option>
              <option value="temporario">Temporário</option>
            </Select>
            <Input type="date" label="Data de Admissão" name="data_admissao" value={form.data_admissao} onChange={onChange} error={errors.data_admissao} />
            <Input type="date" label="Data de Desligamento" name="data_desligamento" value={form.data_desligamento} onChange={onChange} />
            <Input label="Telefone" name="telefone" value={formatPhone(form.telefone)} onChange={(e) => onChange({ target: { name: 'telefone', value: e.target.value } })} />
            <Input label="E-mail Corporativo" name="email_corporativo" value={form.email_corporativo} onChange={onChange} error={errors.email_corporativo} />
            <Input label="Endereço" name="endereco" value={form.endereco} onChange={onChange} />
            <Input label="Cidade" name="cidade" value={form.cidade} onChange={onChange} />
            <Input label="Estado" name="estado" value={form.estado} onChange={onChange} />
            <Select label="Status" name="status" value={form.status} onChange={onChange}>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </Select>
            <div className="md:col-span-2">
              <Input label="Observações" name="observacoes" value={form.observacoes} onChange={onChange} multiline />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <input className="px-3 py-2 rounded-md border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 flex-1" placeholder="Pesquisar colaborador" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>

          {loading && <p className="text-slate-500">{t('backend_checking') || 'Carregando...'}</p>}
          {error && <p className="text-red-600">{t('backend_error') || 'Erro no backend'}</p>}
          {!loading && !error && (
            filtered.length === 0 ? (
              <p className="text-slate-500">Nenhum colaborador encontrado</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-[65vh] overflow-y-auto pr-1">
                {filtered.map((e) => (
                  <motion.div key={e.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-gray-50 dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{e.full_name} {e.matricula ? ` • ${e.matricula}` : ''}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-300">{companies.find((c) => c.id === e.empresa_id)?.name || '—'} {e.ug_id ? ` • UG ${e.ug_id}` : ''}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-300">{e.cargo_funcao || '—'}</div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs ${e.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'}`}>{e.status === 'ativo' ? 'Ativo' : 'Inativo'}</div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <button className="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title={t('edit')} onClick={() => onEdit(e)}>
                        <Pencil size={16} className="text-slate-600 dark:text-slate-300" />
                      </button>
                      <button className="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title={t('delete')} onClick={() => onDelete(e.id)}>
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}