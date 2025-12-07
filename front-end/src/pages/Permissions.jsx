import React from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Plus, Save, Pencil, Search, Printer, Trash2 } from 'lucide-react';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import ActionToolbar from '../components/ActionToolbar';
import { Tabs, TabPanel } from '../components/ui/Tabs';
import {
  getPermissionGroups,
  getPermissionGroup,
  createPermissionGroup,
  updatePermissionGroup,
  deletePermissionGroup,
  getCompanies,
  getUsers,
  getTransactions,
  createTransaction,
  listGroupCompanies,
  addGroupCompany,
  removeGroupCompany,
  listGroupTransactions,
  addGroupTransaction,
  removeGroupTransaction,
  listGroupUsers,
  addGroupUser,
  removeGroupUser,
  clonePermissionGroup,
} from '../apiClient';

export default function PermissionsPage() {
  const { t } = useTranslation();

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [groups, setGroups] = React.useState([]);

  // form
  const [activeTab, setActiveTab] = React.useState('basic');
  const [editingId, setEditingId] = React.useState(null);
  const [form, setForm] = React.useState({ nome: '', descricao: '' });

  // associations
  const [companies, setCompanies] = React.useState([]);
  const [users, setUsers] = React.useState([]);
  const [transactions, setTransactions] = React.useState([]);
  const [groupCompanies, setGroupCompanies] = React.useState([]);
  const [groupUsers, setGroupUsers] = React.useState([]);
  const [groupTransactions, setGroupTransactions] = React.useState([]);
  const [selectedEmpresaId, setSelectedEmpresaId] = React.useState('');
  const [selectedUsuarioId, setSelectedUsuarioId] = React.useState('');
  const [selectedTransacaoId, setSelectedTransacaoId] = React.useState('');

  // clone
  const [cloneName, setCloneName] = React.useState('');
  const [showClone, setShowClone] = React.useState(false);

  const seedDefaultTransactions = React.useCallback(async () => {
    try {
      setLoading(true);
      let tx = transactions.length ? transactions : (await getTransactions()) || [];
      const requiredRoutes = new Set([
        '/reviews','/reviews/periodos','/reviews/delegacao','/reviews/massa','/revisoes-massa','/reviews/vidas-uteis','/reviews/cronogramas',
        '/notifications','/notifications/new'
      ]);
      const existingRoutes = new Set(tx.map((tr) => String(tr.rota || '')));
      const missing = Array.from(requiredRoutes).filter((r) => !existingRoutes.has(r));
      for (const r of missing) {
        try {
          const nome = r === '/notifications' ? 'Notificações' : r === '/notifications/new' ? 'Enviar Notificação' : r;
          await createTransaction({ nome_tela: nome, rota: r });
        } catch {}
      }
      if (missing.length > 0) {
        tx = (await getTransactions()) || tx;
        setTransactions(Array.isArray(tx) ? tx : transactions);
        toast.success('Rotas padrão criadas');
      } else {
        toast('Rotas padrão já existem');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao criar rotas padrão');
    } finally {
      setLoading(false);
    }
  }, [transactions]);

  const load = async () => {
    try {
      setLoading(true); setError(false);
      const [gs, cs, us, ts] = await Promise.all([
        getPermissionGroups(query || ''),
        getCompanies(),
        getUsers(),
        getTransactions(),
      ]);
      setGroups(Array.isArray(gs) ? gs : []);
      setCompanies(Array.isArray(cs) ? cs : []);
      setUsers(Array.isArray(us) ? us : []);
      let baseTx = Array.isArray(ts) ? ts : [];
      const requiredRoutes = new Set([
        '/reviews','/reviews/periodos','/reviews/delegacao','/reviews/massa','/revisoes-massa','/reviews/vidas-uteis','/reviews/cronogramas',
        '/notifications','/notifications/new'
      ]);
      const existingRoutes = new Set(baseTx.map((tr) => String(tr.rota || '')));
      const missing = Array.from(requiredRoutes).filter((r) => !existingRoutes.has(r));
      for (const r of missing) {
        try {
          const nome = r === '/notifications' ? 'Notificações' : r === '/notifications/new' ? 'Enviar Notificação' : r;
          await createTransaction({ nome_tela: nome, rota: r });
        } catch {}
      }
      if (missing.length > 0) {
        try { baseTx = (await getTransactions()) || baseTx; } catch {}
      }
      setTransactions(Array.isArray(baseTx) ? baseTx : []);
    } catch (err) {
      setError(true);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load(); }, []);

  const onNew = () => {
    setEditingId(null);
    setForm({ nome: '', descricao: '' });
    setActiveTab('basic');
    setGroupCompanies([]);
    setGroupUsers([]);
    setGroupTransactions([]);
    setShowClone(false);
    setCloneName('');
  };

  const onEdit = async (row) => {
    try {
      setLoading(true);
      const g = await getPermissionGroup(row.id);
      setEditingId(g.id);
      setForm({ nome: g.nome || '', descricao: g.descricao || '' });
      setActiveTab('basic');
      const [gc, gu, gt] = await Promise.all([
        listGroupCompanies(g.id),
        listGroupUsers(g.id),
        listGroupTransactions(g.id),
      ]);
      setGroupCompanies(Array.isArray(gc) ? gc : []);
      setGroupUsers(Array.isArray(gu) ? gu : []);
      setGroupTransactions(Array.isArray(gt) ? gt : []);
      try {
        let tx = transactions.length ? transactions : (await getTransactions()) || [];
        const requiredRoutes = new Set([
          '/reviews','/reviews/periodos','/reviews/delegacao','/reviews/massa','/revisoes-massa','/reviews/vidas-uteis','/reviews/cronogramas',
          '/notifications','/notifications/new'
        ]);
        const existingRoutes = new Set(tx.map((tr) => String(tr.rota || '')));
        const missing = Array.from(requiredRoutes).filter((r) => !existingRoutes.has(r));
        for (const r of missing) {
          try {
            const nome = r === '/notifications' ? 'Notificações' : r === '/notifications/new' ? 'Enviar Notificação' : r;
            await createTransaction({ nome_tela: nome, rota: r });
          } catch {}
        }
        if (missing.length > 0) {
          tx = (await getTransactions()) || tx;
          setTransactions(Array.isArray(tx) ? tx : transactions);
        }
      } catch {}
      toast.success(t('open') || 'Aberto');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao abrir grupo');
    } finally {
      setLoading(false);
    }
  };

  const onSave = async () => {
    if (!form.nome || form.nome.trim() === '') {
      toast.error(t('field_required') || 'Campo obrigatório');
      return;
    }
    try {
      setLoading(true);
      if (!editingId) {
        const created = await createPermissionGroup({ nome: form.nome.trim(), descricao: form.descricao || '' });
        setEditingId(created.id);
        toast.success(t('created_successfully') || 'Criado com sucesso');

        // Vincular transações padrão de Revisões automaticamente
        try {
          let tx = transactions.length ? transactions : (await getTransactions()) || [];
          const requiredRoutes = new Set([
            '/reviews','/reviews/periodos','/reviews/cronogramas','/reviews/delegacao','/reviews/massa','/revisoes-massa','/reviews/vidas-uteis',
            '/notifications','/notifications/new'
          ]);
          const existingRoutes = new Set(tx.map((tr) => String(tr.rota || '')));
          const missing = Array.from(requiredRoutes).filter((r) => !existingRoutes.has(r));
          for (const r of missing) {
            try {
              const nome = r === '/notifications' ? 'Notificações' : r === '/notifications/new' ? 'Enviar Notificação' : r;
              await createTransaction({ nome_tela: nome, rota: r });
            } catch {}
          }
          tx = (await getTransactions()) || [];
          const toLink = tx.filter((tr) => requiredRoutes.has(String(tr.rota || '')));
          for (const tr of toLink) {
            try { await addGroupTransaction(created.id, tr.id); } catch {}
          }
          const gt = await listGroupTransactions(created.id);
          setGroupTransactions(Array.isArray(gt) ? gt : []);
        } catch {}
      } else {
        await updatePermissionGroup(editingId, { nome: form.nome.trim(), descricao: form.descricao || '' });
        toast.success(t('updated_successfully') || 'Atualizado com sucesso');
      }
      await load();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id) => {
    try {
      setLoading(true);
      await deletePermissionGroup(id);
      toast.success(t('deleted_successfully') || 'Excluído com sucesso');
      if (editingId === id) onNew();
      await load();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao excluir');
    } finally {
      setLoading(false);
    }
  };

  const onSearch = async () => { await load(); };

  // associations handlers
  const onAddCompany = async () => {
    if (!editingId || !selectedEmpresaId) return;
    try {
      await addGroupCompany(editingId, selectedEmpresaId);
      const gc = await listGroupCompanies(editingId);
      setGroupCompanies(Array.isArray(gc) ? gc : []);
      setSelectedEmpresaId('');
      toast.success('Empresa vinculada');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao vincular empresa');
    }
  };
  const onRemoveCompany = async (empresaId) => {
    if (!editingId) return;
    try {
      await removeGroupCompany(editingId, empresaId);
      setGroupCompanies((prev) => prev.filter((c) => c.id !== empresaId));
      toast.success('Empresa desvinculada');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao remover vínculo');
    }
  };

  const onAddTransaction = async () => {
    if (!editingId || !selectedTransacaoId) return;
    try {
      await addGroupTransaction(editingId, selectedTransacaoId);
      const gt = await listGroupTransactions(editingId);
      setGroupTransactions(Array.isArray(gt) ? gt : []);
      setSelectedTransacaoId('');
      toast.success('Transação vinculada');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao vincular transação');
    }
  };
  const onRemoveTransaction = async (transacaoId) => {
    if (!editingId) return;
    try {
      await removeGroupTransaction(editingId, transacaoId);
      setGroupTransactions((prev) => prev.filter((t) => t.id !== transacaoId));
      toast.success('Transação desvinculada');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao remover vínculo');
    }
  };

  const onAddUser = async () => {
    if (!editingId || !selectedUsuarioId) return;
    try {
      await addGroupUser(editingId, selectedUsuarioId);
      const gu = await listGroupUsers(editingId);
      setGroupUsers(Array.isArray(gu) ? gu : []);
      setSelectedUsuarioId('');
      toast.success('Usuário vinculado');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao vincular usuário');
    }
  };
  const onRemoveUser = async (usuarioId) => {
    if (!editingId) return;
    try {
      await removeGroupUser(editingId, usuarioId);
      setGroupUsers((prev) => prev.filter((u) => u.id !== usuarioId));
      toast.success('Usuário desvinculado');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao remover vínculo');
    }
  };

  const onClone = async () => {
    if (!editingId || !cloneName.trim()) {
      toast.error('Informe o novo nome');
      return;
    }
    try {
      setLoading(true);
      const novo = await clonePermissionGroup(editingId, { novo_nome: cloneName.trim(), descricao: form.descricao || '' });
      toast.success('Grupo clonado');
      await load();
      setEditingId(novo.id);
      setForm({ nome: novo.nome || '', descricao: novo.descricao || '' });
      const [gc, gu, gt] = await Promise.all([
        listGroupCompanies(novo.id),
        listGroupUsers(novo.id),
        listGroupTransactions(novo.id),
      ]);
      setGroupCompanies(Array.isArray(gc) ? gc : []);
      setGroupUsers(Array.isArray(gu) ? gu : []);
      setGroupTransactions(Array.isArray(gt) ? gt : []);
      setShowClone(false);
      setCloneName('');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao clonar grupo');
    } finally {
      setLoading(false);
    }
  };

  const filteredGroups = React.useMemo(() => {
    const q = (query || '').trim().toLowerCase();
    let list = Array.isArray(groups) ? groups : [];
    if (!q) return list;
    return list.filter((g) => (g.nome || '').toLowerCase().includes(q) || (g.descricao || '').toLowerCase().includes(q));
  }, [groups, query]);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{t('nav_permissions') || 'Permissões'}</h2>
        <ActionToolbar
          onNew={onNew}
          onSave={onSave}
          onEdit={() => editingId && onEdit(groups.find((x) => x.id === editingId))}
          onDelete={() => editingId && onDelete(editingId)}
          onPrint={() => window.print()}
          onExportPdf={() => toast(t('coming_soon') || 'Em breve.')}
          onExportExcel={() => toast(t('coming_soon') || 'Em breve.')}
          canEditDelete={!!editingId}
        />
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
        {/* Form (Esquerda) */}
        <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-3">
          <Tabs value={activeTab} onChange={setActiveTab} items={[
            { value: 'basic', label: 'Informações Básicas' },
            { value: 'empresas', label: 'Empresas' },
            { value: 'transacoes', label: 'Transações' },
            { value: 'usuarios', label: 'Usuários' },
          ]} />

          {showClone && (
            <div className="grid grid-cols-[1fr_auto] items-end gap-2 mb-4 min-w-0">
              <Input label="Novo nome" value={cloneName} onChange={(e) => setCloneName(e.target.value)} className="min-w-0" />
              <Button variant="primary" onClick={onClone}>Clonar</Button>
            </div>
          )}

          <TabPanel active={activeTab === 'basic'}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input label="Nome do Grupo" name="nome" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
              <Input label="Descrição" name="descricao" value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} multiline rows={3} />
            </div>
          </TabPanel>

          <TabPanel active={activeTab === 'empresas'}>
            {!editingId && <p className="text-slate-600 dark:text-slate-300">Salve o grupo para vincular empresas.</p>}
            {editingId && (
              <div className="space-y-3">
                <div className="flex items-end gap-2">
                  <Select label="Empresa" value={selectedEmpresaId} onChange={(e) => setSelectedEmpresaId(e.target.value)} className="flex-1">
                    <option value="">Selecione...</option>
                    {companies.filter((c) => !groupCompanies.some((gc) => gc.id === c.id)).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Select>
                  <Button variant="primary" onClick={onAddCompany} disabled={!selectedEmpresaId}>Adicionar</Button>
                </div>
                <div className="space-y-2">
                  {(groupCompanies || []).map((c) => (
                    <div key={c.id} className="flex items-center justify-between px-3 py-2 rounded-md border border-slate-200 dark:border-slate-800">
                      <div>
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{c.name}</div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">CNPJ: {c.cnpj}</div>
                      </div>
                      <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title={t('delete') || 'Excluir'} onClick={() => onRemoveCompany(c.id)}>
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </div>
                  ))}
                  {groupCompanies.length === 0 && <p className="text-sm text-slate-600 dark:text-slate-400">Nenhuma empresa vinculada.</p>}
                </div>
              </div>
            )}
          </TabPanel>

          <TabPanel active={activeTab === 'transacoes'}>
            {!editingId && <p className="text-slate-600 dark:text-slate-300">Salve o grupo para vincular transações.</p>}
            {editingId && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600 dark:text-slate-300">Garanta que as rotas padrão existam para poder vinculá-las.</div>
                  <Button variant="secondary" onClick={seedDefaultTransactions}>Criar rotas padrão</Button>
                </div>
                <div className="flex items-end gap-2">
                  <Select label="Transação" value={selectedTransacaoId} onChange={(e) => setSelectedTransacaoId(e.target.value)} className="flex-1">
                    <option value="">Selecione...</option>
                    {transactions.filter((tr) => !groupTransactions.some((gt) => gt.id === tr.id)).map((tr) => (
                      <option key={tr.id} value={tr.id}>{tr.nome_tela} ({tr.rota})</option>
                    ))}
                  </Select>
                  <Button variant="primary" onClick={onAddTransaction} disabled={!selectedTransacaoId}>Adicionar</Button>
                </div>
                <div className="space-y-2">
                  {(groupTransactions || []).map((tr) => (
                    <div key={tr.id} className="flex items-center justify-between px-3 py-2 rounded-md border border-slate-200 dark:border-slate-800">
                      <div>
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{tr.nome_tela}</div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">Rota: {tr.rota}</div>
                      </div>
                      <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title={t('delete') || 'Excluir'} onClick={() => onRemoveTransaction(tr.id)}>
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </div>
                  ))}
                  {groupTransactions.length === 0 && <p className="text-sm text-slate-600 dark:text-slate-400">Nenhuma transação vinculada.</p>}
                </div>
              </div>
            )}
          </TabPanel>

          <TabPanel active={activeTab === 'usuarios'}>
            {!editingId && <p className="text-slate-600 dark:text-slate-300">Salve o grupo para vincular usuários.</p>}
            {editingId && (
              <div className="space-y-3">
                <div className="flex items-end gap-2">
                  <Select label="Usuário" value={selectedUsuarioId} onChange={(e) => setSelectedUsuarioId(e.target.value)} className="flex-1">
                    <option value="">Selecione...</option>
                    {users.filter((u) => !groupUsers.some((gu) => gu.id === u.id)).map((u) => (
                      <option key={u.id} value={u.id}>{u.codigo ? `${u.codigo} - ` : ''}{u.nome_completo || u.nome}</option>
                    ))}
                  </Select>
                  <Button variant="primary" onClick={onAddUser} disabled={!selectedUsuarioId}>Adicionar</Button>
                </div>
                <div className="space-y-2">
                  {(groupUsers || []).map((u) => (
                    <div key={u.id} className="flex items-center justify-between px-3 py-2 rounded-md border border-slate-200 dark:border-slate-800">
                      <div>
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{u.nome_completo || u.nome}</div>
                        {u.email && <div className="text-xs text-slate-600 dark:text-slate-400">{u.email}</div>}
                      </div>
                      <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title={t('delete') || 'Excluir'} onClick={() => onRemoveUser(u.id)}>
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </div>
                  ))}
                  {groupUsers.length === 0 && <p className="text-sm text-slate-600 dark:text-slate-400">Nenhum usuário vinculado.</p>}
                </div>
              </div>
            )}
          </TabPanel>
        </div>

        {/* Lista (Direita) */}
        <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-3">
          <div className="grid grid-cols-[auto_1fr_auto] items-end gap-2 mb-3 min-w-0">
            <Search size={16} className="text-slate-600 dark:text-slate-300" />
            <input
              className="px-3 py-2 rounded-md border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 flex-1 min-w-0"
              placeholder="Pesquisar por nome ou descrição"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button variant="secondary" onClick={onSearch}>{t('open') || 'Abrir'}</Button>
          </div>

          {loading && <p className="text-slate-500">Carregando...</p>}
          {error && <p className="text-red-600">Erro no backend</p>}
          {!loading && !error && (
            <div className="flex flex-col gap-2 max-h-[65vh] overflow-y-auto pr-1">
              {(filteredGroups || []).map((g) => (
                <div
                  key={g.id}
                  className="rounded-xl bg-gray-50 dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{g.nome}</h3>
                      {g.descricao && (<p className="text-xs text-slate-600 dark:text-slate-300">{g.descricao}</p>)}
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title={t('edit') || 'Editar'} onClick={() => onEdit(g)}>
                        <Pencil size={16} className="text-slate-600 dark:text-slate-300" />
                      </button>
                      <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title={t('delete') || 'Excluir'} onClick={() => onDelete(g.id)}>
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300">
                    <span>Usuários: {g.usuarios}</span>
                    <span>Empresas: {g.empresas}</span>
                    <span>Transações: {g.transacoes}</span>
                  </div>
                </div>
              ))}
              {filteredGroups.length === 0 && (
                <p className="text-slate-600 dark:text-slate-300">Nenhum grupo encontrado.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
