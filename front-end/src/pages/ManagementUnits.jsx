import React from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Pencil, Trash2, Plus, Save, FileDown, FileText, Printer, Search, X } from 'lucide-react';
import {
  getManagementUnits,
  createManagementUnit,
  updateManagementUnit,
  deleteManagementUnit,
  getCompanies,
  getEmployees,
} from '../apiClient';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';

export default function ManagementUnitsPage() {
  const { t } = useTranslation();
  const [ugs, setUgs] = React.useState([]);
  const [companies, setCompanies] = React.useState([]);
  const [employees, setEmployees] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [query, setQuery] = React.useState('');
  const [editingId, setEditingId] = React.useState(null);
  const [errors, setErrors] = React.useState({});
  // Modais de busca
  const [companyModalOpen, setCompanyModalOpen] = React.useState(false);
  const [companySearch, setCompanySearch] = React.useState('');
  const [respModalOpen, setRespModalOpen] = React.useState(false);
  const [respQuery, setRespQuery] = React.useState('');
  const [ugPaiModalOpen, setUgPaiModalOpen] = React.useState(false);
  const [ugQuery, setUgQuery] = React.useState('');

  const [form, setForm] = React.useState({
    nome: '',
    tipo_unidade: 'Administrativa',
    nivel_hierarquico: 'CEO',
    empresa_id: '',
    responsavel_id: '',
    ug_superior_id: '',
    status: 'Ativo',
  });

  const load = React.useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([getManagementUnits(), getCompanies(), getEmployees()])
      .then(([ugsData, companiesData, employeesData]) => {
        setUgs(ugsData || []);
        setCompanies(companiesData || []);
        setEmployees(employeesData || []);
      })
      .catch((err) => setError(err.message || 'Error'))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      nome: '', tipo_unidade: 'Administrativa', nivel_hierarquico: 'CEO', empresa_id: '',
      responsavel_id: '', ug_superior_id: '', status: 'Ativo',
    });
    setErrors({});
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  // Selecionados (para exibir nomes)
  const selectedCompany = React.useMemo(() => companies.find((c) => String(c.id) === String(form.empresa_id)), [companies, form.empresa_id]);
  const selectedResp = React.useMemo(() => employees.find((e) => String(e.id) === String(form.responsavel_id)), [employees, form.responsavel_id]);
  const selectedUGPai = React.useMemo(() => ugs.find((u) => String(u.id) === String(form.ug_superior_id)), [ugs, form.ug_superior_id]);

  const validate = () => {
    const next = {};
    if (!form.nome) next.nome = t('field_required') || 'Obrigatório';
    if (!form.empresa_id) next.empresa_id = t('field_required') || 'Obrigatório';
    if (form.nivel_hierarquico !== 'CEO' && !form.ug_superior_id) next.ug_superior_id = t('field_required') || 'Obrigatório';
    return next;
  };

  const onSave = async () => {
    try {
      const v = validate();
      setErrors(v);
      if (Object.keys(v).length) { toast.error(t('required_fields') || 'Preencha os obrigatórios'); return; }

      const payload = {
        nome: form.nome,
        tipo_unidade: form.tipo_unidade,
        nivel_hierarquico: form.nivel_hierarquico,
        empresa_id: form.empresa_id ? Number(form.empresa_id) : undefined,
        responsavel_id: form.responsavel_id ? Number(form.responsavel_id) : undefined,
        ug_superior_id: form.nivel_hierarquico === 'CEO' ? undefined : (form.ug_superior_id ? Number(form.ug_superior_id) : undefined),
        status: form.status,
      };

      if (editingId) {
        await updateManagementUnit(editingId, payload);
        toast.success(t('updated_successfully') || 'Atualizado com sucesso');
      } else {
        await createManagementUnit(payload);
        toast.success(t('created_successfully') || 'Criado com sucesso');
      }
      resetForm();
      load();
    } catch (err) {
      toast.error(err.message || t('backend_error') || 'Erro no backend');
    }
  };

  const onNew = () => { resetForm(); toast(t('new_record') || 'Novo cadastro'); };

  const onEdit = (ug) => {
    setEditingId(ug.id);
    setForm({
      nome: ug.nome || '',
      tipo_unidade: ug.tipo_unidade || 'Administrativa',
      nivel_hierarquico: ug.nivel_hierarquico || 'CEO',
      empresa_id: ug.empresa_id || '',
      responsavel_id: ug.responsavel_id || '',
      ug_superior_id: ug.ug_superior_id || '',
      status: ug.status || 'Ativo',
    });
    setErrors({});
  };

  const onDelete = async (id) => {
    try {
      await deleteManagementUnit(id);
      toast.success(t('deleted_successfully') || 'Excluído com sucesso');
      if (editingId === id) resetForm();
      load();
    } catch (err) {
      toast.error(err.message || t('backend_error') || 'Erro no backend');
    }
  };

  const filtered = ugs.filter((c) => (
    (c.nome && c.nome.toLowerCase().includes(query.toLowerCase())) ||
    (c.codigo && String(c.codigo).toLowerCase().includes(query.toLowerCase()))
  ));

  const exportCSV = () => {
    const rows = [
      ['Codigo', 'Nome', 'Empresa', 'Responsavel', 'Status'],
      ...filtered.map((x) => [
        x.codigo, x.nome,
        companies.find((c) => c.id === x.empresa_id)?.name || '',
        employees.find((e) => e.id === x.responsavel_id)?.full_name || '',
        x.status,
      ]),
    ];
    const csv = rows.map((r) => r.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'unidades_gerenciais.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('export_excel') || 'Exportado CSV');
  };

  const printPDF = () => {
    const printWin = window.open('', 'PRINT', 'height=600,width=800');
    const rows = filtered.map((x) => `<tr>
      <td style="padding:6px;border:1px solid #ddd">${x.codigo || ''}</td>
      <td style="padding:6px;border:1px solid #ddd">${x.nome || ''}</td>
      <td style="padding:6px;border:1px solid #ddd">${companies.find((c) => c.id === x.empresa_id)?.name || ''}</td>
      <td style="padding:6px;border:1px solid #ddd">${employees.find((e) => e.id === x.responsavel_id)?.full_name || ''}</td>
      <td style="padding:6px;border:1px solid #ddd">${x.status || ''}</td>
    </tr>`).join('');
    printWin.document.write(`<html><head><title>UGs</title></head><body>
      <h3 style="font-family:Arial">Lista de Unidades Gerenciais</h3>
      <table style="border-collapse:collapse;font-family:Arial;font-size:12px">
        <thead><tr>
          <th style="padding:6px;border:1px solid #ddd">Código</th>
          <th style="padding:6px;border:1px solid #ddd">Nome</th>
          <th style="padding:6px;border:1px solid #ddd">Empresa</th>
          <th style="padding:6px;border:1px solid #ddd">Responsável</th>
          <th style="padding:6px;border:1px solid #ddd">Status</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body></html>`);
    printWin.document.close();
    printWin.focus();
    printWin.print();
    printWin.close();
    toast.success(t('export_pdf') || 'Exportado PDF (via impressão)');
  };

  const tipoOptions = ['Administrativa', 'Produtiva', 'Apoio', 'Auxiliares'];
  const nivelOptions = ['CEO', 'Diretoria', 'Gerência Geral', 'Gerência', 'Coordenação', 'Operacional'];

  React.useEffect(() => {
    if (form.nivel_hierarquico === 'CEO') {
      setForm((f) => ({ ...f, ug_superior_id: '' }));
    }
  }, [form.nivel_hierarquico]);

  // --- Busca de Empresa ---
  const modalFilteredCompanies = React.useMemo(() => {
    const q = (companySearch || '').trim().toLowerCase();
    let list = companies || [];
    if (!q) return list.slice(0, 100);
    return list
      .filter((c) => String(c.name || '').toLowerCase().includes(q) || String(c.cnpj || '').toLowerCase().includes(q))
      .slice(0, 100);
  }, [companySearch, companies]);
  const openCompanySearch = () => { setCompanyModalOpen(true); setCompanySearch(''); };
  const closeCompanySearch = () => { setCompanyModalOpen(false); setCompanySearch(''); };
  const selectCompany = (c) => {
    setForm((f) => ({ ...f, empresa_id: String(c.id), ug_superior_id: '' }));
    setErrors((prev) => ({ ...prev, empresa_id: null }));
    setCompanyModalOpen(false);
  };

  // --- Busca de Responsável ---
  const filteredEmployees = React.useMemo(() => {
    const q = (respQuery || '').trim().toLowerCase();
    let list = employees || [];
    if (!q) return list.slice(0, 100);
    const qDigits = q.replace(/\D/g, '');
    return list
      .filter((e) => {
        const nome = String(e.full_name || '').toLowerCase();
        const email = String(e.email_corporativo || '').toLowerCase();
        const cpf = String(e.cpf || '').replace(/\D/g, '');
        const matricula = String(e.matricula || '').toLowerCase();
        return (
          nome.includes(q) ||
          email.includes(q) ||
          matricula.includes(q) ||
          (qDigits && cpf.includes(qDigits))
        );
      })
      .slice(0, 100);
  }, [respQuery, employees]);
  const openRespSearch = () => { setRespModalOpen(true); setRespQuery(''); };
  const closeRespSearch = () => { setRespModalOpen(false); setRespQuery(''); };
  const selectResp = (e) => {
    setForm((f) => ({ ...f, responsavel_id: String(e.id) }));
    setErrors((prev) => ({ ...prev, responsavel_id: null }));
    setRespModalOpen(false);
  };

  // --- Busca de UG Superior (Pai) ---
  const modalFilteredUgs = React.useMemo(() => {
    const q = (ugQuery || '').trim().toLowerCase();
    let list = ugs || [];
    if (form.empresa_id) list = list.filter((u) => String(u.empresa_id) === String(form.empresa_id));
    if (!q) return list.slice(0, 100);
    return list
      .filter((u) => (String(u.codigo || '').toLowerCase().includes(q) || String(u.nome || '').toLowerCase().includes(q)))
      .slice(0, 100);
  }, [ugQuery, ugs, form.empresa_id]);
  const openUgPaiSearch = () => { if (form.nivel_hierarquico !== 'CEO') { setUgPaiModalOpen(true); setUgQuery(''); } };
  const closeUgPaiSearch = () => { setUgPaiModalOpen(false); setUgQuery(''); };
  const selectUGPai = (u) => {
    setForm((f) => ({ ...f, ug_superior_id: String(u.id) }));
    setErrors((prev) => ({ ...prev, ug_superior_id: null }));
    setUgPaiModalOpen(false);
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Unidades Gerenciais</h2>
        <div className="flex items-center gap-2">
          <Button variant="secondary" title={t('new')} aria-label={t('new')} onClick={onNew} className="px-2 py-2"><Plus size={18} /> {t('new')}</Button>
          <Button variant="primary" title={t('save')} aria-label={t('save')} onClick={onSave} className="px-2 py-2"><Save size={18} /> {t('save')}</Button>
          <Button variant="secondary" title={t('edit')} aria-label={t('edit')} disabled={!editingId} onClick={() => editingId && onEdit(ugs.find((x) => x.id === editingId))} className="px-2 py-2"><Pencil size={18} /></Button>
          <Button variant="danger" title={t('delete')} aria-label={t('delete')} disabled={!editingId} onClick={() => editingId && onDelete(editingId)} className="px-2 py-2"><Trash2 size={18} /></Button>
          <Button variant="secondary" title={t('print')} aria-label={t('print')} onClick={() => window.print()} className="px-2 py-2"><Printer size={18} /></Button>
          <Button variant="secondary" title={t('export_pdf')} aria-label={t('export_pdf')} onClick={printPDF} className="px-2 py-2"><img src="/Pdf.svg" alt="PDF" className="h-5 w-5" /></Button>
          <Button variant="secondary" title={t('export_excel')} aria-label={t('export_excel')} onClick={exportCSV} className="px-2 py-2"><img src="/Excel.svg" alt="Excel" className="h-5 w-5" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Formulário (Esquerda) */}
        <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nome da Unidade Gerencial" name="nome" value={form.nome} onChange={onChange} error={errors.nome} />
            <Select label="Tipo da Unidade" name="tipo_unidade" value={form.tipo_unidade} onChange={onChange}>
              {tipoOptions.map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
            <Select label="Nível Hierárquico" name="nivel_hierarquico" value={form.nivel_hierarquico} onChange={onChange}>
              {nivelOptions.map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
            {/* Empresa com busca (lupa) */}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input label="Empresa" name="empresa_nome" value={selectedCompany ? selectedCompany.name : ''} onChange={() => {}} error={errors.empresa_id} disabled />
              </div>
              <Button variant="secondary" onClick={openCompanySearch} title="Pesquisar Empresa" aria-label="Pesquisar Empresa" className="p-0 h-10 w-10 justify-center"><Search size={18} /></Button>
            </div>

            {/* Responsável com busca (lupa) */}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input label="Responsável" name="responsavel_nome" value={selectedResp ? selectedResp.full_name : ''} onChange={() => {}} disabled />
              </div>
              <Button variant="secondary" onClick={openRespSearch} title="Pesquisar Responsável" aria-label="Pesquisar Responsável" className="p-0 h-10 w-10 justify-center"><Search size={18} /></Button>
            </div>

            {/* UG Superior (Pai) com busca (lupa) */}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input label="UG Superior (Pai)" name="ug_pai_nome" value={selectedUGPai ? `${selectedUGPai.codigo} - ${selectedUGPai.nome}` : ''} onChange={() => {}} disabled />
              </div>
              <Button variant="secondary" onClick={openUgPaiSearch} title="Pesquisar UG Superior" aria-label="Pesquisar UG Superior" className="p-0 h-10 w-10 justify-center" disabled={form.nivel_hierarquico === 'CEO'}><Search size={18} /></Button>
            </div>
            <Select label="Status" name="status" value={form.status} onChange={onChange}>
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
            </Select>
          </div>
        </div>

        {/* Listagem (Direita) */}
        <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <input className="px-3 py-2 rounded-md border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 flex-1" placeholder="Pesquisar por nome ou código" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>

          {loading && <p className="text-slate-500">{t('backend_checking') || 'Checando backend...'}</p>}
          {error && <p className="text-red-600">{t('backend_error') || 'Erro'}</p>}
          {!loading && !error && (
            filtered.length === 0 ? (
              <p className="text-slate-500">Nenhuma UG encontrada</p>
            ) : (
              <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
                {filtered.map((ug) => (
                  <div key={ug.id} className="rounded-xl bg-gray-50 dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-sm text-slate-500">Código: <span className="font-mono">{ug.codigo}</span></div>
                        <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{ug.nome}</div>
                        <div className="text-sm text-slate-700 dark:text-slate-300 mt-1">Empresa: {companies.find((c) => c.id === ug.empresa_id)?.name || '-'}</div>
                        <div className="text-sm text-slate-700 dark:text-slate-300">Responsável: {employees.find((e) => e.id === ug.responsavel_id)?.full_name || '-'}</div>
                        <div className="text-sm mt-1">
                          {ug.status === 'Ativo' ? (
                            <span className="px-2 py-1 rounded bg-green-100 text-green-700">Ativo</span>
                          ) : (
                            <span className="px-2 py-1 rounded bg-slate-200 text-slate-700">Inativo</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title={t('edit') || 'Editar'} onClick={() => onEdit(ug)}>
                          <Pencil size={18} className="text-slate-600 dark:text-slate-300" />
                        </button>
                        <button className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title={t('delete') || 'Excluir'} onClick={() => onDelete(ug.id)}>
                          <Trash2 size={18} className="text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* Modal: Buscar Empresa */}
      {companyModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center">
          <div className="bg-white dark:bg-slate-950 w-full max-w-xl rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Buscar Empresa</h3>
              <Button variant="secondary" onClick={closeCompanySearch} title="Fechar" aria-label="Fechar" className="px-2 py-2"><X size={18} /></Button>
            </div>
            <input
              className="w-full px-3 py-2 rounded-md border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Digite nome ou CNPJ..."
              value={companySearch}
              onChange={(e) => setCompanySearch(e.target.value)}
              autoComplete="off"
            />
            <div className="mt-3 max-h-[360px] overflow-y-auto pr-1 divide-y divide-slate-200 dark:divide-slate-800">
              {modalFilteredCompanies.length === 0 ? (
                <p className="text-slate-500">Nenhuma empresa encontrada.</p>
              ) : (
                modalFilteredCompanies.map((c) => (
                  <button key={c.id} onClick={() => selectCompany(c)} className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{c.name}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">CNPJ: {c.cnpj}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Buscar Responsável */}
      {respModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center">
          <div className="bg-white dark:bg-slate-950 w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Buscar Responsável</h3>
              <Button variant="secondary" onClick={closeRespSearch} title="Fechar" aria-label="Fechar" className="px-2 py-2"><X size={18} /></Button>
            </div>
            <input
              className="w-full px-3 py-2 rounded-md border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Digite nome, e-mail, matrícula ou CPF..."
              value={respQuery}
              onChange={(e) => setRespQuery(e.target.value)}
              autoComplete="off"
            />
            <div className="mt-3 max-h-[360px] overflow-y-auto pr-1">
              {filteredEmployees.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectResp(c)}
                  className="w-full text-left rounded-lg bg-gray-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 mb-2 hover:bg-gray-100 dark:hover:bg-slate-800"
                >
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{c.full_name}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">{c.email_corporativo}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">CPF: {c.cpf}</div>
                </button>
              ))}
              {filteredEmployees.length === 0 && <p className="text-slate-500">Nenhum colaborador encontrado.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Buscar UG Superior (Pai) */}
      {ugPaiModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center">
          <div className="bg-white dark:bg-slate-950 w-full max-w-xl rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Buscar UG Superior (Pai)</h3>
              <Button variant="secondary" onClick={closeUgPaiSearch} title="Fechar" aria-label="Fechar" className="px-2 py-2"><X size={18} /></Button>
            </div>
            <input
              className="w-full px-3 py-2 rounded-md border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Digite código ou nome da UG..."
              value={ugQuery}
              onChange={(e) => setUgQuery(e.target.value)}
              autoComplete="off"
            />
            <div className="mt-3 max-h-[360px] overflow-y-auto pr-1 divide-y divide-slate-200 dark:divide-slate-800">
              {modalFilteredUgs.length === 0 ? (
                <p className="text-slate-500">Nenhuma UG encontrada.</p>
              ) : (
                modalFilteredUgs.map((u) => (
                  <button key={u.id} onClick={() => selectUGPai(u)} className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{u.codigo} - {u.nome}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">Empresa ID: {u.empresa_id}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}