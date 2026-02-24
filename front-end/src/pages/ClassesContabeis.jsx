import React from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Pencil, Plus, Save, Trash2, Search, X } from 'lucide-react';
import { getClassesContabeis, createClasseContabil, updateClasseContabil, deleteClasseContabil, getContasContabeis, getCompanies } from '../apiClient';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import ActionToolbar from '../components/ActionToolbar';

export default function ClassesContabeisPage() {
  const { t } = useTranslation();
  const [items, setItems] = React.useState([]);
  const [contas, setContas] = React.useState([]);
  const [companies, setCompanies] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [query, setQuery] = React.useState('');
  const [editingId, setEditingId] = React.useState(null);
  const [errors, setErrors] = React.useState({});
  
  // Empresa com modal de busca
  const [companyModalOpen, setCompanyModalOpen] = React.useState(false);
  const [companySearch, setCompanySearch] = React.useState('');

  // Conta Contábil com modal de busca
  const [contaModalOpen, setContaModalOpen] = React.useState(false);
  const [contaSearch, setContaSearch] = React.useState('');

  const [form, setForm] = React.useState({
    codigo: '',
    descricao: '',
    vida_util_anos: '',
    taxa_depreciacao: '',
    conta_contabil_id: '',
    status: 'Ativo',
    empresa_id: '',
  });

  const load = React.useCallback(() => {
    setLoading(true);
    setError(null);
    const empresaId = localStorage.getItem('assetlife_empresa');
    
    Promise.all([
      getClassesContabeis(empresaId ? { empresa_id: empresaId } : {}),
      getContasContabeis(empresaId ? { empresa_id: empresaId } : {}),
      getCompanies()
    ])
      .then(([data, contasData, companiesData]) => {
        setItems(data || []);
        setContas(contasData || []);
        setCompanies(companiesData || []);
        // Se houver empresa selecionada no contexto, preenche o form se for novo
        if (empresaId && !editingId) {
             setForm(prev => ({ ...prev, empresa_id: empresaId }));
        }
      })
      .catch((err) => {
        console.error('Error loading data:', err);
        setError(err.message || 'Error');
      })
      .finally(() => setLoading(false));
  }, [editingId]);

  React.useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    const empresaId = localStorage.getItem('assetlife_empresa');
    setEditingId(null);
    setForm({
      codigo: '',
      descricao: '',
      vida_util_anos: '',
      taxa_depreciacao: '',
      conta_contabil_id: '',
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
    if (!form.vida_util_anos) next.vida_util_anos = t('field_required') || 'Campo obrigatório';
    if (!form.taxa_depreciacao) next.taxa_depreciacao = t('field_required') || 'Campo obrigatório';
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
        vida_util_anos: parseInt(form.vida_util_anos),
        taxa_depreciacao: parseFloat(form.taxa_depreciacao),
        conta_contabil_id: form.conta_contabil_id ? parseInt(form.conta_contabil_id) : null,
      };
      
      if (!payload.empresa_id) {
          toast.error(t('select_company_required') || 'Selecione uma empresa');
          return;
      }

      if (editingId) {
        await updateClasseContabil(editingId, payload);
        toast.success(t('updated_successfully') || 'Atualizado com sucesso');
      } else {
        await createClasseContabil(payload);
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
      vida_util_anos: item.vida_util_anos || '',
      taxa_depreciacao: item.taxa_depreciacao || '',
      conta_contabil_id: item.conta_contabil_id || '',
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

  // Busca de Conta Contábil (modal)
  const modalFilteredContas = React.useMemo(() => {
    const q = (contaSearch || '').trim().toLowerCase();
    let list = contas || [];
    if (!q) return list.slice(0, 100);
    return list
      .filter((c) => String(c.codigo || '').toLowerCase().includes(q) || String(c.descricao || '').toLowerCase().includes(q))
      .slice(0, 100);
  }, [contaSearch, contas]);
  const openContaSearch = () => { setContaModalOpen(true); setContaSearch(''); };
  const closeContaSearch = () => { setContaModalOpen(false); setContaSearch(''); };
  const selectConta = (c) => {
    setForm((f) => ({ ...f, conta_contabil_id: String(c.id) }));
    setErrors((prev) => ({ ...prev, conta_contabil_id: null }));
    setContaModalOpen(false);
  };
  const selectedConta = React.useMemo(() => contas.find((c) => String(c.id) === String(form.conta_contabil_id)), [contas, form.conta_contabil_id]);

  const onDelete = async (id) => {
    if (!window.confirm(t('confirm_delete') || 'Tem certeza que deseja excluir?')) return;
    try {
      await deleteClasseContabil(id);
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
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{t('acc_classes_title') || 'Classes Contábeis'}</h2>
        <ActionToolbar
          onNew={onNew}
          onSave={onSave}
          onEdit={() => editingId && onEdit(items.find((x) => x.id === editingId))}
          onDelete={() => editingId && onDelete(editingId)}
          canEditDelete={!!editingId}
        />
      </div>

      {/* Modals */}
      {companyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-semibold">{t('select_company') || 'Selecionar Empresa'}</h3>
              <button onClick={closeCompanySearch} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"><X size={20} /></button>
            </div>
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  autoFocus
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder={t('search_placeholder') || 'Buscar...'}
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-y-auto">
              {modalFilteredCompanies.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">{t('no_records') || 'Nenhum registro encontrado.'}</div>
              ) : (
                modalFilteredCompanies.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => selectCompany(c)}
                    className="w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className="font-medium text-sm">{c.name}</div>
                    {c.cnpj && <div className="text-xs text-slate-500 mt-0.5">{c.cnpj}</div>}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {contaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-semibold">{t('select_account') || 'Selecionar Conta'}</h3>
              <button onClick={closeContaSearch} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"><X size={20} /></button>
            </div>
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  autoFocus
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder={t('search_placeholder') || 'Buscar...'}
                  value={contaSearch}
                  onChange={(e) => setContaSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-y-auto">
              {modalFilteredContas.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">{t('no_records') || 'Nenhum registro encontrado.'}</div>
              ) : (
                modalFilteredContas.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => selectConta(c)}
                    className="w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className="font-medium text-sm flex gap-2">
                      <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 rounded text-xs py-0.5">{c.codigo}</span>
                      <span>{c.descricao}</span>
                    </div>
                  </button>
                ))
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

            <div className="grid grid-cols-[1fr_auto] items-end gap-2 min-w-0">
              <div className="min-w-0">
                <Input label={t('accounting_account') || "Conta Contábil"} name="conta_contabil_nome" value={selectedConta ? `${selectedConta.codigo} - ${selectedConta.descricao}` : ''} onChange={() => {}} disabled error={errors.conta_contabil_id} />
              </div>
              <Button variant="secondary" onClick={openContaSearch} title={t('search_account') || "Pesquisar Conta"} className="p-0 h-9 w-9 sm:h-10 sm:w-10 justify-center"><Search size={18} /></Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Input label={t('lifespan_years') || 'Vida Útil (Anos)'} name="vida_util_anos" type="number" value={form.vida_util_anos} onChange={onChange} error={errors.vida_util_anos} />
              <Input label={t('depreciation_rate') || 'Taxa Depr. (%)'} name="taxa_depreciacao" type="number" step="0.01" value={form.taxa_depreciacao} onChange={onChange} error={errors.taxa_depreciacao} />
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
                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          Vida Útil: {item.vida_util_anos} anos • Taxa: {item.taxa_depreciacao}%
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
