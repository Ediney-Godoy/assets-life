import React from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Pencil, Plus, Save, Trash2, Search } from 'lucide-react';
import { getClassesContabeis, createClasseContabil, updateClasseContabil, deleteClasseContabil } from '../apiClient';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import ActionToolbar from '../components/ActionToolbar';

export default function ClassesContabeisPage() {
  const { t } = useTranslation();
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [query, setQuery] = React.useState('');
  const [editingId, setEditingId] = React.useState(null);
  const [errors, setErrors] = React.useState({});

  const [form, setForm] = React.useState({
    codigo: '',
    descricao: '',
    vida_util_anos: '',
    taxa_depreciacao: '',
    status: 'Ativo',
  });

  const load = React.useCallback(() => {
    setLoading(true);
    setError(null);
    const empresaId = localStorage.getItem('assetlife_empresa');
    if (!empresaId) {
      setError(t('select_company_first') || 'Selecione uma empresa primeiro.');
      setLoading(false);
      return;
    }

    getClassesContabeis({ empresa_id: empresaId })
      .then((data) => setItems(data))
      .catch((err) => setError(err.message || 'Error'))
      .finally(() => setLoading(false));
  }, [t]);

  React.useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      codigo: '',
      descricao: '',
      vida_util_anos: '',
      taxa_depreciacao: '',
      status: 'Ativo',
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
        empresa_id: parseInt(empresaId),
        vida_util_anos: parseInt(form.vida_util_anos),
        taxa_depreciacao: parseFloat(form.taxa_depreciacao),
      };

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
      status: item.status || 'Ativo',
    });
    setErrors({});
  };

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Form */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4 h-fit">
          <h3 className="text-lg font-medium mb-4 text-slate-900 dark:text-slate-100">
            {editingId ? (t('edit_record') || 'Editar Registro') : (t('new_record') || 'Novo Registro')}
          </h3>
          <div className="flex flex-col gap-3">
            <Input label={t('code') || 'Código'} name="codigo" value={form.codigo} onChange={onChange} error={errors.codigo} />
            <Input label={t('description') || 'Descrição'} name="descricao" value={form.descricao} onChange={onChange} error={errors.descricao} />
            <div className="grid grid-cols-2 gap-2">
              <Input label={t('lifespan_years') || 'Vida Útil (Anos)'} name="vida_util_anos" type="number" value={form.vida_util_anos} onChange={onChange} error={errors.vida_util_anos} />
              <Input label={t('depreciation_rate') || 'Taxa Depr. (%)'} name="taxa_depreciacao" type="number" step="0.01" value={form.taxa_depreciacao} onChange={onChange} error={errors.taxa_depreciacao} />
            </div>
            <Select label={t('status') || 'Status'} name="status" value={form.status} onChange={onChange}>
              <option value="Ativo">{t('status_active') || 'Ativo'}</option>
              <option value="Inativo">{t('status_inactive') || 'Inativo'}</option>
            </Select>
            
            <div className="mt-2 flex gap-2">
              <Button onClick={onSave} className="flex-1"><Save size={16} /> {t('save') || 'Salvar'}</Button>
              {editingId && (
                <Button variant="secondary" onClick={resetForm}>{t('cancel') || 'Cancelar'}</Button>
              )}
            </div>
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
