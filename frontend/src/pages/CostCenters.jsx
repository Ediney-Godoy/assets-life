import React from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Plus, Save, Pencil, Trash2, Printer, FileText, FileDown, Search, X } from 'lucide-react';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import { Tabs, TabPanel } from '../components/ui/Tabs';
import {
  getCostCenters,
  createCostCenter,
  getCompanies,
  getManagementUnits,
  getEmployees,
} from '../apiClient';

export default function CostCentersPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [companies, setCompanies] = React.useState([]);
  const [ugs, setUgs] = React.useState([]);
  const [employees, setEmployees] = React.useState([]);
  const [centers, setCenters] = React.useState([]);

  const [activeTab, setActiveTab] = React.useState('cc');
  const [editingId, setEditingId] = React.useState(null);
  const [query, setQuery] = React.useState('');
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  const [filters, setFilters] = React.useState({ empresa_id: '', ug_id: '', status: '' });

  const [form, setForm] = React.useState({
    nome: '',
    empresa_id: '',
    ug_id: '',
    responsavel_id: '',
    observacoes: '',
    status: 'Ativo',
  });
  const [errors, setErrors] = React.useState({});

  // Estados de busca com modal
  const [companyModalOpen, setCompanyModalOpen] = React.useState(false);
  const [companySearch, setCompanySearch] = React.useState('');
  const [ugModalOpen, setUgModalOpen] = React.useState(false);
  const [ugQuery, setUgQuery] = React.useState('');
  const [respModalOpen, setRespModalOpen] = React.useState(false);
  const [respQuery, setRespQuery] = React.useState('');

  // Selecionados para exibição
  const selectedCompany = companies.find((c) => c.id === Number(form.empresa_id));
  const selectedUG = ugs.find((u) => u.id === Number(form.ug_id));
  const selectedResponsavel = employees.find((e) => e.id === Number(form.responsavel_id));

  // Listas filtradas
  const modalFilteredCompanies = React.useMemo(() => {
    const q = (companySearch || '').trim().toLowerCase();
    let list = companies || [];
    if (!q) return list.slice(0, 100);
    return list
      .filter((c) => String(c.name || '').toLowerCase().includes(q) || String(c.cnpj || '').toLowerCase().includes(q))
      .slice(0, 100);
  }, [companySearch, companies]);

  const modalFilteredUgs = React.useMemo(() => {
    const q = (ugQuery || '').trim().toLowerCase();
    let list = ugs || [];
    if (form.empresa_id) list = list.filter((u) => String(u.empresa_id) === String(form.empresa_id));
    if (!q) return list.slice(0, 100);
    return list
      .filter((u) => (String(u.codigo || '').toLowerCase().includes(q) || String(u.nome || '').toLowerCase().includes(q)))
      .slice(0, 100);
  }, [ugQuery, ugs, form.empresa_id]);

  const modalFilteredEmployees = React.useMemo(() => {
    const q = (respQuery || '').trim().toLowerCase();
    let list = employees || [];
    if (!q) return list.slice(0, 100);
    return list
      .filter((e) => (String(e.full_name || e.nome_completo || '').toLowerCase().includes(q) || String(e.email_corporativo || '').toLowerCase().includes(q)))
      .slice(0, 100);
  }, [respQuery, employees]);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      getCompanies(),
      getManagementUnits(),
      getEmployees(),
      getCostCenters(filters),
    ])
      .then(([cData, ugData, eData, ccData]) => {
        setCompanies(cData || []);
        setUgs(ugData || []);
        setEmployees(eData || []);
        setCenters(ccData || []);
      })
      .catch((err) => setError(err.message || 'Erro'))
      .finally(() => setLoading(false));
  }, [filters]);

  React.useEffect(() => { load(); }, [load]);

  const onNew = () => {
    setEditingId(null);
    setForm({ nome: '', empresa_id: '', ug_id: '', responsavel_id: '', observacoes: '', status: 'Ativo' });
    setErrors({});
  };

  const onEdit = (row) => {
    setEditingId(row.id);
    setForm({
      nome: row.nome || '',
      empresa_id: row.empresa_id || '',
      ug_id: row.ug_id || '',
      responsavel_id: row.responsavel_id || '',
      observacoes: row.observacoes || '',
      status: row.status || 'Ativo',
    });
    setActiveTab('cc');
  };

  const onDelete = (id) => {
    // Exclusão física não implementada nesse módulo
    toast('Exclusão não disponível. Verificar vínculos antes.');
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((err) => ({ ...err, [name]: '' }));

    // Reset UG quando mudar empresa
    if (name === 'empresa_id') {
      setForm((f) => ({ ...f, ug_id: '' }));
    }
  };

  const validate = () => {
    const next = {};
    if (!form.nome?.trim()) next.nome = t('required') || 'Obrigatório';
    if (!form.empresa_id) next.empresa_id = t('required') || 'Obrigatório';
    if (!form.ug_id) next.ug_id = t('required') || 'Obrigatório';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSave = async () => {
    if (!validate()) {
      toast.error(t('required_fields') || 'Preencha os campos obrigatórios');
      return;
    }
    try {
      const payload = {
        nome: form.nome.trim(),
        empresa_id: Number(form.empresa_id),
        ug_id: Number(form.ug_id),
        responsavel_id: form.responsavel_id ? Number(form.responsavel_id) : null,
        observacoes: form.observacoes || '',
        status: form.status || 'Ativo',
      };
      const created = await createCostCenter(payload);
      toast.success(`Centro de Custos criado: ${created.codigo}`);
      setEditingId(created.id);
      setForm((f) => ({ ...f, codigo: created.codigo }));
      setFilters((flt) => ({ ...flt })); // força reload sem alterar filtros
      load();
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar');
    }
  };

  const filtered = centers.filter((c) => {
    const byQuery = query.trim() === '' ||
      (c.nome && c.nome.toLowerCase().includes(query.toLowerCase())) ||
      (c.codigo && c.codigo.toLowerCase().includes(query.toLowerCase()));
    const byEmpresa = !filters.empresa_id || c.empresa_id === Number(filters.empresa_id);
    const byUg = !filters.ug_id || c.ug_id === Number(filters.ug_id);
    const byStatus = !filters.status || c.status === filters.status;
    return byQuery && byEmpresa && byUg && byStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const columns = [
    { key: 'codigo', header: 'Código' },
    { key: 'nome', header: 'Nome' },
    { key: 'empresa', header: 'Empresa', render: (_, row) => (companies.find((c) => c.id === row.empresa_id)?.name || '—') },
    { key: 'ug', header: 'UG', render: (_, row) => (ugs.find((g) => g.id === row.ug_id)?.codigo || '—') },
    { key: 'responsavel', header: 'Responsável', render: (_, row) => (employees.find((e) => e.id === row.responsavel_id)?.nome_completo || '—') },
    { key: 'status', header: t('status') },
    { key: 'actions', header: t('actions'), render: (_, row) => (
      <div className="flex items-center gap-2">
        <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title={t('edit')} onClick={() => onEdit(row)}>
          <Pencil size={16} className="text-slate-600 dark:text-slate-300" />
        </button>
        <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title={t('delete')} onClick={() => onDelete(row.id)}>
          <Trash2 size={16} className="text-red-600" />
        </button>
      </div>
    ) },
  ];

  const ugsByCompany = React.useMemo(() => (
    form.empresa_id ? ugs.filter((g) => g.empresa_id === Number(form.empresa_id)) : []
  ), [form.empresa_id, ugs]);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{t('cost_centers_title') || 'Centros de Custos'}</h2>
        <div className="flex items-center gap-2">
          <Button variant="secondary" title={t('new')} aria-label={t('new')} onClick={onNew} className="px-2 py-2"><Plus size={18} /></Button>
          <Button variant="primary" title={t('save')} aria-label={t('save')} onClick={onSave} className="px-2 py-2 bg-blue-600 text-white hover:bg-blue-500"><Save size={18} /></Button>
          <Button variant="secondary" title={t('edit')} aria-label={t('edit')} disabled={!editingId} onClick={() => editingId && onEdit(centers.find((x) => x.id === editingId))} className="px-2 py-2"><Pencil size={18} /></Button>
          <Button variant="danger" title={t('delete')} aria-label={t('delete')} disabled={!editingId} onClick={() => editingId && onDelete(editingId)} className="px-2 py-2"><Trash2 size={18} /></Button>
          <Button variant="secondary" title={t('print')} aria-label={t('print')} onClick={() => window.print()} className="px-2 py-2"><Printer size={18} /></Button>
          <Button variant="secondary" title={t('export_pdf')} aria-label={t('export_pdf')} onClick={() => toast(t('export_pdf'))} className="px-2 py-2"><FileText size={18} /></Button>
          <Button variant="secondary" title={t('export_excel')} aria-label={t('export_excel')} onClick={() => toast(t('export_excel'))} className="px-2 py-2"><FileDown size={18} /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <Tabs
             value={activeTab}
             onChange={setActiveTab}
             items={[
               { value: 'cc', label: t('cost_center_tab') || 'Centro de Custo' },
             ]}
           />

          <TabPanel active={activeTab === 'cc'}>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
               {/* Empresa com busca */}
               <div className="flex items-end gap-2">
                 <div className="flex-1">
                   <Input className="w-full" label={t('company') || 'Empresa'} name="empresa_nome" value={selectedCompany ? selectedCompany.name : ''} onChange={() => {}} error={errors.empresa_id} disabled />
                 </div>
                 <Button variant="secondary" onClick={() => setCompanyModalOpen(true)} title={t('open') || 'Abrir'} aria-label={t('open')} className="p-0 h-10 w-10 justify-center"><Search size={18} /></Button>
               </div>

               {/* UG com busca */}
               <div className="flex items-end gap-2">
                 <div className="flex-1">
                   <Input className="w-full" label={t('ug') || 'UG'} name="ug_nome" value={selectedUG ? `${selectedUG.codigo} - ${selectedUG.nome}` : ''} onChange={() => {}} error={errors.ug_id} disabled />
                 </div>
                 <Button variant="secondary" onClick={() => setUgModalOpen(true)} disabled={!form.empresa_id} title={t('open') || 'Abrir'} aria-label={t('open')} className="p-0 h-10 w-10 justify-center"><Search size={18} /></Button>
               </div>

               <Input label={t('name') || 'Nome'} name="nome" value={form.nome} onChange={onChange} error={errors.nome} />

               {/* Responsável com busca */}
               <div className="flex items-end gap-2">
                 <div className="flex-1">
                   <Input className="w-full" label={t('responsible') || 'Responsável'} name="responsavel_nome" value={selectedResponsavel ? (selectedResponsavel.full_name || selectedResponsavel.nome_completo) : ''} onChange={() => {}} disabled />
                 </div>
                 <Button variant="secondary" onClick={() => setRespModalOpen(true)} title={t('open') || 'Abrir'} aria-label={t('open')} className="p-0 h-10 w-10 justify-center"><Search size={18} /></Button>
               </div>

               {/* Observações na mesma aba */}
               <Input label={t('observations') || 'Observações'} name="observacoes" value={form.observacoes} onChange={onChange} multiline rows={5} />

               <Select label={t('status')} name="status" value={form.status} onChange={onChange}>
                 <option value="Ativo">{t('status_active') || 'Ativo'}</option>
                 <option value="Inativo">{t('status_inactive') || 'Inativo'}</option>
               </Select>
             </div>
           </TabPanel>


        </div>

        <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-2 flex-1">
              <Search size={16} className="text-slate-600 dark:text-slate-300" />
              <input
                className="px-3 py-2 rounded-md border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
                placeholder={t('search_placeholder') || 'Pesquisar por Código ou Nome'}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Select label={t('company') || 'Empresa'} name="empresaFiltro" value={filters.empresa_id} onChange={(e) => setFilters((f) => ({ ...f, empresa_id: e.target.value }))}>
              <option value="">Todas</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
            <Select label={t('ug') || 'UG'} name="ugFiltro" value={filters.ug_id} onChange={(e) => setFilters((f) => ({ ...f, ug_id: e.target.value }))}>
              <option value="">Todas</option>
              {ugs.filter((g) => !filters.empresa_id || g.empresa_id === Number(filters.empresa_id)).map((g) => (
                <option key={g.id} value={g.id}>{g.codigo}</option>
              ))}
            </Select>
            <Select label={t('status')} name="statusFiltro" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
              <option value="">Todos</option>
              <option value="Ativo">{t('status_active') || 'Ativo'}</option>
              <option value="Inativo">{t('status_inactive') || 'Inativo'}</option>
            </Select>
            <Button variant="secondary" onClick={() => load()}>{t('open') || 'Abrir'}</Button>
          </div>

          {loading && <p className="text-slate-500">{t('backend_checking') || 'Checando backend...'}</p>}
          {error && <p className="text-red-600">{t('backend_error') || 'Erro'}</p>}
          {!loading && !error && (
            filtered.length === 0 ? (
              <p className="text-slate-500">Nenhum centro de custos encontrado.</p>
            ) : (
              <>
                {/* Lista em cards, seguindo o padrão de Empresas */}
                <div className="flex flex-col gap-2 max-h-[65vh] overflow-y-auto pr-1">
                  {pageData.map((c) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl bg-gray-50 dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">{c.codigo} • {c.nome}</div>
                          <div className="text-sm text-slate-600 dark:text-slate-300 truncate">
                            {(companies.find((co) => co.id === c.empresa_id)?.name) || '—'}
                            {` • UG: ${(ugs.find((u) => u.id === c.ug_id)?.codigo) || '—'}`}
                            {` • Resp.: ${(employees.find((e) => e.id === c.responsavel_id)?.nome_completo) || '—'}`}
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs ${String(c.status || '').toLowerCase() === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'}`}>{c.status || '—'}</div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <button className="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title={t('edit')} onClick={() => onEdit(c)}>
                          <Pencil size={16} className="text-slate-600 dark:text-slate-300" />
                        </button>
                        <button className="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title={t('delete')} onClick={() => onDelete(c.id)}>
                          <Trash2 size={16} className="text-red-600" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Paginação e contagem mantidas */}
                <div className="flex items-center justify-between mt-3">
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    {t('showing') || 'Exibindo'} {pageData.length} {t('of') || 'de'} {filtered.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
                    <span className="text-sm text-slate-700 dark:text-slate-200">{page} / {totalPages}</span>
                    <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
                  </div>
                </div>
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
                <div className="font-semibold text-slate-900 dark:text-slate-100">Buscar Empresa</div>
                <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-900" onClick={() => setCompanyModalOpen(false)}><X size={18} /></button>
              </div>
              <div className="p-4">
                <Input label="Pesquisar" name="companySearch" value={companySearch} onChange={(e) => setCompanySearch(e.target.value)} />
                <div className="mt-3 max-h-64 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800">
                  {modalFilteredCompanies.length === 0 ? (
                    <div className="text-slate-500">Nenhuma empresa encontrada.</div>
                  ) : (
                    <>
                      {modalFilteredCompanies.map((c) => (
                        <button key={c.id} className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900" onClick={() => {
                          setForm((f) => ({ ...f, empresa_id: c.id, ug_id: '' }));
                          setErrors((prev) => ({ ...prev, empresa_id: '' }));
                          setCompanyModalOpen(false);
                        }}>
                          <div className="font-medium">{c.name}</div>
                          {c.cnpj ? <div className="text-xs text-slate-500">{c.cnpj}</div> : null}
                        </button>
                      ))}
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
                <div className="font-semibold text-slate-900 dark:text-slate-100">Buscar UG</div>
                <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-900" onClick={() => setUgModalOpen(false)}><X size={18} /></button>
              </div>
              <div className="p-4">
                <Input label="Pesquisar" name="ugSearch" value={ugQuery} onChange={(e) => setUgQuery(e.target.value)} />
                <div className="mt-3 max-h-64 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800">
                  {modalFilteredUgs.length === 0 ? (
                    <div className="text-slate-500">Nenhuma UG encontrada.</div>
                  ) : (
                    <>
                      {modalFilteredUgs.map((u) => (
                        <button key={u.id} className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900" onClick={() => {
                          setForm((f) => ({ ...f, ug_id: u.id }));
                          setErrors((prev) => ({ ...prev, ug_id: '' }));
                          setUgModalOpen(false);
                        }}>
                          <div className="font-medium">{u.codigo} - {u.nome}</div>
                        </button>
                      ))}
                    </>
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
                <div className="font-semibold text-slate-900 dark:text-slate-100">Buscar Responsável</div>
                <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-900" onClick={() => setRespModalOpen(false)}><X size={18} /></button>
              </div>
              <div className="p-4">
                <Input label="Pesquisar" name="respSearch" value={respQuery} onChange={(e) => setRespQuery(e.target.value)} />
                <div className="mt-3 max-h-64 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800">
                  {modalFilteredEmployees.length === 0 ? (
                    <div className="text-slate-500">Nenhum responsável encontrado.</div>
                  ) : (
                    <>
                      {modalFilteredEmployees.map((e) => (
                        <button key={e.id} className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900" onClick={() => {
                          setForm((f) => ({ ...f, responsavel_id: e.id }));
                          setRespModalOpen(false);
                        }}>
                          <div className="font-medium">{e.full_name || e.nome_completo}</div>
                          {e.email_corporativo ? <div className="text-xs text-slate-500">{e.email_corporativo}</div> : null}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

    </section>
  );
}