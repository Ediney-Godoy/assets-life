import React from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Plus, Save, Pencil, Trash2, Printer, FileText, FileDown, Search, X } from 'lucide-react';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getCompanies,
  getManagementUnits,
  getEmployees,
} from '../apiClient';

export default function UsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = React.useState([]);
  const [companies, setCompanies] = React.useState([]);
  const [ugs, setUgs] = React.useState([]);
  const [ccList, setCcList] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [query, setQuery] = React.useState('');
  const [editingId, setEditingId] = React.useState(null);
  const [errors, setErrors] = React.useState({});
  const [changePassword, setChangePassword] = React.useState(false);
  // Pesquisa de colaboradores
  const [showEmpSearch, setShowEmpSearch] = React.useState(false);
  const [empLoading, setEmpLoading] = React.useState(false);
  const [empError, setEmpError] = React.useState(null);
  const [empQuery, setEmpQuery] = React.useState('');
  const [empList, setEmpList] = React.useState([]);
  // Busca de UG e Centro de Custos
  const [ugModalOpen, setUgModalOpen] = React.useState(false);
  const [ugQuery, setUgQuery] = React.useState('');
  const [ccModalOpen, setCcModalOpen] = React.useState(false);
  const [ccQuery, setCcQuery] = React.useState('');
  // Empresa com modal de busca
  const [companyModalOpen, setCompanyModalOpen] = React.useState(false);
  const [companySearch, setCompanySearch] = React.useState('');
  const [form, setForm] = React.useState({
    codigo: '',
    nome_completo: '',
    email: '',
    senha: '',
    confirmacao_senha: '',
    cpf: '',
    nome_usuario: '',
    data_nascimento: '',
    empresa_id: '',
    ug_id: '',
    centro_custo_id: '',
    status: 'Ativo',
  });

  const load = React.useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([getUsers(), getCompanies(), getManagementUnits()])
      .then(([uData, cData, ugData]) => {
        setUsers(uData || []);
        setCompanies(cData || []);
        setUgs(ugData || []);
      })
      .catch((err) => setError(err.message || 'Erro'))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      codigo: '', nome_completo: '', email: '', senha: '', confirmacao_senha: '', cpf: '', nome_usuario: '',
      data_nascimento: '', empresa_id: '', ug_id: '', centro_custo_id: '', status: 'Ativo',
    });
    setErrors({});
    setChangePassword(false);
  };

  const formatCpf = (val) => {
    const digits = String(val || '').replace(/\D/g, '').slice(0, 11);
    const parts = [];
    if (digits.length > 0) parts.push(digits.substring(0, 3));
    if (digits.length > 3) parts.push(digits.substring(3, 6));
    if (digits.length > 6) parts.push(digits.substring(6, 9));
    const suffix = digits.length > 9 ? '-' + digits.substring(9, 11) : '';
    return parts.join('.') + suffix;
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    let v = value;
    if (name === 'cpf') v = formatCpf(value);
    setForm((f) => ({ ...f, [name]: v }));
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const next = {};
    if (!form.nome_completo) next.nome_completo = 'Obrigatório';
    if (!form.email) next.email = 'Obrigatório';
    const cpfDigits = (form.cpf || '').replace(/\D/g, '');
    if (!cpfDigits || cpfDigits.length !== 11) next.cpf = 'CPF inválido';
    if (!editingId || changePassword) {
      if (!form.senha) next.senha = 'Obrigatório';
      if (!form.confirmacao_senha) next.confirmacao_senha = 'Obrigatório';
      if (form.senha !== form.confirmacao_senha) next.confirmacao_senha = 'Confirmação não confere';
    }
    if (!form.nome_usuario) next.nome_usuario = 'Obrigatório';
    return next;
  };

  const buildPayload = () => {
    const payload = {
      nome_completo: form.nome_completo,
      email: form.email,
      cpf: form.cpf,
      nome_usuario: form.nome_usuario,
      data_nascimento: form.data_nascimento || undefined,
      empresa_id: form.empresa_id ? Number(form.empresa_id) : undefined,
      ug_id: form.ug_id ? Number(form.ug_id) : undefined,
      centro_custo_id: form.centro_custo_id ? Number(form.centro_custo_id) : undefined,
      status: form.status,
    };
    if (!editingId || changePassword) {
      payload.senha = form.senha;
      payload.confirmacao_senha = form.confirmacao_senha;
    }
    return payload;
  };

  // Abrir/fechar modal de busca de colaboradores
  const openEmpSearch = async () => {
    setShowEmpSearch(true);
    setEmpError(null);
    if (empList.length === 0) {
      try {
        setEmpLoading(true);
        const data = await getEmployees();
        setEmpList(data || []);
      } catch (e) {
        setEmpError(e.message || 'Erro ao carregar colaboradores');
      } finally {
        setEmpLoading(false);
      }
    }
  };
  const closeEmpSearch = () => { setShowEmpSearch(false); setEmpQuery(''); };
  const filteredEmployees = React.useMemo(() => {
    const q = empQuery.trim().toLowerCase();
    const list = empList || [];
    if (!q) return list.slice(0, 50);
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
  }, [empQuery, empList]);
  const selectEmployee = (e) => {
    setForm((f) => ({
      ...f,
      nome_completo: e.full_name || '',
      email: f.email || e.email_corporativo || '',
    }));
    setErrors((prev) => ({ ...prev, nome_completo: null }));
    toast.success('Colaborador selecionado');
    closeEmpSearch();
  };

  // Busca de UG (modal)
  const selectedUG = React.useMemo(() => ugs.find((u) => String(u.id) === String(form.ug_id)), [ugs, form.ug_id]);
  const selectedCompany = React.useMemo(() => companies.find((c) => c.id === Number(form.empresa_id)), [companies, form.empresa_id]);
  const selectedCC = React.useMemo(() => ccList.find((c) => String(c.id) === String(form.centro_custo_id)), [ccList, form.centro_custo_id]);
  const openUgSearch = () => { setUgModalOpen(true); setUgQuery(''); };
  const closeUgSearch = () => { setUgModalOpen(false); setUgQuery(''); };
  const modalFilteredUgs = React.useMemo(() => {
    const q = (ugQuery || '').trim().toLowerCase();
    let list = ugs || [];
    if (form.empresa_id) list = list.filter((u) => String(u.empresa_id) === String(form.empresa_id));
    if (!q) return list.slice(0, 100);
    return list
      .filter((u) => (String(u.codigo || '').toLowerCase().includes(q) || String(u.nome || '').toLowerCase().includes(q)))
      .slice(0, 100);
  }, [ugQuery, ugs, form.empresa_id]);
  const selectUG = (u) => {
    setForm((f) => ({ ...f, ug_id: u.id }));
    setErrors((prev) => ({ ...prev, ug_id: null }));
    toast.success('UG selecionada');
    closeUgSearch();
  };

  // Busca de Centro de Custos (modal)
  const openCcSearch = async () => {
    setCcModalOpen(true);
    setCcQuery('');
    try {
      // Lazy load dos CCs conforme filtros atuais
      const { getCostCenters } = await import('../apiClient');
      const data = await getCostCenters({ empresa_id: form.empresa_id || undefined, ug_id: form.ug_id || undefined });
      setCcList(data || []);
    } catch (e) {
      toast.error(e.message || 'Erro ao carregar Centros de Custos');
    }
  };
  const closeCcSearch = () => { setCcModalOpen(false); setCcQuery(''); };
  const modalFilteredCcs = React.useMemo(() => {
    const q = (ccQuery || '').trim().toLowerCase();
    let list = ccList || [];
    if (form.empresa_id) list = list.filter((c) => String(c.empresa_id) === String(form.empresa_id));
    if (form.ug_id) list = list.filter((c) => String(c.ug_id) === String(form.ug_id));
    if (!q) return list.slice(0, 100);
    return list
      .filter((c) => (String(c.codigo || '').toLowerCase().includes(q) || String(c.nome || '').toLowerCase().includes(q)))
      .slice(0, 100);
  }, [ccQuery, ccList, form.empresa_id, form.ug_id]);
  const selectCC = (c) => {
    setForm((f) => ({ ...f, centro_custo_id: c.id }));
    setErrors((prev) => ({ ...prev, centro_custo_id: null }));
    toast.success('Centro de Custos selecionado');
    closeCcSearch();
  };

  // Busca de Empresa (modal)
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
    setForm((f) => ({ ...f, empresa_id: String(c.id), ug_id: '', centro_custo_id: '' }));
    setErrors((prev) => ({ ...prev, empresa_id: null }));
    setCompanyModalOpen(false);
  };

  const onSave = async () => {
    try {
      const v = validate();
      setErrors(v);
      if (Object.keys(v).length) { toast.error('Verifique os campos obrigatórios'); return; }
      const payload = buildPayload();
      if (editingId) {
        await updateUser(editingId, payload);
        toast.success('Usuário atualizado com sucesso');
      } else {
        const created = await createUser(payload);
        toast.success('Usuário criado com sucesso');
        setForm((f) => ({ ...f, codigo: created?.codigo || '' }));
      }
      resetForm();
      load();
    } catch (err) {
      toast.error(err.message || 'Erro no backend');
    }
  };

  const onNew = () => { resetForm(); toast('Novo cadastro'); };

  const onEdit = (u) => {
    setEditingId(u.id);
    setForm({
      codigo: u.codigo || '',
      nome_completo: u.nome_completo || '',
      email: u.email || '',
      senha: '',
      confirmacao_senha: '',
      cpf: u.cpf || '',
      nome_usuario: u.nome_usuario || '',
      data_nascimento: u.data_nascimento || '',
      empresa_id: u.empresa_id || '',
      ug_id: u.ug_id || '',
      centro_custo_id: u.centro_custo_id || '',
      status: u.status || 'Ativo',
    });
    setErrors({});
    setChangePassword(false);
  };

  const onDelete = async (id) => {
    try {
      await deleteUser(id);
      toast.success('Usuário excluído com sucesso');
      if (editingId === id) resetForm();
      load();
    } catch (err) {
      toast.error(err.message || 'Erro no backend');
    }
  };

  const filtered = users.filter((u) => (
    (u.nome_completo && u.nome_completo.toLowerCase().includes(query.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(query.toLowerCase())) ||
    (u.nome_usuario && u.nome_usuario.toLowerCase().includes(query.toLowerCase()))
  ));

  const exportCSV = () => {
    const rows = [
      ['Codigo', 'Nome Completo', 'Email', 'Empresa', 'UG', 'Centro Custo', 'Status'],
      ...filtered.map((x) => [
        x.codigo,
        x.nome_completo,
        x.email,
        companies.find((c) => c.id === x.empresa_id)?.name || '',
        ugs.find((u) => u.id === x.ug_id)?.codigo || '',
        x.centro_custo_id || '',
        x.status,
      ]),
    ];
    const csv = rows.map((r) => r.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'usuarios.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exportado CSV');
  };

  const printPDF = () => {
    const printWin = window.open('', 'PRINT', 'height=600,width=800');
    const rows = filtered.map((x) => `<div style="padding:8px;border:1px solid #ddd;border-radius:8px;margin-bottom:6px;">
      <div style="font-weight:bold">${x.codigo || ''} - ${x.nome_completo || ''}</div>
      <div>${x.email || ''}</div>
      <div>Empresa: ${companies.find((c) => c.id === x.empresa_id)?.name || ''} | UG: ${ugs.find((u) => u.id === x.ug_id)?.codigo || ''} | Centro Custo: ${x.centro_custo_id || ''}</div>
      <div>Status: ${x.status || ''}</div>
    </div>`).join('');
    printWin.document.write(`<html><head><title>Usuários</title></head><body>
      <h3 style="font-family:Arial">Lista de Usuários</h3>
      ${rows}
    </body></html>`);
    printWin.document.close();
    printWin.focus();
    printWin.print();
    printWin.close();
    toast.success('Exportado PDF (via impressão)');
  };

  return (
    <section>
      {/* Barra de ferramentas */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Usuários</h2>
        <div className="flex items-center gap-2">
          <Button variant="secondary" title="Novo" aria-label="Novo" onClick={onNew} className="px-2 py-2"><Plus size={18} /></Button>
          <Button variant="primary" title="Salvar" aria-label="Salvar" onClick={onSave} className="px-2 py-2"><Save size={18} /></Button>
          <Button variant="secondary" title="Editar" aria-label="Editar" disabled={!editingId} onClick={() => editingId && onEdit(users.find((x) => x.id === editingId))} className="px-2 py-2"><Pencil size={18} /></Button>
          <Button variant="danger" title="Excluir" aria-label="Excluir" disabled={!editingId} onClick={() => editingId && onDelete(editingId)} className="px-2 py-2"><Trash2 size={18} /></Button>
          <Button variant="secondary" title="Imprimir" aria-label="Imprimir" onClick={() => window.print()} className="px-2 py-2"><Printer size={18} /></Button>
          <Button variant="secondary" title="Exportar PDF" aria-label="Exportar PDF" onClick={printPDF} className="px-2 py-2"><FileText size={18} /></Button>
          <Button variant="secondary" title="Exportar Excel" aria-label="Exportar Excel" onClick={exportCSV} className="px-2 py-2"><FileDown size={18} /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Coluna Esquerda: Formulário */}
        <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1ª linha: Código e Status */}
            <Input label="Código" name="codigo" value={form.codigo || 'Automático'} readOnly />
            <Select label="Status" name="status" value={form.status} onChange={onChange}>
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
            </Select>

            {/* 2ª linha: Nome colaborador (lupa) e CPF */}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input label="Nome colaborador" name="nome_completo" value={form.nome_completo} onChange={() => {}} readOnly error={errors.nome_completo} />
              </div>
              <Button variant="secondary" onClick={openEmpSearch} title="Pesquisar Colaborador" aria-label="Pesquisar Colaborador" className="p-0 h-10 w-10 justify-center"><Search size={18} /></Button>
            </div>
            <Input label="CPF" name="cpf" value={form.cpf} onChange={onChange} error={errors.cpf} />

            {/* 3ª linha: E-mail e Data de Nascimento */}
            <Input label="E-mail" name="email" type="email" value={form.email} onChange={onChange} error={errors.email} autoComplete="off" />
            <Input label="Data de Nascimento" name="data_nascimento" type="date" value={form.data_nascimento} onChange={onChange} />

            {/* 4ª linha: Senha e Confirmação de senha */}
            {!editingId && (
              <>
                <Input label="Senha" name="senha" type="password" value={form.senha} onChange={onChange} error={errors.senha} autoComplete="new-password" />
                <Input label="Confirmação de senha" name="confirmacao_senha" type="password" value={form.confirmacao_senha} onChange={onChange} error={errors.confirmacao_senha} autoComplete="new-password" />
              </>
            )}
            {editingId && (
              <div className="md:col-span-2 flex items-center gap-2">
                <Button variant="secondary" onClick={() => setChangePassword((v) => !v)}>
                  {changePassword ? 'Cancelar Alteração de Senha' : 'Alterar Senha'}
                </Button>
              </div>
            )}
            {editingId && changePassword && (
              <>
                <Input label="Nova Senha" name="senha" type="password" value={form.senha} onChange={onChange} error={errors.senha} autoComplete="new-password" />
                <Input label="Confirmação de senha" name="confirmacao_senha" type="password" value={form.confirmacao_senha} onChange={onChange} error={errors.confirmacao_senha} autoComplete="new-password" />
              </>
            )}

            {/* 5ª linha: Nome de Usuário e Centro de Custos (lupa) */}
            <Input label="Nome de Usuário" name="nome_usuario" value={form.nome_usuario} onChange={onChange} error={errors.nome_usuario} autoComplete="off" />
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input label="Centro de Custos" name="cc_nome" value={selectedCC ? `${selectedCC.codigo} - ${selectedCC.nome}` : ''} onChange={() => {}} disabled />
              </div>
              <Button variant="secondary" onClick={openCcSearch} title="Pesquisar Centro de Custos" aria-label="Pesquisar Centro de Custos" className="p-0 h-10 w-10 justify-center"><Search size={18} /></Button>
            </div>

            {/* 6ª linha: Empresa (lupa) e UG (lupa) */}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input label="Empresa" name="empresa_nome" value={selectedCompany ? selectedCompany.name : ''} onChange={() => {}} disabled error={errors.empresa_id} />
              </div>
              <Button variant="secondary" onClick={openCompanySearch} title="Pesquisar Empresa" aria-label="Pesquisar Empresa" className="p-0 h-10 w-10 justify-center"><Search size={18} /></Button>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input label="Unidade Gerencial (UG)" name="ug_nome" value={selectedUG ? `${selectedUG.codigo} - ${selectedUG.nome}` : ''} onChange={() => {}} disabled />
              </div>
              <Button variant="secondary" onClick={openUgSearch} title="Pesquisar UG" aria-label="Pesquisar UG" className="p-0 h-10 w-10 justify-center"><Search size={18} /></Button>
            </div>
          </div>
        </div>

        {/* Coluna Direita: ListView */}
        <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Lista de Usuários</div>
          <div className="flex items-center gap-2 mb-3">
            <input className="px-3 py-2 rounded-md border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 flex-1" placeholder="Pesquisar por nome, e-mail ou usuário" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
          </div>

          {loading && <p className="text-slate-500">Checando backend...</p>}
          {error && <p className="text-red-600">Erro</p>}
          {!loading && !error && (
            filtered.length === 0 ? (
              <p className="text-slate-500">Nenhum usuário encontrado.</p>
            ) : (
              <div className="max-h-[640px] overflow-y-auto pr-1">
                {filtered.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => onEdit(u)}
                    className="rounded-xl bg-gray-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm p-3 mb-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-slate-900 dark:text-slate-100 font-semibold">{u.codigo} - {u.nome_completo}</div>
                        <div className="text-slate-600 dark:text-slate-300 text-sm">{u.email}</div>
                        <div className="text-slate-600 dark:text-slate-300 text-sm">
                          Empresa: {companies.find((c) => c.id === u.empresa_id)?.name || '—'} | UG: {ugs.find((g) => g.id === u.ug_id)?.codigo || '—'} | Centro Custo: {u.centro_custo_id || '—'}
                        </div>
                      </div>
                      <div>
                        <span className={`px-2 py-1 rounded-md border text-xs ${u.status === 'Ativo' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700' : 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700'}`}>{u.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    {showEmpSearch && (
      <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center">
        <div className="bg-white dark:bg-slate-950 w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Buscar Colaborador</h3>
            <Button variant="secondary" onClick={closeEmpSearch}>Fechar</Button>
          </div>
          <input
            className="w-full px-3 py-2 rounded-md border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Digite nome, e-mail, matrícula ou CPF..."
            value={empQuery}
            onChange={(e) => setEmpQuery(e.target.value)}
            autoComplete="off"
          />
          {empLoading && <p className="mt-3 text-slate-500">Carregando colaboradores...</p>}
          {empError && <p className="mt-3 text-red-600">{empError}</p>}
          {!empLoading && !empError && (
            <div className="mt-3 max-h-[360px] overflow-y-auto pr-1">
              {filteredEmployees.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectEmployee(c)}
                  className="w-full text-left rounded-lg bg-gray-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 mb-2 hover:bg-gray-100 dark:hover:bg-slate-800"
                >
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{c.full_name}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">{c.email_corporativo}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">CPF: {c.cpf}</div>
                </button>
              ))}
              {filteredEmployees.length === 0 && <p className="text-slate-500">Nenhum colaborador encontrado.</p>}
            </div>
          )}
        </div>
      </div>
    )}
    {ugModalOpen && (
      <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center">
        <div className="bg-white dark:bg-slate-950 w-full max-w-xl rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Buscar UG</h3>
            <Button variant="secondary" onClick={closeUgSearch} title="Fechar" aria-label="Fechar" className="px-2 py-2"><X size={18} /></Button>
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
                <button key={u.id} onClick={() => selectUG(u)} className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{u.codigo} - {u.nome}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">Empresa ID: {u.empresa_id}</div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    )}
    {ccModalOpen && (
      <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center">
        <div className="bg-white dark:bg-slate-950 w-full max-w-xl rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Buscar Centro de Custos</h3>
            <Button variant="secondary" onClick={closeCcSearch} title="Fechar" aria-label="Fechar" className="px-2 py-2"><X size={18} /></Button>
          </div>
          <input
            className="w-full px-3 py-2 rounded-md border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Digite código ou nome do Centro de Custos..."
            value={ccQuery}
            onChange={(e) => setCcQuery(e.target.value)}
            autoComplete="off"
          />
          <div className="mt-3 max-h-[360px] overflow-y-auto pr-1 divide-y divide-slate-200 dark:divide-slate-800">
            {modalFilteredCcs.length === 0 ? (
              <p className="text-slate-500">Nenhum Centro de Custos encontrado.</p>
            ) : (
              modalFilteredCcs.map((c) => (
                <button key={c.id} onClick={() => selectCC(c)} className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{c.codigo} - {c.nome}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">UG ID: {c.ug_id} | Empresa ID: {c.empresa_id}</div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    )}

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
            placeholder="Digite Nome ou CNPJ..."
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
                  {c.cnpj ? <div className="text-xs text-slate-600 dark:text-slate-300">{c.cnpj}</div> : null}
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