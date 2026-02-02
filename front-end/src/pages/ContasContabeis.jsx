import React from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Pencil, Plus, Save, Trash2, Search, X } from 'lucide-react';
import { getContasContabeis, createContaContabil, updateContaContabil, deleteContaContabil, getCompanies } from '../apiClient';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import ActionToolbar from '../components/ActionToolbar';

export default function ContasContabeisPage() {
  const { t } = useTranslation();
  const [items, setItems] = React.useState([]);
  const [companies, setCompanies] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [query, setQuery] = React.useState('');
  const [editingId, setEditingId] = React.useState(null);
  const [errors, setErrors] = React.useState({});
  
  // Empresa com modal de busca
  const [companyModalOpen, setCompanyModalOpen] = React.useState(false);
  const [companySearch, setCompanySearch] = React.useState('');

  const [form, setForm] = React.useState({
    codigo: '',
    descricao: '',
    status: 'Ativo',
    empresa_id: '',
  });

  const load = React.useCallback(() => {
    setLoading(true);
    setError(null);
    const empresaId = localStorage.getItem('assetlife_empresa');
    
    Promise.all([
      getContasContabeis(empresaId ? { empresa_id: empresaId } : {}),
      getCompanies()
    ])
      .then(([data, companiesData]) => {
        setItems(data || []);
        setCompanies(companiesData || []);
        // Se houver empresa selecionada no contexto, preenche o form se for novo
        if (empresaId && !editingId) {
             setForm(prev => ({ ...prev, empresa_id: empresaId }));
        }
      })
      .catch((err) => setError(err.message || 'Error'))
      .finally(() => setLoading(false));
  }, [editingId]);

  React.useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    const empresaId = localStorage.getItem('assetlife_empresa');
    setEditingId(null);
    setForm({
      codigo: '',
      descricao: '',
      status: 'Ativo',
      empresa_id: empresaId || '',
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
    if (!form.codigo) next.codigo = t('field_required') || 'Campo obrigatório';
    if (!form.descricao) next.descricao = t('field_required') || 'Campo obrigatório';
    return next;
  };

  const onSave = async () => {
    try {
      const v = validate();
      setErrors(v);
      if (Object.keys(v).length) { toast.error(t('required_fields') || 'Preencha os campos obrigatórios'); return; }

      const empresaId = localStorage.getItem('assetlife_empresa');
      const payload = {
        ...form,
        empresa_id: form.empresa_id ? parseInt(form.empresa_id) : parseInt(empresaId),
      };
      
      if (!payload.empresa_id) {
          toast.error(t('select_company_required') || 'Selecione uma empresa');
          return;
      }

      if (editingId) {
        await updateContaContabil(editingId, payload);
        toast.success(t('updated_successfully') || 'Atualizado com sucesso');
      } else {
        await createContaContabil(payload);
        toast.success(t('created_successfully') || 'Criado com sucesso');
      }
      resetForm();
      load();
    } catch (err) {
      toast.error(err.message || t('backend_error') || 'Erro no servidor');
    }
  };

  const onNew = () => { resetForm(); toast(t('new_record') || 'Novo registro'); };

  const onEdit = (item) => {
    setEditingId(item.id);
    setForm({
      codigo: item.codigo || '',
      descricao: item.descricao || '',
      status: item.status || 'Ativo',
      empresa_id: item.empresa_id ? String(item.empresa_id) : '',
    });
    setErrors({});
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
    setForm((f) => ({ ...f, empresa_id: String(c.id) }));
    setErrors((prev) => ({ ...prev, empresa_id: null }));
    setCompanyModalOpen(false);
  };
  
  const selectedCompany = React.useMemo(() => companies.find((c) => String(c.id) === String(form.empresa_id)), [companies, form.empresa_id]);

  const onDelete = async (id) => {
    if (!window.confirm(t('confirm_delete') || 'Tem certeza que deseja excluir?')) return;
    try {
      await deleteContaContabil(id);
      toast.success(t('deleted_successfully') || 'Excluído com sucesso');
      if (editingId === id) resetForm();
      load();
    } catch (err) {
      toast.error(err.message || t('backend_error') || 'Erro no servidor');
    }
  };

  const filtered = items.filter((item) => (
    (item.codigo && item.codigo.toLowerCase().includes(query.toLowerCase())) ||
    (item.descricao && item.descricao.toLowerCase().includes(query.toLowerCase()))
  ));

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{t('acc_accounts_title') || 'Contas Contábeis'}</h2>
        <ActionToolbar
          onNew={onNew}
          onSave={onSave}
          onEdit={() => editingId && onEdit(items.find((x) => x.id === editingId))}
          onDelete={() => editingId && onDelete(editingId)}
          canEditDelete={!!editingId}
        />
      </div>

      {companyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">{t('select_company') || 'Selecionar Empresa'}</h3>
              <button onClick={closeCompanySearch} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  autoFocus
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('search_company_placeholder') || 'Buscar empresa...'}
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-2">
              {modalFilteredCompanies.length === 0 ? (
                <p className="text-center text-slate-500 py-4">{t('no_results') || 'Nenhum resultado'}</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {modalFilteredCompanies.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => selectCompany(c)}
                      className="text-left px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex flex-col"
                    >
                      <span className="font-medium text-slate-900 dark:text-slate-100">{c.name}</span>
                      {c.cnpj && <span className="text-xs text-slate-500">{c.cnpj}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Form */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4 h-fit">
          <h3 className="text-lg font-medium mb-4 text-slate-900 dark:text-slate-100">
            {editingId ? (t('edit_record') || 'Editar Registro') : (t('new_record') || 'Novo Registro')}
          </h3>
          <div className="flex flex-col gap-3">
            <Input label={t('code') || 'Código'} name="codigo" value={form.codigo} onChange={onChange} error={errors.codigo} />
            <Input label={t('description') || 'Descrição'} name="descricao" value={form.descricao} onChange={onChange} error={errors.descricao} />
            
            <div className="grid grid-cols-[1fr_auto] items-end gap-2 min-w-0">
              <div className="min-w-0">
                <Input label={t('company') || "Empresa"} name="empresa_nome" value={selectedCompany ? selectedCompany.name : ''} onChange={() => {}} disabled error={errors.empresa_id} />
              </div>
              <Button variant="secondary" onClick={openCompanySearch} title={t('search_company') || "Pesquisar Empresa"} className="p-0 h-9 w-9 sm:h-10 sm:w-10 justify-center"><Search size={18} /></Button>
            </div>

            <Select label={t('status') || 'Status'} name="status" value={form.status} onChange={onChange}>
              <option value="Ativo">{t('status_active') || 'Ativo'}</option>
              <option value="Inativo">{t('status_inactive') || 'Inativo'}</option>
            </Select>
            
            {editingId && (
              <div className="mt-2 flex gap-2">
                <Button variant="secondary" onClick={resetForm} className="w-full">{t('cancel') || 'Cancelar'}</Button>
              </div>
            )}
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                className="w-full pl-10 pr-4 py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder={t('search_placeholder') || 'Buscar...'} 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
              />
            </div>
          </div>

          {loading && <p className="text-slate-500 text-center py-8">{t('loading') || 'Carregando...'}</p>}
          {error && <p className="text-red-600 text-center py-8">{error}</p>}
          
          {!loading && !error && (
            filtered.length === 0 ? (
              <p className="text-slate-500 text-center py-8">{t('no_records') || 'Nenhum registro encontrado.'}</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
                {filtered.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => onEdit(item)}
                    className={`cursor-pointer rounded-lg p-3 border transition-colors ${
                      editingId === item.id 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs font-mono">{item.codigo}</span>
                          {item.descricao}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${item.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                          {item.status}
                        </span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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
