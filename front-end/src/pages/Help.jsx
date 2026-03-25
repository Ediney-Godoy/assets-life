import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Users, Layers, Calendar, ClipboardCheck, Info, FileText, ChevronRight, Menu, Search, Edit, Trash2, Save, Plus } from 'lucide-react';

export default function HelpPage() {
  const { t } = useTranslation();
  const [activeTopic, setActiveTopic] = useState('companies');

  const topics = [
    { id: 'companies', label: t('help_topic_companies', { defaultValue: 'Empresas' }), icon: <Building2 size={18} /> },
    { id: 'users', label: t('help_topic_users', { defaultValue: 'Usuários' }), icon: <Users size={18} /> },
    { id: 'ugs', label: t('help_topic_ugs', { defaultValue: 'UGs' }), icon: <Layers size={18} /> },
    { id: 'cronogramas', label: t('help_topic_cronogramas', { defaultValue: 'Cronogramas' }), icon: <Calendar size={18} /> },
    { id: 'reviews', label: t('help_topic_vidas_uteis', { defaultValue: 'Revisão de Vidas Úteis' }), icon: <ClipboardCheck size={18} /> },
    { id: 'supervision', label: t('help_topic_supervisao_rvu', { defaultValue: 'Supervisão RVU' }), icon: <ClipboardCheck size={18} /> },
    { id: 'tips', label: t('help_topic_tips', { defaultValue: 'Dicas Gerais' }), icon: <Info size={18} /> },
  ];

  const renderContent = () => {
    switch (activeTopic) {
      case 'companies':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-2">
                <Building2 className="text-blue-600 dark:text-blue-400" /> {t('help_topic_companies', { defaultValue: 'Empresas' })}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                {t('help_companies_intro', { defaultValue: 'Gerencie as informações das organizações (Matrizes e Filiais) que utilizam o sistema.' })}
                </p>
            </div>
            
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950 shadow-sm">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <FileText size={18} /> {t('help_companies_guide_title', { defaultValue: 'Guia Passo a Passo' })}
              </div>
              <div className="p-6 space-y-8">
                {/* Passo 1 */}
                <div className="flex gap-4">
                  <div className="flex-none flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm ring-4 ring-blue-50 dark:ring-blue-900/20 dark:bg-blue-900 dark:text-blue-300">1</div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg mb-1">{t('help_companies_step1_title', { defaultValue: 'Acesse o Menu' })}</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      {t('help_companies_step1_desc_before', { defaultValue: 'No menu lateral, navegue até a seção' })}{' '}
                      <strong>{t('nav_registrations', { defaultValue: 'Controles Internos' })}</strong>{' '}
                      {t('help_companies_step1_desc_middle', { defaultValue: 'e clique em' })}{' '}
                      <strong>{t('help_topic_companies', { defaultValue: 'Empresas' })}</strong>.
                    </p>
                  </div>
                </div>
                
                {/* Passo 2 */}
                <div className="flex gap-4">
                  <div className="flex-none flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm ring-4 ring-blue-50 dark:ring-blue-900/20 dark:bg-blue-900 dark:text-blue-300">2</div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg mb-1">{t('help_companies_step2_title', { defaultValue: 'Novo Registro' })}</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                        {t('help_companies_step2_desc_before', { defaultValue: 'Localize a barra de ferramentas no topo da página e clique no botão' })}{' '}
                        <strong>{t('new', { defaultValue: 'Novo' })}</strong>{' '}
                        <span className="inline-flex items-center justify-center bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs mx-1">
                          <Plus size={12} className="mr-1" /> {t('new', { defaultValue: 'Novo' })}
                        </span>
                        . {t('help_companies_step2_desc_after', { defaultValue: 'Isso limpará o formulário para uma nova entrada.' })}
                    </p>
                  </div>
                </div>

                {/* Passo 3 */}
                <div className="flex gap-4">
                  <div className="flex-none flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm ring-4 ring-blue-50 dark:ring-blue-900/20 dark:bg-blue-900 dark:text-blue-300">3</div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg mb-1">{t('help_companies_step3_title', { defaultValue: 'Preencha os Dados' })}</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-3">{t('help_companies_tabs_intro', { defaultValue: 'O cadastro é organizado em duas abas principais:' })}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                            <strong className="block mb-2 text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-1">{t('help_companies_tab_company', { defaultValue: 'Aba Empresa' })}</strong>
                            <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-400 space-y-2">
                                <li><strong>{t('help_companies_company_field_name_label', { defaultValue: 'Razão Social/Nome:' })}</strong> {t('help_companies_company_field_name_desc', { defaultValue: 'Nome oficial da empresa. (Obrigatório)' })}</li>
                                <li><strong>{t('help_companies_company_field_cnpj_label', { defaultValue: 'CNPJ:' })}</strong> {t('help_companies_company_field_cnpj_desc', { defaultValue: 'Identificador único no sistema. (Obrigatório, apenas números)' })}</li>
                                <li><strong>{t('help_companies_company_field_type_label', { defaultValue: 'Tipo:' })}</strong> {t('help_companies_company_field_type_desc', { defaultValue: 'Defina se é Matriz ou Filial.' })}</li>
                                <li><strong>{t('help_companies_company_field_status_label', { defaultValue: 'Status:' })}</strong> {t('help_companies_company_field_status_desc', { defaultValue: 'Ativo para permitir uso, Inativo para bloquear.' })}</li>
                                <li><strong>{t('help_companies_company_field_division_label', { defaultValue: 'Divisão:' })}</strong> {t('help_companies_company_field_division_desc', { defaultValue: 'Campo opcional para segmentação interna.' })}</li>
                            </ul>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                            <strong className="block mb-2 text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-1">{t('help_companies_tab_contact', { defaultValue: 'Aba Contato/Endereço' })}</strong>
                            <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-400 space-y-2">
                                <li><strong>{t('help_companies_contact_field_address_label', { defaultValue: 'Endereço:' })}</strong> {t('help_companies_contact_field_address_desc', { defaultValue: 'Logradouro, Bairro, Cidade, UF e CEP.' })}</li>
                                <li><strong>{t('help_companies_contact_field_contact_label', { defaultValue: 'Contato:' })}</strong> {t('help_companies_contact_field_contact_desc', { defaultValue: 'Telefone e E-mail para comunicação.' })}</li>
                            </ul>
                        </div>
                    </div>
                  </div>
                </div>

                {/* Passo 4 */}
                <div className="flex gap-4">
                  <div className="flex-none flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm ring-4 ring-blue-50 dark:ring-blue-900/20 dark:bg-blue-900 dark:text-blue-300">4</div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg mb-1">{t('help_companies_step4_title', { defaultValue: 'Salvar' })}</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                        {t('help_companies_step4_desc_before', { defaultValue: 'Clique no botão' })}{' '}
                        <strong>{t('save', { defaultValue: 'Salvar' })}</strong>{' '}
                        <span className="inline-flex items-center justify-center bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs mx-1">
                          <Save size={12} className="mr-1" /> {t('save', { defaultValue: 'Salvar' })}
                        </span>{' '}
                        {t('help_companies_step4_desc_after', { defaultValue: 'na barra de ferramentas. O sistema validará se os campos obrigatórios (Nome e CNPJ) foram preenchidos.' })}
                    </p>
                  </div>
                </div>

                {/* Outras Ações */}
                <div className="border-t border-slate-200 dark:border-slate-800 pt-6 mt-2">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg mb-3">{t('help_companies_other_actions_title', { defaultValue: 'Outras Ações' })}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-yellow-100 text-yellow-700 rounded-lg dark:bg-yellow-900/30 dark:text-yellow-400"><Edit size={18}/></div>
                            <div>
                                <strong className="block text-sm text-slate-900 dark:text-slate-100">{t('help_companies_action_edit_title', { defaultValue: 'Editar' })}</strong>
                                <span className="text-xs text-slate-500 dark:text-slate-400">{t('help_companies_action_edit_desc', { defaultValue: 'Selecione uma empresa na lista (botão lápis) para carregar os dados no formulário, faça as alterações e clique em Salvar.' })}</span>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-red-100 text-red-700 rounded-lg dark:bg-red-900/30 dark:text-red-400"><Trash2 size={18}/></div>
                            <div>
                                <strong className="block text-sm text-slate-900 dark:text-slate-100">{t('help_companies_action_delete_title', { defaultValue: 'Excluir' })}</strong>
                                <span className="text-xs text-slate-500 dark:text-slate-400">{t('help_companies_action_delete_desc', { defaultValue: 'Use o botão de lixeira na lista para remover um registro. Cuidado: essa ação é irreversível.' })}</span>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg dark:bg-blue-900/30 dark:text-blue-400"><Search size={18}/></div>
                            <div>
                                <strong className="block text-sm text-slate-900 dark:text-slate-100">{t('help_companies_action_search_title', { defaultValue: 'Pesquisar' })}</strong>
                                <span className="text-xs text-slate-500 dark:text-slate-400">{t('help_companies_action_search_desc', { defaultValue: 'Utilize o campo de busca acima da lista para filtrar por Nome ou CNPJ.' })}</span>
                            </div>
                        </div>
                    </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 flex items-start gap-3">
              <Info className="text-blue-600 dark:text-blue-400 flex-none mt-1" size={20}/> 
              <div>
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">{t('help_companies_tip_title', { defaultValue: 'Dica Importante' })}</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {t('help_companies_tip_desc', { defaultValue: 'Sempre verifique se a empresa já existe usando a busca antes de cadastrar uma nova. O CNPJ deve ser único no sistema.' })}
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
                <Users className="text-blue-600 dark:text-blue-400" /> {t('help_topic_users', { defaultValue: 'Usuários' })}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                {t('help_users_intro', { defaultValue: 'Gerencie os acessos ao sistema, vinculando colaboradores a perfis de usuário.' })}
                </p>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950 shadow-sm">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <FileText size={18} /> {t('help_users_guide_title', { defaultValue: 'Guia de Preenchimento' })}
              </div>
              <div className="p-6 space-y-6">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">{t('help_users_section_basic_title', { defaultValue: '1. Dados Básicos' })}</h3>
                        <ul className="space-y-3">
                            <li className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                                <span className="font-semibold text-slate-800 dark:text-slate-200 w-24 flex-none">{t('help_users_field_code_label', { defaultValue: 'Código:' })}</span>
                                <span>{t('help_users_field_code_desc', { defaultValue: 'Gerado automaticamente pelo sistema.' })}</span>
                            </li>
                            <li className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                                <span className="font-semibold text-slate-800 dark:text-slate-200 w-24 flex-none">{t('help_users_field_status_label', { defaultValue: 'Status:' })}</span>
                                <span>{t('help_users_field_status_desc', { defaultValue: 'Defina como Ativo para permitir login.' })}</span>
                            </li>
                            <li className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                                <span className="font-semibold text-slate-800 dark:text-slate-200 w-24 flex-none">{t('help_users_field_employee_label', { defaultValue: 'Colaborador:' })}</span>
                                <span>
                                    {t('help_users_field_employee_desc_before', { defaultValue: 'Use o botão de lupa' })}{' '}
                                    <Search size={14} className="inline" />{' '}
                                    {t('help_users_field_employee_desc_after', { defaultValue: 'para buscar um colaborador já cadastrado. Isso preencherá automaticamente Nome, CPF, E-mail e Vínculos (Empresa, UG, Centro de Custo).' })}
                                </span>
                            </li>
                        </ul>
                    </div>
                    <div>
                         <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">{t('help_users_section_security_title', { defaultValue: '2. Acesso e Segurança' })}</h3>
                         <ul className="space-y-3">
                            <li className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                                <span className="font-semibold text-slate-800 dark:text-slate-200 w-32 flex-none">{t('help_users_field_username_label', { defaultValue: 'Nome de Usuário:' })}</span>
                                <span>{t('help_users_field_username_desc', { defaultValue: 'Identificador para login (ex: nome.sobrenome).' })}</span>
                            </li>
                            <li className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                                <span className="font-semibold text-slate-800 dark:text-slate-200 w-32 flex-none">{t('help_users_field_password_label', { defaultValue: 'Senha:' })}</span>
                                <span>{t('help_users_field_password_desc', { defaultValue: 'Obrigatória no cadastro. Deve ser confirmada no campo ao lado.' })}</span>
                            </li>
                            <li className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                                <span className="font-semibold text-slate-800 dark:text-slate-200 w-32 flex-none">{t('help_users_field_links_label', { defaultValue: 'Vínculos:' })}</span>
                                <span>{t('help_users_field_links_desc', { defaultValue: 'Empresa, UG e Centro de Custos definem o escopo de dados que o usuário poderá ver.' })}</span>
                            </li>
                         </ul>
                    </div>
                 </div>

                 <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800 mt-4">
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">{t('help_users_modals_title', { defaultValue: 'Funcionalidades de Busca (Modais)' })}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        {t('help_users_modals_desc', { defaultValue: 'Vários campos possuem um botão de lupa ao lado. Ao clicar, uma janela se abre permitindo pesquisar registros existentes.' })}
                    </p>
                    <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-400">
                        <li><strong>{t('help_users_modals_item_employee_label', { defaultValue: 'Colaborador:' })}</strong> {t('help_users_modals_item_employee_desc', { defaultValue: 'Busca por nome, e-mail ou matrícula.' })}</li>
                        <li><strong>{t('help_users_modals_item_scope_label', { defaultValue: 'Empresa/UG/Centro de Custo:' })}</strong> {t('help_users_modals_item_scope_desc', { defaultValue: 'Busca por nome ou código.' })}</li>
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
                  <Layers className="text-blue-600 dark:text-blue-400" /> {t('help_topic_ugs', { defaultValue: 'UGs' })}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 text-lg">
                  {t('help_ugs_intro', { defaultValue: 'Estruture a hierarquia da organização através das Unidades Gerenciais.' })}
                  </p>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950 shadow-sm">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <FileText size={18} /> {t('help_ugs_details_title', { defaultValue: 'Detalhes do Cadastro' })}
                </div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">{t('help_ugs_unit_type_label', { defaultValue: 'Tipo da Unidade' })}</label>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{t('help_ugs_unit_type_desc', { defaultValue: 'Classifique a UG conforme sua função:' })}</p>
                            <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-400 space-y-1">
                                <li>{t('help_ugs_unit_type_item_admin', { defaultValue: 'Administrativa' })}</li>
                                <li>{t('help_ugs_unit_type_item_productive', { defaultValue: 'Produtiva' })}</li>
                                <li>{t('help_ugs_unit_type_item_support', { defaultValue: 'Apoio' })}</li>
                                <li>{t('help_ugs_unit_type_item_aux', { defaultValue: 'Auxiliares' })}</li>
                            </ul>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">{t('help_ugs_hierarchy_label', { defaultValue: 'Nível Hierárquico' })}</label>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{t('help_ugs_hierarchy_desc', { defaultValue: 'Define a posição da UG na árvore da empresa:' })}</p>
                            <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-400 space-y-1">
                                <li><strong>{t('help_ugs_hierarchy_item_ceo_label', { defaultValue: 'CEO:' })}</strong> {t('help_ugs_hierarchy_item_ceo_desc', { defaultValue: 'Nível máximo (não possui UG Superior).' })}</li>
                                <li><strong>{t('help_ugs_hierarchy_item_other_label', { defaultValue: 'Diretoria, Gerência, etc.:' })}</strong> {t('help_ugs_hierarchy_item_other_desc', { defaultValue: 'Níveis subordinados (exigem UG Superior).' })}</li>
                            </ul>
                        </div>
                    </div>

                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-lg">
                        <h4 className="text-yellow-800 dark:text-yellow-400 font-semibold text-sm mb-1">{t('help_ugs_callout_title', { defaultValue: 'Atenção ao Hierarquia' })}</h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-500">
                            {t('help_ugs_callout_desc', { defaultValue: 'Se você selecionar um nível diferente de CEO, o campo UG Superior (Pai) torna-se obrigatório. Você deve selecionar a qual unidade esta nova UG responde.' })}
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">{t('help_ugs_required_links_title', { defaultValue: 'Vínculos Obrigatórios' })}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                            {t('help_ugs_required_links_intro', { defaultValue: 'Para garantir a integridade dos dados, é necessário vincular:' })}
                        </p>
                        <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-400 space-y-2">
                            <li><strong>{t('help_ugs_required_links_item_company_label', { defaultValue: 'Empresa:' })}</strong> {t('help_ugs_required_links_item_company_desc', { defaultValue: 'A qual organização a UG pertence.' })}</li>
                            <li><strong>{t('help_ugs_required_links_item_owner_label', { defaultValue: 'Responsável:' })}</strong> {t('help_ugs_required_links_item_owner_desc', { defaultValue: 'Quem responde pela unidade (busque na lista de colaboradores).' })}</li>
                        </ul>
                    </div>
                </div>
              </div>
            </div>
          );



      case 'cronogramas':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-2">
                <Calendar className="text-blue-600 dark:text-blue-400" /> {t('tab_cronograma') || 'Cronogramas'}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                {t('help_cronogramas_intro', { defaultValue: 'Organize e acompanhe as atividades de revisão, distribuindo tarefas e monitorando prazos.' })}
                </p>
            </div>
            
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950 shadow-sm">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <FileText size={18} /> {t('help_cronogramas_guide_title', { defaultValue: 'Guia de Utilização' })}
              </div>
              <div className="p-6 space-y-8">
                {/* Passo 1 */}
                <div className="flex gap-4">
                  <div className="flex-none flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm ring-4 ring-blue-50 dark:ring-blue-900/20 dark:bg-blue-900 dark:text-blue-300">1</div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg mb-1">{t('help_cronogramas_step1_title', { defaultValue: 'Seleção Inicial' })}</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-2">
                        {t('help_cronogramas_step1_desc', { defaultValue: 'Para acessar ou criar um cronograma, primeiro utilize os filtros no topo da tela:' })}
                    </p>
                    <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-400 space-y-1">
                        <li><strong>{t('help_cronogramas_step1_item_period_label', { defaultValue: 'Período:' })}</strong> {t('help_cronogramas_step1_item_period_desc', { defaultValue: 'Selecione o período de revisão desejado.' })}</li>
                        <li><strong>{t('help_cronogramas_step1_item_user_label', { defaultValue: 'Usuário:' })}</strong> {t('help_cronogramas_step1_item_user_desc', { defaultValue: 'Escolha o responsável pelas atividades (opcional para visão geral).' })}</li>
                    </ul>
                  </div>
                </div>

                {/* Passo 2 */}
                <div className="flex gap-4">
                  <div className="flex-none flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm ring-4 ring-blue-50 dark:ring-blue-900/20 dark:bg-blue-900 dark:text-blue-300">2</div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg mb-1">{t('help_cronogramas_step2_title', { defaultValue: 'Gerar ou Visualizar Cronograma' })}</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                        {t('help_cronogramas_step2_desc', { defaultValue: 'Se não houver cronograma para a combinação selecionada, clique em Gerar Cronograma. O sistema criará a estrutura base para o usuário selecionado naquele período.' })}
                    </p>
                  </div>
                </div>

                {/* Passo 3 */}
                <div className="flex gap-4">
                  <div className="flex-none flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm ring-4 ring-blue-50 dark:ring-blue-900/20 dark:bg-blue-900 dark:text-blue-300">3</div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg mb-1">{t('help_cronogramas_step3_title', { defaultValue: 'Gerenciamento de Tarefas' })}</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-3">
                        {t('help_cronogramas_step3_desc', { defaultValue: 'Adicione e gerencie os itens do cronograma:' })}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                            <strong className="block mb-2 text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-1">{t('help_cronogramas_step3_card_edit_title', { defaultValue: 'Adicionar/Editar' })}</strong>
                            <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-400 space-y-2">
                                <li>{t('help_cronogramas_step3_card_edit_item1', { defaultValue: 'Clique em Novo Item para adicionar uma tarefa.' })}</li>
                                <li>{t('help_cronogramas_step3_card_edit_item2', { defaultValue: 'Defina Datas de Início e Fim, Responsável e Progresso.' })}</li>
                                <li>{t('help_cronogramas_step3_card_edit_item3', { defaultValue: 'Clique sobre uma tarefa na lista para editá-la.' })}</li>
                            </ul>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                            <strong className="block mb-2 text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-1">{t('help_cronogramas_step3_card_evidence_title', { defaultValue: 'Evidências' })}</strong>
                            <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-400 space-y-2">
                                <li>{t('help_cronogramas_step3_card_evidence_item1', { defaultValue: 'Ao editar uma tarefa, você pode enviar arquivos.' })}</li>
                                <li>{t('help_cronogramas_step3_card_evidence_item2', { defaultValue: 'Use a coluna de upload na tabela para envio rápido.' })}</li>
                                <li>{t('help_cronogramas_step3_card_evidence_item3', { defaultValue: 'Formatos aceitos: Documentos e Imagens.' })}</li>
                            </ul>
                        </div>
                    </div>
                  </div>
                </div>

                {/* Passo 4 */}
                <div className="flex gap-4">
                  <div className="flex-none flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm ring-4 ring-blue-50 dark:ring-blue-900/20 dark:bg-blue-900 dark:text-blue-300">4</div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg mb-1">{t('help_cronogramas_step4_title', { defaultValue: 'Status e Encerramento' })}</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                        {t('help_cronogramas_step4_desc', { defaultValue: 'Acompanhe o status de cada tarefa (Pendente, Em Andamento, Concluída, Atrasada). Ao finalizar todas as atividades, use a opção Encerrar Cronograma para travar edições e finalizar o ciclo.' })}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        );

      case 'reviews':
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-2">
                        <ClipboardCheck className="text-blue-600 dark:text-blue-400" /> {t('help_reviews_flow_title', { defaultValue: 'Revisão de Vidas Úteis' })}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-lg">
                        {t('help_reviews_intro', { defaultValue: 'O módulo de Revisões permite o gerenciamento completo do ciclo de vida útil dos ativos, desde a abertura do período até a aprovação final. Siga o guia abaixo para entender cada etapa.' })}
                    </p>
                </div>
                
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950 shadow-sm">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <FileText size={18} /> {t('help_reviews_guide_title', { defaultValue: 'Guia detalhado' })}
                    </div>
                    
                    <div className="p-6 space-y-8">
                        {[
                            {
                                id: 1,
                                title: t('help_reviews_step1_title', { defaultValue: '1. Gestão de períodos' }),
                                desc: t('help_reviews_step1_desc', { defaultValue: 'Tudo começa com a criação de um Período de Revisão.' }),
                                details: t('help_reviews_step1_details', { defaultValue: 'Defina datas, empresa/UG (se aplicável) e o responsável pelo período.' })
                            },
                            {
                                id: 2,
                                title: t('help_reviews_step2_title', { defaultValue: '2. Importação da base' }),
                                desc: t('help_reviews_step2_desc', { defaultValue: 'Carregue os ativos que serão revisados.' }),
                                details: t('help_reviews_step2_details', { defaultValue: 'Importe a planilha/base do período e valide os campos antes de avançar.' })
                            },
                            {
                                id: 3,
                                title: t('help_reviews_step3_title', { defaultValue: '3. Delegação de itens' }),
                                desc: t('help_reviews_step3_desc', { defaultValue: 'Distribua o trabalho para os revisores.' }),
                                details: t('help_reviews_step3_details', { defaultValue: 'Use filtros (UG/CC/classe/valor) e atribua itens aos usuários.' })
                            },
                            {
                                id: 4,
                                title: t('help_reviews_step4_title', { defaultValue: '4. Realizando a revisão' }),
                                desc: t('help_reviews_step4_desc', { defaultValue: 'Execute o trabalho técnico de análise dos ativos.' }),
                                details: t('help_reviews_step4_details', { defaultValue: 'Ajuste vida útil/data fim quando necessário, selecione o motivo e registre a justificativa.' })
                            },
                            {
                                id: 5,
                                title: t('help_reviews_step5_title', { defaultValue: '5. Supervisão e aprovação' }),
                                desc: t('help_reviews_step5_desc', { defaultValue: 'Etapa de controle de qualidade e fechamento.' }),
                                details: t('help_reviews_step5_details', { defaultValue: 'O supervisor aprova/rejeita; após o fechamento do período, revisões ficam bloqueadas.' })
                            }
                        ].map((step) => (
                             <div key={step.id} className="flex gap-4">
                                <div className="flex-none flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm ring-4 ring-blue-50 dark:ring-blue-900/20 dark:bg-blue-900 dark:text-blue-300">
                                    {step.id}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg mb-1">{step.title}</h3>
                                    <p className="text-slate-700 dark:text-slate-300 font-medium mb-1">{step.desc}</p>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{step.details}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );

      case 'supervision':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-2">
                <ClipboardCheck className="text-blue-600 dark:text-blue-400" /> {t('help_supervision_title') || 'Supervisão RVU'}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                {t('help_supervision_intro') || 'Gerencie, aprove ou reverta as revisões de vida útil realizadas pelos revisores.'}
                </p>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950 shadow-sm">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <FileText size={18} /> {t('help_supervision_flow_title') || 'Fluxo de Supervisão'}
              </div>
              <div className="p-6 space-y-6">
                 
                 {/* Auto-Aprovação */}
                 <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800">
                    <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
                        <ClipboardCheck size={20}/> {t('help_supervision_auto_title') || 'Aprovação Automática'}
                    </h3>
                    <p className="text-sm text-green-800 dark:text-green-300 mb-2">
                        {t('help_supervision_auto_desc') || 'Para agilizar o processo, o sistema aprova automaticamente itens que atendem aos seguintes critérios simultaneamente:'}
                    </p>
                    <ul className="list-disc pl-5 text-sm text-green-700 dark:text-green-400 space-y-1">
                        <li>{t('help_supervision_auto_item_action') || 'Ação: o revisor selecionou "Manter" (sem alteração de vida útil).'}</li>
                        <li>{t('help_supervision_auto_item_remaining_life') || 'Vida Útil Restante: o bem possui mais de 18 meses de vida útil restante.'}</li>
                    </ul>
                    <p className="text-xs text-green-600 dark:text-green-500 mt-2 italic">
                        {t('help_supervision_auto_note') || 'Nota: o usuário é notificado imediatamente quando um item é auto-aprovado.'}
                    </p>
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">{t('help_supervision_queue_title') || '1. Fila de Supervisão'}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                            {t('help_supervision_queue_desc') || 'Os itens revisados aparecem na aba Revisados aguardando sua análise. Você pode filtrar por status:'}
                        </p>
                        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                            <li>{t('help_supervision_queue_status_reviewed') || 'Revisado: itens que foram alterados ou justificados pelo revisor.'}</li>
                            <li>{t('help_supervision_queue_status_approved') || 'Aprovado: itens já validados (manualmente ou automaticamente).'} </li>
                            <li>{t('help_supervision_queue_status_reverted') || 'Revertido: itens devolvidos para correção.'}</li>
                        </ul>
                    </div>
                    <div>
                         <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">{t('help_supervision_actions_title') || '2. Ações do Supervisor'}</h3>
                         <ul className="space-y-3">
                            <li className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-100 dark:border-slate-800">
                                <strong className="block text-blue-600 dark:text-blue-400 mb-1">{t('help_supervision_action_approve_title') || 'Aprovar'}</strong>
                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                    {t('help_supervision_action_approve_desc') || 'Valida a revisão. O item sai da fila de pendências e o novo valor de vida útil é confirmado.'}
                                </span>
                            </li>
                            <li className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-100 dark:border-slate-800">
                                <strong className="block text-orange-600 dark:text-orange-400 mb-1">{t('help_supervision_action_revert_title') || 'Reverter'}</strong>
                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                    {t('help_supervision_action_revert_desc') || 'Devolve o item para o revisor. Importante: a delegação é reativada para que o revisor possa ver e corrigir o item em sua lista.'}
                                </span>
                            </li>
                         </ul>
                    </div>
                 </div>

              </div>
            </div>
          </div>
        );

      case 'tips':
         return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                 <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Info className="text-blue-600 dark:text-blue-400" /> {t('help_topic_tips', { defaultValue: 'Dicas Gerais' })}
                 </h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        t('help_tip_filters', { defaultValue: 'Use os filtros para encontrar itens rapidamente.' }),
                        t('help_tip_shortcuts', { defaultValue: 'Use o menu lateral para navegar entre módulos.' }),
                        t('help_tip_permissions', { defaultValue: 'Se não conseguir acessar algo, verifique suas permissões.' })
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
        return <div className="text-slate-500">{t('help_select_topic', { defaultValue: 'Selecione um tópico.' })}</div>;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] gap-6 p-4">
      {/* Sidebar */}
      <aside className="w-full md:w-72 flex-none flex flex-col gap-2 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm h-full overflow-y-auto">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 px-2 flex items-center gap-2">
            <Menu size={20} />
            {t('help_title', { defaultValue: 'Central de Ajuda' })}
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
