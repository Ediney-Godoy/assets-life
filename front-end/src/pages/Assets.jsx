import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { 
  getClassesContabeis, 
  getManagementUnits, 
  getCostCenters,
  getAssets,
  createAsset,
  updateAsset,
  deleteAsset
} from '../apiClient';

export default function AssetsPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Reference data
  const [classes, setClasses] = useState([]);
  const [ugs, setUgs] = useState([]);
  const [costCenters, setCostCenters] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    numero_imobilizado: '',
    descricao: '',
    data_aquisicao: '',
    valor_aquisicao: '',
    classe_id: '',
    centro_custo_id: '',
    ug_id: '',
    vida_util_anos: '',
    taxa_depreciacao: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const empresaId = localStorage.getItem('assetlife_empresa');
      
      const [assetsData, classesData, ugsData, ccsData] = await Promise.all([
        getAssets({ empresa_id: empresaId }),
        getClassesContabeis({ empresa_id: empresaId, status: 'Ativo' }),
        getManagementUnits(empresaId),
        getCostCenters({ empresa_id: empresaId })
      ]);

      setItems(Array.isArray(assetsData) ? assetsData : []);
      setClasses(Array.isArray(classesData) ? classesData : []);
      setUgs(Array.isArray(ugsData) ? ugsData : []);
      setCostCenters(Array.isArray(ccsData) ? ccsData : []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error(t('error_loading_data') || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleClassChange = (e) => {
    const classId = e.target.value;
    const selectedClass = classes.find(c => String(c.id) === String(classId));
    
    setFormData(prev => ({
      ...prev,
      classe_id: classId,
      // Auto-fill logic based on selected accounting class
      vida_util_anos: selectedClass ? selectedClass.vida_util_anos : '',
      taxa_depreciacao: selectedClass ? selectedClass.taxa_depreciacao : ''
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      numero_imobilizado: item.numero,
      descricao: item.descricao,
      data_aquisicao: item.data_aquisicao ? item.data_aquisicao.split('T')[0] : '',
      valor_aquisicao: item.valor_aquisicao,
      classe_id: item.classe_id,
      centro_custo_id: item.centro_custo_id,
      ug_id: item.ug_id,
      vida_util_anos: item.vida_util_anos,
      taxa_depreciacao: item.taxa_depreciacao
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirm_delete') || 'Tem certeza que deseja excluir?')) return;
    try {
      await deleteAsset(id);
      toast.success(t('asset_deleted_success') || 'Ativo excluído com sucesso');
      loadData();
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast.error(t('error_deleting') || 'Erro ao excluir ativo');
    }
  };

  const openNewModal = () => {
    setEditingId(null);
    setFormData({
      numero_imobilizado: '',
      descricao: '',
      data_aquisicao: '',
      valor_aquisicao: '',
      classe_id: '',
      centro_custo_id: '',
      ug_id: '',
      vida_util_anos: '',
      taxa_depreciacao: ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const empresaId = localStorage.getItem('assetlife_empresa');
      
      const payload = {
        numero: formData.numero_imobilizado,
        sub_numero: "0", // Default
        descricao: formData.descricao,
        data_aquisicao: formData.data_aquisicao,
        valor_aquisicao: parseFloat(formData.valor_aquisicao) || 0,
        empresa_id: parseInt(empresaId) || null,
        ug_id: formData.ug_id ? parseInt(formData.ug_id) : null,
        centro_custo_id: formData.centro_custo_id ? parseInt(formData.centro_custo_id) : null,
        classe_id: formData.classe_id ? parseInt(formData.classe_id) : null,
        vida_util_anos: formData.vida_util_anos ? parseInt(formData.vida_util_anos) : null,
        taxa_depreciacao: formData.taxa_depreciacao ? parseFloat(formData.taxa_depreciacao) : null
      };

      if (editingId) {
        await updateAsset(editingId, payload);
        toast.success(t('asset_updated_success') || 'Ativo atualizado com sucesso');
      } else {
        await createAsset(payload);
        toast.success(t('asset_created_success') || 'Ativo criado com sucesso');
      }
      
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Error saving asset:', error);
      toast.error(t('error_saving') || 'Erro ao salvar: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t('nav_assets') || 'Ativos'}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {t('assets_management_subtitle') || 'Gerenciamento de Ativos Imobilizados'}
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          {t('new_asset') || 'Novo Ativo'}
        </button>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Carregando...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            {t('no_assets_found') || 'Nenhum ativo encontrado.'}
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 uppercase font-medium">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">{t('description') || 'Descrição'}</th>
                <th className="px-4 py-3">{t('acquisition_value') || 'Valor Aquisição'}</th>
                <th className="px-4 py-3">{t('accounting_class') || 'Classe Contábil'}</th>
                <th className="px-4 py-3 text-right">{t('actions') || 'Ações'}</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-b border-slate-100 dark:border-slate-700">
                  <td className="px-4 py-3">{item.numero}</td>
                  <td className="px-4 py-3">{item.descricao}</td>
                  <td className="px-4 py-3">
                    {Number(item.valor_aquisicao).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="px-4 py-3">{item.classe_name || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded dark:hover:bg-blue-900/20 transition-colors"
                        title={t('edit') || 'Editar'}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded dark:hover:bg-red-900/20 transition-colors"
                        title={t('delete') || 'Excluir'}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editingId ? (t('edit_asset') || 'Editar Ativo') : (t('new_asset') || 'Novo Ativo')}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Identification */}
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('asset_number') || 'Número do Ativo'}
                  </label>
                  <input
                    type="text"
                    name="numero_imobilizado"
                    value={formData.numero_imobilizado}
                    onChange={handleChange}
                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    required
                  />
                </div>
                
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('acquisition_date') || 'Data de Aquisição'}
                  </label>
                  <input
                    type="date"
                    name="data_aquisicao"
                    value={formData.data_aquisicao}
                    onChange={handleChange}
                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('description') || 'Descrição'}
                  </label>
                  <input
                    type="text"
                    name="descricao"
                    value={formData.descricao}
                    onChange={handleChange}
                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    required
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('acquisition_value') || 'Valor de Aquisição'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="valor_aquisicao"
                    value={formData.valor_aquisicao}
                    onChange={handleChange}
                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    required
                  />
                </div>

                {/* Accounting Class - The Core Logic */}
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('accounting_class') || 'Classe Contábil'}
                  </label>
                  <select
                    name="classe_id"
                    value={formData.classe_id}
                    onChange={handleClassChange}
                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    required
                  >
                    <option value="">{t('select') || 'Selecione...'}</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.codigo} - {c.descricao}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Auto-filled fields */}
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('std_lifespan') || 'Vida Útil Padrão (Anos)'}
                  </label>
                  <input
                    type="number"
                    name="vida_util_anos"
                    value={formData.vida_util_anos}
                    readOnly
                    className="w-full rounded-lg border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 cursor-not-allowed"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('std_depreciation') || 'Taxa Depreciação (%)'}
                  </label>
                  <input
                    type="number"
                    name="taxa_depreciacao"
                    value={formData.taxa_depreciacao}
                    readOnly
                    className="w-full rounded-lg border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 cursor-not-allowed"
                  />
                </div>

                {/* Other References */}
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('cost_center') || 'Centro de Custo'}
                  </label>
                  <select
                    name="centro_custo_id"
                    value={formData.centro_custo_id}
                    onChange={handleChange}
                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  >
                    <option value="">{t('select') || 'Selecione...'}</option>
                    {costCenters.map(cc => (
                      <option key={cc.id} value={cc.id}>
                        {cc.codigo} - {cc.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('management_unit') || 'Unidade Gerencial'}
                  </label>
                  <select
                    name="ug_id"
                    value={formData.ug_id}
                    onChange={handleChange}
                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  >
                    <option value="">{t('select') || 'Selecione...'}</option>
                    {ugs.map(ug => (
                      <option key={ug.id} value={ug.id}>
                        {ug.codigo} - {ug.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  {t('cancel') || 'Cancelar'}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? (t('saving') || 'Salvando...') : (t('save') || 'Salvar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}