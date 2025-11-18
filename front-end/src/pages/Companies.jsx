import React from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Pencil, Trash2, Plus, Save, FileDown, FileText, Printer } from 'lucide-react';
import { getCompanies, createCompany, updateCompany, deleteCompany } from '../apiClient';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import { Tabs, TabPanel } from '../components/ui/Tabs';

export default function CompaniesPage() {
  const { t } = useTranslation();
  const [companies, setCompanies] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [query, setQuery] = React.useState('');
  const [editingId, setEditingId] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState('company');
  const [errors, setErrors] = React.useState({});

  const [form, setForm] = React.useState({
    name: '',
    cnpj: '',
    branch_type: 'Matriz',
    street: '',
    district: '',
    city: '',
    state: '',
    cep: '',
    phone: '',
    email: '',
    division: '',
    state_registration: '',
    status: 'Ativo',
  });

  const load = React.useCallback(() => {
    setLoading(true);
    setError(null);
    getCompanies()
      .then((data) => setCompanies(data))
      .catch((err) => setError(err.message || 'Error'))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: '', cnpj: '', branch_type: 'Matriz', street: '', district: '', city: '', state: '',
      cep: '', phone: '', email: '', division: '', state_registration: '', status: 'Ativo',
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
    if (!form.name) next.name = t('field_required');
    const cleanCnpj = (form.cnpj || '').replace(/\D/g, '');
    if (!cleanCnpj) next.cnpj = t('field_required');
    else if (cleanCnpj.length !== 14) next.cnpj = t('invalid_cnpj');
    return next;
  };

  const onSave = async () => {
    try {
      const v = validate();
      setErrors(v);
      if (Object.keys(v).length) { toast.error(t('required_fields')); return; }
      if (editingId) {
        await updateCompany(editingId, form);
        toast.success(t('updated_successfully'));
      } else {
        await createCompany(form);
        toast.success(t('created_successfully'));
      }
      resetForm();
      load();
    } catch (err) {
      toast.error(err.message || t('backend_error'));
    }
  };

  const onNew = () => { resetForm(); toast(t('new_record')); };

  const onEdit = (c) => {
    setEditingId(c.id);
    setForm({
      name: c.name || '', cnpj: c.cnpj || '', branch_type: c.branch_type || 'Matriz', street: c.street || '',
      district: c.district || '', city: c.city || '', state: c.state || '', cep: c.cep || '', phone: c.phone || '',
      email: c.email || '', division: c.division || '', state_registration: c.state_registration || '', status: c.status || 'Ativo',
    });
    setErrors({});
  };

  const onDelete = async (id) => {
    try {
      await deleteCompany(id);
      toast.success(t('deleted_successfully'));
      if (editingId === id) resetForm();
      load();
    } catch (err) {
      toast.error(err.message || t('backend_error'));
    }
  };

  const filtered = companies.filter((c) => (
    (c.name && c.name.toLowerCase().includes(query.toLowerCase())) ||
    (c.cnpj && c.cnpj.replace(/\D/g, '').includes(query.replace(/\D/g, '')))
  ));

  // Lista sem paginação: layout em cards, semelhante a Colaboradores

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{t('companies_title')}</h2>
        <div className="flex items-center gap-2">
          <Button variant="secondary" title={t('new')} aria-label={t('new')} onClick={onNew} className="px-2 py-2"><Plus size={18} /> {t('new')}</Button>
          <Button variant="primary" title={t('save')} aria-label={t('save')} onClick={onSave} className="px-2 py-2"><Save size={18} /> {t('save')}</Button>
          <Button variant="secondary" title={t('edit')} aria-label={t('edit')} disabled={!editingId} onClick={() => editingId && onEdit(companies.find((x) => x.id === editingId))} className="px-2 py-2"><Pencil size={18} /></Button>
          <Button variant="danger" title={t('delete')} aria-label={t('delete')} disabled={!editingId} onClick={() => editingId && onDelete(editingId)} className="px-2 py-2"><Trash2 size={18} /></Button>
          <Button variant="secondary" title={t('print')} aria-label={t('print')} onClick={() => window.print()} className="px-2 py-2"><Printer size={18} /></Button>
          <Button variant="secondary" title={t('export_pdf')} aria-label={t('export_pdf')} onClick={() => toast(t('export_pdf'))} className="px-2 py-2"><img src="/Pdf.svg" alt="PDF" className="h-5 w-5" /></Button>
          <Button variant="secondary" title={t('export_excel')} aria-label={t('export_excel')} onClick={() => toast(t('export_excel'))} className="px-2 py-2"><img src="/Excel.svg" alt="Excel" className="h-5 w-5" /></Button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 hidden">
        <Button onClick={onNew}><Plus size={16} /> {t('new')}</Button>
        <Button onClick={onSave}><Save size={16} /> {t('save')}</Button>
        <Button variant="secondary" disabled={!editingId} onClick={() => editingId && onEdit(companies.find((x) => x.id === editingId))}>{t('edit')}</Button>
        <Button variant="danger" disabled={!editingId} onClick={() => editingId && onDelete(editingId)}>{t('delete')}</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <Tabs
            value={activeTab}
            onChange={setActiveTab}
            items={[
              { value: 'company', label: t('company_tab') || 'Empresa' },
              { value: 'contact', label: t('contact_tab') || 'Contato/Endereço' },
            ]}
          />

          <TabPanel active={activeTab === 'company'}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input label={t('company_name')} name="name" value={form.name} onChange={onChange} error={errors.name} />
              <Input label={t('company_cnpj')} name="cnpj" value={form.cnpj} onChange={onChange} error={errors.cnpj} />
              <Select label={t('branch_type')} name="branch_type" value={form.branch_type} onChange={onChange}>
                <option value="Matriz">{t('branch_matrix')}</option>
                <option value="Filial">{t('branch_branch')}</option>
              </Select>
              <Select label={t('status')} name="status" value={form.status} onChange={onChange}>
                <option value="Ativo">{t('status_active')}</option>
                <option value="Inativo">{t('status_inactive')}</option>
              </Select>
              <Input label={t('division')} name="division" value={form.division} onChange={onChange} />
              <Input label={t('state_registration')} name="state_registration" value={form.state_registration} onChange={onChange} />
            </div>
          </TabPanel>

          <TabPanel active={activeTab === 'contact'}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input label={t('street')} name="street" value={form.street} onChange={onChange} />
              <Input label={t('district')} name="district" value={form.district} onChange={onChange} />
              <Input label={t('city')} name="city" value={form.city} onChange={onChange} />
              <Input label={t('state')} name="state" value={form.state} onChange={onChange} />
              <Input label={t('cep')} name="cep" value={form.cep} onChange={onChange} />
              <Input label={t('phone')} name="phone" value={form.phone} onChange={onChange} />
              <Input label={t('email')} name="email" value={form.email} onChange={onChange} />
            </div>
          </TabPanel>
        </div>

        <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <input className="px-3 py-2 rounded-md border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 flex-1" placeholder={t('search_placeholder')} value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>

          {loading && <p className="text-slate-500">{t('backend_checking')}</p>}
          {error && <p className="text-red-600">{t('backend_error')}</p>}
          {!loading && !error && (
            filtered.length === 0 ? (
              <p className="text-slate-500">{t('companies_empty')}</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-[65vh] overflow-y-auto pr-1">
                {filtered.map((c) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl bg-gray-50 dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{c.name}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-300">
                          {c.cnpj ? `CNPJ: ${c.cnpj}` : '—'}{c.state ? ` • ${c.state}` : ''}{c.city ? ` • ${c.city}` : ''}
                        </div>
                        {c.division && (
                          <div className="text-sm text-slate-600 dark:text-slate-300">{c.division}</div>
                        )}
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
            )
          )}
        </div>
      </div>
    </section>
  );
}