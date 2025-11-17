import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Pencil, Trash2, Plus, Save, FileDown, FileText, Printer, Upload, Lock, X, Search } from 'lucide-react';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import { 
  getReviewPeriods,
  createReviewPeriod,
  updateReviewPeriod,
  deleteReviewPeriod,
  uploadReviewBase,
  closeReviewPeriod,
  getEmployees,
  getCompanies,
  getUsers,
  getReviewItems,
  getManagementUnits,
} from '../apiClient';

export default function ReviewsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [periods, setPeriods] = React.useState([]);
  const [employees, setEmployees] = React.useState([]);
  const [companies, setCompanies] = React.useState([]);
  const [users, setUsers] = React.useState([]);
  const [companyModalOpen, setCompanyModalOpen] = React.useState(false);
  const [companySearch, setCompanySearch] = React.useState('');
  const [respModalOpen, setRespModalOpen] = React.useState(false);
  const [respQuery, setRespQuery] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [query, setQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [editingId, setEditingId] = React.useState(null);
  const [errors, setErrors] = React.useState({});
  const [ugs, setUgs] = React.useState([]);
  const [ugModalOpen, setUgModalOpen] = React.useState(false);
  const [ugQuery, setUgQuery] = React.useState('');

  const [uploadModalOpen, setUploadModalOpen] = React.useState(false);
  const [uploadDragActive, setUploadDragActive] = React.useState(false);
  const [uploadFile, setUploadFile] = React.useState(null);
  const [uploadResult, setUploadResult] = React.useState(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const [form, setForm] = React.useState({
    descricao: '',
    data_abertura: '',
    data_inicio_nova_vida_util: '',
    data_fechamento_prevista: '',
    data_fechamento: '',
    empresa_id: '',
    responsavel_id: '',
    ug_id: '',
    status: 'Aberto',
    observacoes: '',
    codigo: '',
  });

  const load = React.useCallback(() => {
    setLoading(true);
    setError(null);
  Promise.all([getReviewPeriods(), getEmployees(), getCompanies(), getUsers(), getManagementUnits()])
      .then(([pData, eData, cData, uData, ugData]) => {
        setPeriods(pData || []);
        setEmployees(eData || []);
        setCompanies(cData || []);
        setUsers(uData || []);
        setUgs(ugData || []);
      })
      .catch((err) => setError(err.message || t('error_generic') || 'Erro'))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const onNew = () => {
    setEditingId(null);
    setErrors({});
    setForm({
      descricao: '',
      data_abertura: '',
      data_inicio_nova_vida_util: '',
      data_fechamento_prevista: '',
      data_fechamento: '',
      empresa_id: '',
      responsavel_id: '',
      ug_id: '',
      status: 'Aberto',
      observacoes: '',
      codigo: '',
    });
    setCompanySearch('');
    setRespQuery('');
    setUgQuery('');
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const validate = () => {
    const errs = {};
    if (!form.descricao) errs.descricao = 'Descrição é obrigatória';
    if (!form.data_abertura) errs.data_abertura = 'Data de abertura é obrigatória';
    if (!form.data_inicio_nova_vida_util) errs.data_inicio_nova_vida_util = t('field_required') || 'Início da nova vida útil é obrigatório';
    if (!form.data_fechamento_prevista) errs.data_fechamento_prevista = 'Data de fechamento prevista é obrigatória';
    if (!form.empresa_id) errs.empresa_id = 'Empresa é obrigatória';
    if (!form.ug_id) errs.ug_id = 'UG é obrigatória';
    if (!form.responsavel_id) errs.responsavel_id = t('field_required') || 'Responsável é obrigatório';
    if (!['Aberto', 'Em Andamento', 'Fechado'].includes(form.status)) errs.status = t('invalid_status') || 'Status inválido';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSave = async () => {
    if (!validate()) return;
    try {
      if (!editingId) {
        const payload = {
          descricao: form.descricao,
          data_abertura: form.data_abertura,
          data_inicio_nova_vida_util: form.data_inicio_nova_vida_util,
          data_fechamento_prevista: form.data_fechamento_prevista,
          empresa_id: Number(form.empresa_id),
          responsavel_id: Number(form.responsavel_id),
          ug_id: Number(form.ug_id),
          status: form.status,
          observacoes: form.observacoes || null,
        };
        const created = await createReviewPeriod(payload);
        toast.success(t('created_successfully') || 'Período criado com sucesso');
        setEditingId(created.id);
      } else {
        const payload = {
          descricao: form.descricao,
          data_abertura: form.data_abertura || undefined,
          data_inicio_nova_vida_util: form.data_inicio_nova_vida_util || undefined,
          data_fechamento_prevista: form.data_fechamento_prevista || undefined,
          data_fechamento: form.data_fechamento || undefined,
          empresa_id: form.empresa_id ? Number(form.empresa_id) : undefined,
          responsavel_id: form.responsavel_id ? Number(form.responsavel_id) : undefined,
          ug_id: form.ug_id ? Number(form.ug_id) : undefined,
          status: form.status,
          observacoes: form.observacoes || undefined,
        };
        await updateReviewPeriod(editingId, payload);
        toast.success(t('updated_successfully') || 'Período atualizado com sucesso');
      }
      await load();
    } catch (err) {
      toast.error(err.message || t('error_saving') || 'Erro ao salvar');
    }
  };

  const onEdit = (p) => {
    setEditingId(p.id);
    setForm({
      descricao: p.descricao || '',
      data_abertura: p.data_abertura || '',
      data_inicio_nova_vida_util: p.data_inicio_nova_vida_util || '',
      data_fechamento_prevista: p.data_fechamento_prevista || '',
      data_fechamento: p.data_fechamento || '',
      empresa_id: String(p.empresa_id || ''),
      responsavel_id: String(p.responsavel_id || ''),
      ug_id: String(p.ug_id || ''),
      status: p.status || 'Aberto',
      observacoes: p.observacoes || '',
      codigo: p.codigo || '',
    });
  };

  const onDelete = async (id) => {
    if (!confirm(t('confirm_delete_period') || 'Confirmar exclusão do período?')) return;
    try {
      await deleteReviewPeriod(id);
      toast.success(t('deleted_successfully') || 'Período excluído');
      if (editingId === id) {
        onNew();
      }
      await load();
    } catch (err) {
      toast.error(err.message || t('error_deleting') || 'Erro ao excluir');
    }
  };

  const onClosePeriod = async () => {
    if (!editingId) return toast.error(t('select_period_msg') || 'Selecione um período');
    try {
      const updated = await closeReviewPeriod(editingId);
      toast.success(t('period_closed') || 'Período fechado');
      onEdit(updated);
      await load();
    } catch (err) {
      toast.error(err.message || t('error_closing_period') || 'Erro ao fechar período');
    }
  };

  const fileInputRef = React.useRef(null);
  const onUploadClick = () => {
    if (!editingId) return toast.error(t('select_period_msg') || 'Selecione um período');
    if (form.status === 'Fechado') return toast.error(t('period_closed_upload_not_allowed') || 'Período está fechado. Upload não permitido.');
    setUploadModalOpen(true);
    setUploadDragActive(false);
    setIsUploading(false);
    setUploadFile(null);
    setUploadResult(null);
  };

  const handleFilePicked = (file) => {
    if (!file) return;
    const name = (file.name || '').toLowerCase();
    if (!(name.endsWith('.csv') || name.endsWith('.xlsx'))) {
      toast.error(t('invalid_file_format') || 'Formato inválido. Envie .csv ou .xlsx');
      return;
    }
    setUploadFile(file);
  };

  const onInputFileChange = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (f) handleFilePicked(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setUploadDragActive(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) handleFilePicked(f);
  };

  const startUpload = async () => {
    if (!editingId) return toast.error(t('select_period_msg') || 'Selecione um período');
    if (!uploadFile) return toast.error(t('select_file_msg') || 'Selecione um arquivo');
    try {
      setIsUploading(true);
      const result = await uploadReviewBase(editingId, uploadFile);
      setUploadResult(result);
      toast.success(t('import_summary', { imported: result.importados, rejected: result.rejeitados }) || `Importação: ${result.importados} importados, ${result.rejeitados} rejeitados.`);
      // Opcional: buscar itens
      try {
        await getReviewItems(editingId);
      } catch {}
    } catch (err) {
      toast.error(err.message || t('upload_failed') || 'Falha no upload');
    } finally {
      setIsUploading(false);
    }
  };

  const filtered = (periods || [])
    .filter((p) => !statusFilter || p.status === statusFilter)
    .filter((p) => {
      const term = query.toLowerCase();
      return (
        (p.codigo || '').toLowerCase().includes(term) ||
        (p.descricao || '').toLowerCase().includes(term) ||
        (p.status || '').toLowerCase().includes(term)
      );
    })
    .sort((a, b) => (a.id < b.id ? 1 : -1));

  const columns = [
    { key: 'codigo', header: t('period_code') || 'Código', width: 120 },
    { key: 'descricao', header: t('period_description') || 'Descrição do Período' },
    { key: 'data_abertura', header: t('open_date') || 'Data de Abertura', width: 140 },
    { key: 'empresa_id', header: t('company_label') || 'Empresa', width: 220, render: (value) => {
      const c = companies.find((x) => x.id === value);
      return c ? c.name : '—';
    } },
    { key: 'ug_id', header: t('ug_label') || 'UG', width: 220, render: (value) => {
      const g = ugs.find((x) => x.id === value);
      return g ? `${g.codigo} - ${g.nome}` : '—';
    } },
    { key: 'responsavel_id', header: t('review_responsible') || 'Responsável', width: 220, render: (value) => {
      const u = users.find((x) => x.id === value);
      return u ? u.nome_completo : '—';
    } },
    { key: 'status', header: t('status') || 'Status', width: 140 },
  ];

  const disabled = form.status === 'Fechado';
  const selectedCompany = companies.find((c) => c.id === Number(form.empresa_id));
  const modalFilteredCompanies = companies.filter((c) =>
    !companySearch || (c.name || '').toLowerCase().includes(companySearch.toLowerCase())
  );
  const selectedResponsavel = users.find((u) => u.id === Number(form.responsavel_id));
  const selectedUG = ugs.find((u) => u.id === Number(form.ug_id));
  const modalFilteredUgs = React.useMemo(() => {
    const q = (ugQuery || '').trim().toLowerCase();
    let list = ugs || [];
    if (form.empresa_id) list = list.filter((u) => String(u.empresa_id) === String(form.empresa_id));
    if (!q) return list.slice(0, 50);
    return list
      .filter((u) => (String(u.codigo || '').toLowerCase().includes(q) || String(u.nome || '').toLowerCase().includes(q)))
      .slice(0, 100);
  }, [ugQuery, ugs, form.empresa_id]);

  return (
    <section>
      <div className="flex items-center justify-between mb-4 px-4">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{t('review_period_open_title') || 'Abertura de Período de Revisão de Vidas Úteis'}</h2>
          <div className="flex items-center gap-2">
            <Button variant="secondary" title={t('new') || '+ Novo'} aria-label={t('new') || 'Novo'} onClick={onNew} className="px-2 py-2"><Plus size={18} /></Button>
            <Button variant="primary" title={t('save') || 'Salvar'} aria-label={t('save') || 'Salvar'} onClick={onSave} className="px-2 py-2"><Save size={18} /></Button>
            <Button variant="secondary" title={t('nav_review_delegations') || 'Delegação'} aria-label={t('nav_review_delegations') || 'Delegação'} onClick={() => navigate('/reviews/delegacao')} className="px-3 py-2"><FileText size={18} /></Button>
            <Button variant="secondary" title={t('edit') || 'Editar'} aria-label={t('edit') || 'Editar'} disabled={!editingId} onClick={() => editingId && onEdit(periods.find((x) => x.id === editingId))} className="px-2 py-2"><Pencil size={18} /></Button>
            <Button variant="danger" title={t('delete') || 'Excluir'} aria-label={t('delete') || 'Excluir'} disabled={!editingId} onClick={() => editingId && onDelete(editingId)} className="px-2 py-2"><Trash2 size={18} /></Button>
            <Button variant="secondary" title={t('print') || 'Imprimir'} aria-label={t('print') || 'Imprimir'} onClick={() => window.print()} className="px-2 py-2"><Printer size={18} /></Button>
            <Button variant="secondary" title={t('export_excel') || 'Exportar Excel'} aria-label={t('export_excel') || 'Exportar Excel'} onClick={() => toast(t('coming_soon') || 'Em breve.')} className="px-2 py-2"><img src="/Excel.svg" alt="Excel" className="h-5 w-5" /></Button>
            <Button variant="secondary" title={t('export_pdf') || 'Exportar PDF'} aria-label={t('export_pdf') || 'Exportar PDF'} onClick={() => toast(t('coming_soon') || 'Em breve.')} className="px-2 py-2"><img src="/Pdf.svg" alt="PDF" className="h-5 w-5" /></Button>
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Formulário (Esquerda) */}
        <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label={t('period_code') || 'Código da Revisão'} name="codigo" value={form.codigo} onChange={() => {}} disabled />
            <Select label={t('status') || 'Status'} name="status" value={form.status} onChange={onChange} disabled={disabled}>
              <option value="Aberto">{t('open_status') || 'Aberto'}</option>
              <option value="Em Andamento">{t('in_progress_status') || 'Em Andamento'}</option>
              <option value="Fechado">{t('closed_status') || 'Fechado'}</option>
            </Select>
            <Input label={t('period_description') || 'Descrição do Período'} name="descricao" value={form.descricao} onChange={onChange} error={errors.descricao} disabled={disabled} />

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input className="w-full" label={t('company_label') || 'Empresa'} name="empresa_nome" value={selectedCompany ? selectedCompany.name : ''} onChange={() => {}} error={errors.empresa_id} disabled />
              </div>
              <Button variant="secondary" onClick={() => setCompanyModalOpen(true)} disabled={disabled} title={t('search_company') || 'Buscar Empresa'} aria-label={t('search_company') || 'Buscar Empresa'} className="p-0 h-10 w-10 justify-center"><Search size={18} /></Button>
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input className="w-full" label={t('ug_label') || 'UG - Unidade Gerencial'} name="ug_nome" value={selectedUG ? `${selectedUG.codigo} - ${selectedUG.nome}` : ''} onChange={() => {}} error={errors.ug_id} disabled />
              </div>
              <Button variant="secondary" onClick={() => setUgModalOpen(true)} disabled={disabled || !form.empresa_id} title={t('search_ug') || 'Buscar UG'} aria-label={t('search_ug') || 'Buscar UG'} className="p-0 h-10 w-10 justify-center"><Search size={18} /></Button>
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input className="w-full" label={t('review_responsible') || 'Responsável pela Revisão'} name="responsavel_nome" value={selectedResponsavel ? selectedResponsavel.nome_completo : ''} onChange={() => {}} error={errors.responsavel_id} disabled />
              </div>
              <Button variant="secondary" onClick={() => setRespModalOpen(true)} disabled={disabled} title={t('search_employee') || 'Buscar Colaborador'} aria-label={t('search_employee') || 'Buscar Colaborador'} className="p-0 h-10 w-10 justify-center"><Search size={18} /></Button>
            </div>
            <Input type="date" label={t('open_date') || 'Data de Abertura'} name="data_abertura" value={form.data_abertura} onChange={onChange} error={errors.data_abertura} disabled={disabled} />
            <Input type="date" label={t('start_new_useful_life') || 'Início Nova Vida Útil'} name="data_inicio_nova_vida_util" value={form.data_inicio_nova_vida_util} onChange={onChange} error={errors.data_inicio_nova_vida_util} disabled={disabled} />
            <Input type="date" label={t('expected_close_date') || 'Data de Fechamento Prevista'} name="data_fechamento_prevista" value={form.data_fechamento_prevista} onChange={onChange} error={errors.data_fechamento_prevista} disabled={disabled} />
            <Input type="date" label={t('close_date') || 'Data de Fechamento'} name="data_fechamento" value={form.data_fechamento} onChange={onChange} disabled />
             <div className="md:col-span-2">
               <Input label={t('observations') || 'Observações'} name="observacoes" value={form.observacoes} onChange={onChange} multiline disabled={disabled} />
             </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Button variant="secondary" onClick={onUploadClick} disabled={disabled || !editingId} title={t('upload_base') || 'Upload Base'} aria-label={t('upload_base') || 'Upload Base'} className="px-2 py-2"><Upload size={18} /></Button>
            <Button variant="danger" onClick={onClosePeriod} disabled={!editingId || disabled} title={t('close_period') || 'Fechar Período'} aria-label={t('close_period') || 'Fechar Período'} className="px-2 py-2"><Lock size={18} /></Button>
            <input type="file" accept=".csv,.xlsx" ref={fileInputRef} onChange={onInputFileChange} className="hidden" />
          </div>
        </div>

        {/* Listagem (Direita) */}
        <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <input className="px-3 py-2 rounded-md border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 flex-1" placeholder={t('search_periods_placeholder') || 'Pesquisar por código, descrição ou status'} value={query} onChange={(e) => setQuery(e.target.value)} />
            <Select label="" name="statusFilter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">{t('all') || 'Todos'}</option>
              <option value="Aberto">{t('review_status_open') || 'Aberto'}</option>
              <option value="Em Andamento">{t('review_status_in_progress') || 'Em Andamento'}</option>
              <option value="Fechado">{t('review_status_closed') || 'Fechado'}</option>
            </Select>
          </div>

          {loading && <p className="text-slate-500">{t('backend_checking') || 'Checando backend...'}</p>}
          {error && <p className="text-red-600">{t('backend_error') || 'Erro no backend'}</p>}
          {!loading && !error && (
            filtered.length === 0 ? (
              <p className="text-slate-500">{t('no_periods_found') || 'Nenhum período encontrado.'}</p>
            ) : (
              <>
                <Table columns={columns} data={filtered} onRowClick={onEdit} />
                <div className="text-sm text-slate-600 dark:text-slate-300 mt-3">{t('periods_count', { count: filtered.length }) || `${filtered.length} períodos`}</div>
              </>
            )
          )}
        </div>
      </div>

      {companyModalOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCompanyModalOpen(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-xl bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                <div className="font-semibold text-slate-900 dark:text-slate-100">{t('search_company_title') || 'Buscar Empresa'}</div>
                <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-900" onClick={() => setCompanyModalOpen(false)}><X size={18} /></button>
              </div>
              <div className="p-4">
                <Input label={t('search') || 'Pesquisar'} name="companySearch" value={companySearch} onChange={(e) => setCompanySearch(e.target.value)} />
                <div className="mt-3 max-h-64 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800">
                  {modalFilteredCompanies.length === 0 ? (
                    <div className="text-slate-500">{t('no_companies_found') || 'Nenhuma empresa encontrada.'}</div>
                  ) : (
                    modalFilteredCompanies.map((c) => (
                      <button key={c.id} className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-900" onClick={() => { setForm((f) => ({ ...f, empresa_id: String(c.id) })); setCompanyModalOpen(false); setCompanySearch(''); }}>
                        <div className="font-medium">{c.name}</div>
                        {c.cnpj && <div className="text-xs text-slate-500">{t('cnpj') || 'CNPJ'}: {c.cnpj}</div>}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {respModalOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setRespModalOpen(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-xl bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                <div className="font-semibold text-slate-900 dark:text-slate-100">{t('search_employee_title') || 'Buscar Colaborador'}</div>
                <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-900" onClick={() => setRespModalOpen(false)}><X size={18} /></button>
              </div>
              <div className="p-4">
                <Input label={t('search') || 'Pesquisar'} name="respQuery" value={respQuery} onChange={(e) => setRespQuery(e.target.value)} />
                <div className="mt-3 max-h-64 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800">
                  {modalFilteredEmployees.length === 0 ? (
                    <div className="text-slate-500">{t('no_employees_found') || 'Nenhum colaborador encontrado.'}</div>
                  ) : (
                    <>
                      {modalFilteredEmployees.map((emp) => {
                        return (
                          <button
                            key={emp.id}
                            className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-900"
                            onClick={() => {
                              const empCpf = String(emp.cpf || '').replace(/\D/g, '');
                              const empEmail = String(emp.email_corporativo || '').toLowerCase();
                              const matchedUser = users.find((u) => {
                                const uCpf = String(u.cpf || '').replace(/\D/g, '');
                                const uEmail = String(u.email || '').toLowerCase();
                                return (empCpf && uCpf === empCpf) || (empEmail && uEmail === empEmail);
                              });
                              if (matchedUser) {
                                setForm((f) => ({ ...f, responsavel_id: String(matchedUser.id) }));
                                setRespModalOpen(false);
                                setRespQuery('');
                                setErrors((prev) => ({ ...prev, responsavel_id: null }));
                                toast.success(t('responsible_selected') || 'Responsável selecionado');
                              } else {
                                toast.error(t('employee_no_user') || 'Colaborador não possui usuário vinculado');
                                setErrors((prev) => ({ ...prev, responsavel_id: t('user_not_found_for_employee') || 'Usuário não encontrado para o colaborador selecionado' }));
                              }
                            }}
                          >
                            <div className="font-medium">{emp.full_name}</div>
                            {emp.email_corporativo ? (
                              <div className="text-xs text-slate-500">{emp.email_corporativo}</div>
                            ) : null}
                          </button>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {ugModalOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setUgModalOpen(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-xl bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                <div className="font-semibold text-slate-900 dark:text-slate-100">{t('search_ug_title') || 'Buscar UG'}</div>
                <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-900" onClick={() => setUgModalOpen(false)}><X size={18} /></button>
              </div>
              <div className="p-4">
                <Input label={t('search') || 'Pesquisar'} name="ugQuery" value={ugQuery} onChange={(e) => setUgQuery(e.target.value)} />
                <div className="mt-3 max-h-64 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800">
                  {modalFilteredUgs.length === 0 ? (
                    <div className="text-slate-500">{t('no_ugs_found') || 'Nenhuma UG encontrada.'}</div>
                  ) : (
                    modalFilteredUgs.map((u) => (
                      <button key={u.id} className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-900" onClick={() => { setForm((f) => ({ ...f, ug_id: String(u.id) })); setUgModalOpen(false); setUgQuery(''); setErrors((prev) => ({ ...prev, ug_id: null })); }}>
                        <div className="font-medium">{u.codigo} - {u.nome}</div>
                        <div className="text-xs text-slate-500">{t('company_colon') || 'Empresa:'} {companies.find((c) => c.id === u.empresa_id)?.name || '—'}</div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
 
       {uploadModalOpen && (
         <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setUploadModalOpen(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-xl bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                <div className="font-semibold text-slate-900 dark:text-slate-100">{t('upload_base_title') || 'Upload Base (.csv/.xlsx)'}</div>
                <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-900" onClick={() => setUploadModalOpen(false)}><X size={18} /></button>
              </div>
              <div className="p-4 space-y-3">
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center ${uploadDragActive ? 'border-blue-400 bg-blue-50 dark:bg-slate-900/40' : 'border-slate-300 dark:border-slate-700'}`}
                  onDragOver={(e) => { e.preventDefault(); setUploadDragActive(true); }}
                  onDragLeave={() => setUploadDragActive(false)}
                  onDrop={onDrop}
                >
                  {!uploadFile ? (
                    <>
                      <div className="text-slate-700 dark:text-slate-300">{t('drag_drop_here') || 'Arraste e solte o arquivo aqui'}</div>
                      <div className="text-xs text-slate-500 mt-1">{t('file_formats') || 'Formatos: .csv ou .xlsx'}</div>
                      <div className="mt-3">
                        <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="px-3 py-2"><Upload size={18} /> {t('select_file') || 'Selecionar arquivo'}</Button>
                        <input type="file" accept=".csv,.xlsx" ref={fileInputRef} onChange={onInputFileChange} className="hidden" />
                      </div>
                    </>
                  ) : (
                    <div>
                      <div className="font-medium">{uploadFile.name}</div>
                      <div className="text-xs text-slate-500">{Math.round(uploadFile.size / 1024)} KB</div>
                      {!isUploading && !uploadResult && (
                        <div className="mt-2 text-xs text-slate-600">{t('file_selected_click_send') || "Arquivo selecionado. Clique 'Enviar arquivo' para iniciar."}</div>
                      )}
                      {/* Botão visível dentro da área ao selecionar o arquivo */}
                      <div className="mt-3 flex justify-center">
                        <Button variant="primary" onClick={startUpload} disabled={isUploading} className="px-3 py-2">
                          {isUploading ? (t('sending') || 'Enviando...') : (t('send_file') || 'Enviar arquivo')}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Button variant="secondary" onClick={() => { setUploadModalOpen(false); setUploadFile(null); setUploadResult(null); }} className="px-3 py-2">{t('close') || 'Fechar'}</Button>
                  <Button variant="primary" onClick={startUpload} disabled={!uploadFile || isUploading} className="px-3 py-2">{isUploading ? (t('sending') || 'Enviando...') : (t('send_file') || 'Enviar arquivo')}</Button>
                </div>

                {uploadResult && (
                  <div className="mt-2 text-sm">
                    <div className="font-medium">{t('import_result_title') || 'Resultado da importação'}</div>
                    <div className="text-slate-700 dark:text-slate-300">{t('import_result_counts', { imported: uploadResult.importados, rejected: uploadResult.rejeitados }) || `Importados: ${uploadResult.importados} • Rejeitados: ${uploadResult.rejeitados}`}</div>
                    {uploadResult.erros && uploadResult.erros.length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-slate-600">{t('view_errors') || 'Ver erros'}</summary>
                        <ul className="mt-2 max-h-40 overflow-y-auto text-xs list-disc pl-5">
                          {uploadResult.erros.slice(0, 50).map((e, idx) => (
                            <li key={idx}>{e}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </section>
  );
}