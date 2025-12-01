import React from 'react';
import { Plus, X } from 'lucide-react';
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Placeholder de conteÃºdo para novas abas
function Placeholder({ title = 'Bem-vindo', body = 'Selecione ou crie uma nova aba.' }) {
  return (
    <div className="p-4 text-slate-800 dark:text-slate-200">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-slate-600 dark:text-slate-300">{body}</p>
    </div>
  );
}

// DynamicTabs: sistema de abas dinÃ¢micas inspirado em navegadores web
export default function DynamicTabs({ initialTabs, hideBody = false }) {
  // Estado das abas e aba ativa
  const [tabs, setTabs] = React.useState(() => {
    if (Array.isArray(initialTabs) && initialTabs.length > 0) return initialTabs;
    const homeId = `home-${Date.now()}`;
    return [
      {
        id: homeId,
        title: 'Dashboard',
        content: <Placeholder title="Dashboard" body="Aba fixa de entrada." />,
        isClosable: false,
      },
    ];
  });
  const [activeTabId, setActiveTabId] = React.useState(() => tabs[0]?.id);
  const counterRef = React.useRef(0);
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const { t } = useTranslation();

  const getTitleFromPath = React.useCallback((path) => {
    const map = {
      '/dashboard': t('nav_dashboard') || 'Dashboard',
      '/cadastros': t('nav_registrations') || 'Cadastros',
      '/companies': 'Empresas',
      '/employees': 'Colaboradores',
      '/ugs': 'Unidades Gerenciais',
      '/assets': t('nav_assets') || 'Ativos',
      '/reviews': 'Delegações',
      '/reviews/delegacao': 'Delegações',
      '/reviews/vidas-uteis': 'Revisão de Vidas Úteis',
      '/cost-centers': t('cost_centers_title') || 'Centros de Custos',
      '/reports': t('nav_reports') || 'Relatórios',
      '/about': t('nav_about') || 'Sobre',
      '/help': t('nav_help') || 'Ajuda',
      '/permissions': t('nav_permissions') || 'Permissões',
      '/tabs-demo': 'Abas',
      '/users': 'Usuários',
      '/notifications': t('notifications') || 'Notificações',
      '/notifications/new': t('send_notification') || 'Enviar Notificação',
    };
    if (map[path]) return map[path];
    if (path.startsWith('/notifications/')) return t('notification') || 'Notificação';
    return undefined;
  }, [t]);

  // Sincroniza a rota e, se for navegação do usuário (PUSH), atualiza o título da aba ativa
  React.useEffect(() => {
    const nextTitle = getTitleFromPath(location.pathname);
    setTabs((prev) => prev.map((tab) => {
      if (tab.id !== activeTabId) return tab;
      const title = nextTitle || tab.title; // sempre sincroniza com a rota atual
      return { ...tab, path: location.pathname, title };
    }));
  }, [location.pathname, activeTabId, getTitleFromPath]);

  // Adicionar nova aba
  const handleNewTab = React.useCallback((type = 'generic', data = {}) => {
    counterRef.current += 1;
    const id = `tab-${Date.now()}-${counterRef.current}`;

    // ConteÃºdo da aba conforme o tipo
    let title = 'Nova Aba';
    let content = <Placeholder title="Nova Aba" body="ConteÃºdo genÃ©rico." />;
    if (type === 'cadastro') {
      title = 'Cadastro';
      content = <Placeholder title="Cadastro" body="FormulÃ¡rio de cadastro (placeholder)." />;
    } else if (type === 'consulta') {
      title = data?.title || 'Consulta';
      content = (
        <Placeholder
          title={title}
          body={`Consulta dinÃ¢mica: ${data?.resource || 'recurso'}`}
        />
      );
    }

    const newTab = { id, title, content, isClosable: true };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(id);
  }, []);

  // Fechar aba especÃ­fica
  const handleCloseTab = React.useCallback((tabId) => {
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.id === tabId);
      if (idx === -1) return prev;
      const nextTabs = [...prev.slice(0, idx), ...prev.slice(idx + 1)];

      // Se a aba fechada era a ativa, mover foco
      if (tabId === activeTabId) {
        const fallbackIdx = Math.max(0, idx - 1);
        const nextActive = nextTabs[fallbackIdx]?.id ?? nextTabs[0]?.id;
        setActiveTabId(nextActive);
      }
      return nextTabs;
    });
  }, [activeTabId]);

  // Mudar aba ativa
  const handleChangeTab = React.useCallback((tabId) => {
    setActiveTabId(tabId);
    const t = tabs.find((x) => x.id === tabId);
    if (t?.path) navigate(t.path, { replace: true });
  }, [tabs, navigate]);

  // RenderizaÃ§Ã£o
  const activeTab = React.useMemo(() => tabs.find((t) => t.id === activeTabId), [tabs, activeTabId]);

  return (
    <div className="w-full">
      {/* Barra de cabeÃ§alhos das abas */}
      <div className="flex items-center overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              className={
                `group flex items-center max-w-[220px] mr-1 rounded-t-md border ` +
                `${isActive ? 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 -mb-px' : 'bg-slate-100 dark:bg-slate-800 border-transparent'} `
              }
              title={tab.title}
            >
              <button
                onClick={() => handleChangeTab(tab.id)}
                className={`px-3 py-2 text-sm font-medium truncate ` +
                  `${isActive ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100'}`}
                aria-selected={isActive}
              >
                {tab.title}
              </button>
              {tab.isClosable && (
                <button
                  onClick={() => handleCloseTab(tab.id)}
                  className="ml-1 mr-2 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                  aria-label={`Fechar ${tab.title}`}
                  title="Fechar aba"
                >
                  <X size={16} className="text-slate-700 dark:text-slate-300" />
                </button>
              )}
            </div>
          );
        })}

        {/* BotÃ£o de nova aba */}
        <button
          onClick={() => handleNewTab('generic')}
          className="ml-2 px-2 py-2 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Nova aba"
          aria-label="Nova aba"
        >
          <Plus size={18} className="text-slate-700 dark:text-slate-300" />
        </button>
      </div>

      {/* Corpo da aba ativa */}
     {!hideBody && (
       <div className="border border-slate-300 dark:border-slate-700 rounded-b-md rounded-tr-md bg-white dark:bg-slate-900">
         {activeTab?.content || (
           <div className="p-4 text-slate-600 dark:text-slate-300">Nenhuma aba ativa.</div>
         )}
       </div>
     )}

      {/* AÃ§Ã£o de exemplo para tipos diferentes */}
      </div>
  );
}

// Exemplo de uso integrado em uma pÃ¡gina/demo
export function DynamicTabsExample() {
  const initial = React.useMemo(
    () => [
      {
        id: `home-${Date.now()}`,
        title: 'Home',
        content: <Placeholder title="Home" body="Aba fixa com boas-vindas." />,
        isClosable: false,
      },
    ],
    []
  );

  return (
    <section>
      <DynamicTabs initialTabs={initial} />
    </section>
  );
}
