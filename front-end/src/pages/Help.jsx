import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Users, Layers, Calendar, ClipboardCheck, Info, FileText, ChevronRight, Menu, Search, Edit, Trash2, Save, Plus } from 'lucide-react';

export default function HelpPage() {
  const { t } = useTranslation();
  const [activeTopic, setActiveTopic] = useState('companies');

  const topics = [
    { id: 'companies', label: t('companies') || 'Cadastro de Empresas', icon: <Building2 size={18} /> },
    { id: 'users', label: t('users') || 'Cadastro de Usuários', icon: <Users size={18} /> },
    { id: 'ugs', label: t('ugs') || 'Cadastro de UGs', icon: <Layers size={18} /> },
    { id: 'cronogramas', label: t('tab_cronograma') || 'Cronogramas', icon: <Calendar size={18} /> },
    { id: 'reviews', label: t('tab_vidas_uteis') || 'Revisão de Vidas Úteis', icon: <ClipboardCheck size={18} /> },
    { id: 'tips', label: t('help_tips_title') || 'Dicas Gerais', icon: <Info size={18} /> },
  ];

  const renderContent = () => {
    switch (activeTopic) {
      case 'companies':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-2">
                <Building2 className="text-blue-600 dark:text-blue-400" /> {t('companies') || 'Cadastro de Empresas'}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                Gerencie as informações das organizações (Matrizes e Filiais) que utilizam o sistema.
                </p>
            </div>
            
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950 shadow-sm">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <FileText size={18} /> Guia Passo a Passo
              </div>
              <div className="p-6 space-y-8">
                {/* Passo 1 */}
                <div className="flex gap-4">
                  <div className="flex-none flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm ring-4 ring-blue-50 dark:ring-blue-900/20 dark:bg-blue-900 dark:text-blue-300">1</div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg mb-1">Acesse o Menu</h3>
                    <p className="text-slate-600 dark:text-slate-400">No menu lateral, navegue até a seção <strong>Cadastros</strong> e clique em <strong>Empresas</strong>.</p>
                  </div>
                </div>
                
                {/* Passo 2 */}
                <div className="flex gap-4">
                  <div className="flex-none flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm ring-4 ring-blue-50 dark:ring-blue-900/20 dark:bg-blue-900 dark:text-blue-300">2</div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg mb-1">Novo Registro</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                        Localize a barra de ferramentas no topo da página e clique no botão <strong>Novo</strong> <span className="inline-flex items-center justify-center bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs mx-1"><Plus size={12} className="mr-1"/> Novo</span>. 
                        Isso limpará o formulário para uma nova entrada.
                    </p>
                  </div>
                </div>

                {/* Passo 3 */}
                <div className="flex gap-4">
                  <div className="flex-none flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm ring-4 ring-blue-50 dark:ring-blue-900/20 dark:bg-blue-900 dark:text-blue-300">3</div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg mb-1">Preencha os Dados</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-3">O cadastro é organizado em duas abas principais:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                            <strong className="block mb-2 text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-1">Aba Empresa</strong>
                            <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-400 space-y-2">
                                <li><strong>Razão Social/Nome:</strong> Nome oficial da empresa. (Obrigatório)</li>
                                <li><strong>CNPJ:</strong> Identificador único no sistema. (Obrigatório, apenas números)</li>
                                <li><strong>Tipo:</strong> Defina se é <em>Matriz</em> ou <em>Filial</em>.</li>
                                <li><strong>Status:</strong> <em>Ativo</em> para permitir uso, <em>Inativo</em> para bloquear.</li>
                                <li><strong>Divisão:</strong> Campo opcional para segmentação interna.</li>
                            </ul>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                            <strong className="block mb-2 text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-1">Aba Contato/Endereço</strong>
                            <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-400 space-y-2">
                                <li><strong>Endereço:</strong> Logradouro, Bairro, Cidade, UF e CEP.</li>
                                <li><strong>Contato:</strong> Telefone e E-mail para comunicação.</li>
                            </ul>
                        </div>
                    </div>
                  </div>
                </div>

                {/* Passo 4 */}
                <div className="flex gap-4">
                  <div className="flex-none flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm ring-4 ring-blue-50 dark:ring-blue-900/20 dark:bg-blue-900 dark:text-blue-300">4</div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg mb-1">Salvar</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                        Clique no botão <strong>Salvar</strong> <span className="inline-flex items-center justify-center bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs mx-1"><Save size={12} className="mr-1"/> Salvar</span> na barra de ferramentas. 
                        O sistema validará se os campos obrigatórios (Nome e CNPJ) foram preenchidos.
                    </p>
                  </div>
                </div>

                {/* Outras Ações */}
                <div className="border-t border-slate-200 dark:border-slate-800 pt-6 mt-2">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg mb-3">Outras Ações</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-yellow-100 text-yellow-700 rounded-lg dark:bg-yellow-900/30 dark:text-yellow-400"><Edit size={18}/></div>
                            <div>
                                <strong className="block text-sm text-slate-900 dark:text-slate-100">Editar</strong>
                                <span className="text-xs text-slate-500 dark:text-slate-400">Selecione uma empresa na lista (botão lápis) para carregar os dados no formulário, faça as alterações e clique em Salvar.</span>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-red-100 text-red-700 rounded-lg dark:bg-red-900/30 dark:text-red-400"><Trash2 size={18}/></div>
                            <div>
                                <strong className="block text-sm text-slate-900 dark:text-slate-100">Excluir</strong>
                                <span className="text-xs text-slate-500 dark:text-slate-400">Use o botão de lixeira na lista para remover um registro. Cuidado: essa ação é irreversível.</span>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg dark:bg-blue-900/30 dark:text-blue-400"><Search size={18}/></div>
                            <div>
                                <strong className="block text-sm text-slate-900 dark:text-slate-100">Pesquisar</strong>
                                <span className="text-xs text-slate-500 dark:text-slate-400">Utilize o campo de busca acima da lista para filtrar por Nome ou CNPJ.</span>
                            </div>
                        </div>
                    </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 flex items-start gap-3">
              <Info className="text-blue-600 dark:text-blue-400 flex-none mt-1" size={20}/> 
              <div>
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">Dica Importante</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Sempre verifique se a empresa já existe usando a busca antes de cadastrar uma nova. O CNPJ deve ser único no sistema.
                  </p>
              </div>
            </div>
          </div>
        );
      
      case 'users':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-2">
                <Users className="text-blue-600 dark:text-blue-400" /> {t('users') || 'Cadastro de Usuários'}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                Gerencie os acessos ao sistema, vinculando colaboradores a perfis de usuário.
                </p>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950 shadow-sm">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <FileText size={18} /> Guia de Preenchimento
              </div>
              <div className="p-6 space-y-6">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">1. Dados Básicos</h3>
                        <ul className="space-y-3">
                            <li className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                                <span className="font-semibold text-slate-800 dark:text-slate-200 w-24 flex-none">Código:</span>
                                <span>Gerado automaticamente pelo sistema.</span>
                            </li>
                            <li className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                                <span className="font-semibold text-slate-800 dark:text-slate-200 w-24 flex-none">Status:</span>
                                <span>Defina como <em>Ativo</em> para permitir login.</span>
                            </li>
                            <li className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                                <span className="font-semibold text-slate-800 dark:text-slate-200 w-24 flex-none">Colaborador:</span>
                                <span>
                                    Use o botão de lupa <Search size={14} className="inline"/> para buscar um colaborador já cadastrado. 
                                    Isso preencherá automaticamente Nome, CPF, E-mail e Vínculos (Empresa, UG, Centro de Custo).
                                </span>
                            </li>
                        </ul>
                    </div>
                    <div>
                         <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">2. Acesso e Segurança</h3>
                         <ul className="space-y-3">
                            <li className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                                <span className="font-semibold text-slate-800 dark:text-slate-200 w-32 flex-none">Nome de Usuário:</span>
                                <span>Identificador para login (ex: nome.sobrenome).</span>
                            </li>
                            <li className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                                <span className="font-semibold text-slate-800 dark:text-slate-200 w-32 flex-none">Senha:</span>
                                <span>Obrigatória no cadastro. Deve ser confirmada no campo ao lado.</span>
                            </li>
                            <li className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                                <span className="font-semibold text-slate-800 dark:text-slate-200 w-32 flex-none">Vínculos:</span>
                                <span>Empresa, UG e Centro de Custos definem o escopo de dados que o usuário poderá ver.</span>
                            </li>
                         </ul>
                    </div>
                 </div>

                 <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800 mt-4">
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Funcionalidades de Busca (Modais)</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        Vários campos possuem um botão de lupa ao lado. Ao clicar, uma janela se abre permitindo pesquisar registros existentes.
                    </p>
                    <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-400">
                        <li><strong>Colaborador:</strong> Busca por nome, e-mail ou matrícula.</li>
                        <li><strong>Empresa/UG/Centro de Custo:</strong> Busca por nome ou código.</li>
                    </ul>
                 </div>
              </div>
            </div>
          </div>
        );

      case 'ugs':
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-2">
                  <Layers className="text-blue-600 dark:text-blue-400" /> {t('ugs') || 'Cadastro de UGs'}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 text-lg">
                  Estruture a hierarquia da organização através das Unidades Gerenciais.
                  </p>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950 shadow-sm">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <FileText size={18} /> Detalhes do Cadastro
                </div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">Tipo da Unidade</label>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Classifique a UG conforme sua função:</p>
                            <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-400 space-y-1">
                                <li>Administrativa</li>
                                <li>Produtiva</li>
                                <li>Apoio</li>
                                <li>Auxiliares</li>
                            </ul>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">Nível Hierárquico</label>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Define a posição da UG na árvore da empresa:</p>
                            <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-400 space-y-1">
                                <li><strong>CEO:</strong> Nível máximo (não possui UG Superior).</li>
                                <li><strong>Diretoria, Gerência, etc.:</strong> Níveis subordinados (exigem UG Superior).</li>
                            </ul>
                        </div>
                    </div>

                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-lg">
                        <h4 className="text-yellow-800 dark:text-yellow-400 font-semibold text-sm mb-1">Atenção ao Hierarquia</h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-500">
                            Se você selecionar um nível diferente de <strong>CEO</strong>, o campo <strong>UG Superior (Pai)</strong> torna-se obrigatório. 
                            Você deve selecionar a qual unidade esta nova UG responde.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">Vínculos Obrigatórios</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                            Para garantir a integridade dos dados, é necessário vincular:
                        </p>
                        <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-400 space-y-2">
                            <li><strong>Empresa:</strong> A qual organização a UG pertence.</li>
                            <li><strong>Responsável:</strong> Quem responde pela unidade (busque na lista de colaboradores).</li>
                        </ul>
                    </div>
                </div>
              </div>
            </div>
          );

      case 'cronogramas':
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Calendar className="text-blue-600 dark:text-blue-400" /> {t('tab_cronograma') || 'Cronogramas'}
                </h2>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">{t('help_reviews_menu_title') || 'Menu de Revisões'}</h3>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 flex-none"></span>
                            <span>{t('help_reviews_menu_item_periods') || 'Períodos de Revisão: Defina os intervalos de tempo para as auditorias.'}</span>
                        </li>
                        <li className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 flex-none"></span>
                            <span>{t('help_reviews_menu_item_delegation') || 'Delegação: Atribua responsáveis para revisar grupos de ativos.'}</span>
                        </li>
                        <li className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 flex-none"></span>
                            <span>{t('help_reviews_menu_item_individual') || 'Revisão Individual: Analise item a item.'}</span>
                        </li>
                    </ul>
                </div>
            </div>
        );

      case 'reviews':
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <ClipboardCheck className="text-blue-600 dark:text-blue-400" /> {t('help_reviews_flow_title') || 'Fluxo de Revisão'}
                </h2>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
                  <ol className="space-y-4">
                    {[
                        t('help_reviews_flow_step_period') || '1) Abra um Período de Revisão.',
                        t('help_reviews_flow_step_import') || '2) Importe ou sincronize os dados do ERP.',
                        t('help_reviews_flow_step_delegate') || '3) Delegue conjuntos de bens para usuários revisores.',
                        t('help_reviews_flow_step_review') || '4) Usuários realizam a revisão (Vidas Úteis).',
                        t('help_reviews_flow_step_mass') || '5) Revisão em Massa para ajustes em lote.',
                        t('help_reviews_flow_step_reports') || '6) Gere relatórios finais.'
                    ].map((step, idx) => (
                        <li key={idx} className="flex gap-3">
                            <span className="flex-none font-bold text-slate-400 dark:text-slate-600">{idx + 1}.</span>
                            <span className="text-slate-700 dark:text-slate-300">{step.replace(/^\d+\)\s*/, '')}</span>
                        </li>
                    ))}
                  </ol>
                </div>
            </div>
        );

      case 'tips':
         return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                 <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Info className="text-blue-600 dark:text-blue-400" /> {t('help_tips_title') || 'Dicas Gerais'}
                 </h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        t('help_tip_filters') || 'Use os filtros para encontrar itens rapidamente.',
                        t('help_tip_shortcuts') || 'Use o painel lateral para navegar entre módulos.',
                        t('help_tip_permissions') || 'Se não conseguir acessar algo, verifique suas permissões.'
                    ].map((tip, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 flex gap-3">
                            <div className="mt-1 text-yellow-500 flex-none">💡</div>
                            <div>{tip}</div>
                        </div>
                    ))}
                 </div>
            </div>
         );

      default:
        return <div className="text-slate-500">Selecione um tópico.</div>;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] gap-6 p-4">
      {/* Sidebar */}
      <aside className="w-full md:w-72 flex-none flex flex-col gap-2 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm h-full overflow-y-auto">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 px-2 flex items-center gap-2">
            <Menu size={20} />
            {t('help_title') || 'Central de Ajuda'}
        </h2>
        <nav className="space-y-1">
          {topics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => setActiveTopic(topic.id)}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                activeTopic === topic.id
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={activeTopic === topic.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}>
                    {topic.icon}
                </span>
                <span>{topic.label}</span>
              </div>
              {activeTopic === topic.id && <ChevronRight size={16} className="text-blue-500/50" />}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-transparent rounded-xl p-2 md:p-6 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
}
