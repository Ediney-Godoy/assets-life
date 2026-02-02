import React, { useState, useEffect, useMemo } from 'react';

import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { ThemeProvider } from './theme/ThemeProvider';

import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DynamicTabs from './components/DynamicTabs';
import DashboardPage from './pages/Dashboard';
import CompaniesPage from './pages/Companies';
import RelatoriosRVUView from './pages/RelatoriosRVUView';
import SupervisaoRVUView from './pages/SupervisaoRVUView';
import EmployeesPage from './pages/Employees';
import ManagementUnitsPage from './pages/ManagementUnits';
import TabsDemo from './pages/TabsDemo';
import ReviewsMenu from './pages/ReviewsMenu';
const ReviewsPageLazy = React.lazy(() => import('./pages/Reviews'));
import DelegacaoPage from './pages/Delegacao';
import RevisaoVidasUteis from './pages/RevisaoVidasUteis';
import MassRevisionView from './pages/MassRevisionView';
import CostCentersPage from './pages/CostCenters';
import UsersPage from './pages/Users';
import PermissionsPage from './pages/Permissions';
import AssetSpeciesPage from './pages/AssetSpecies';
import ClassesContabeisPage from './pages/ClassesContabeis';
import AssetsPage from './pages/Assets';
import ContasContabeisPage from './pages/ContasContabeis';
import ReportUsefulLifePage from './pages/ReportUsefulLife';
import ReportsMenu from './pages/ReportsMenu';
import PermissionsMenu from './pages/PermissionsMenu';
import CronogramaRevisao from './pages/CronogramaRevisao';
import CronogramasMenu from './pages/CronogramasMenu';
import NotificationsPage from './pages/Notifications';
import NotificationDetailPage from './pages/NotificationDetail';
import NotificationSendPage from './pages/NotificationSend';
import AboutPage from './pages/About';
import HelpPage from './pages/Help';
import ErrorBoundary from './components/ErrorBoundary';
import LoginPage from './pages/Login';
import ForgotPasswordPage from './pages/ForgotPassword';
import ResetPasswordPage from './pages/ResetPassword';
import FirstAccessPage from './pages/FirstAccess';
import { clearToken, getHealth } from './apiClient';
import SelectCompanyPage from './pages/SelectCompany';

export default function App() {
  const { t, i18n } = useTranslation();
  const [backendStatus, setBackendStatus] = useState('checking');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem('assetlife_sidebar_collapsed') === '1'; } catch { return false; }
  });

  // Detectar erros de chunk/module loading e recarregar automaticamente
  useEffect(() => {
    // Limpar flag de reload quando app carrega com sucesso
    sessionStorage.removeItem('chunk_reload_attempted');

    const handleChunkError = (event) => {
      const isChunkError = event.message?.includes('Failed to fetch dynamically imported module') ||
                          event.message?.includes('Falha ao buscar o módulo importado dinamicamente') ||
                          event.reason?.message?.includes('Failed to fetch dynamically imported module');

      if (isChunkError) {
        console.log('Detectado erro de carregamento de chunk. Recarregando página...');
        // Evitar loop infinito - só recarrega uma vez
        const hasReloaded = sessionStorage.getItem('chunk_reload_attempted');
        if (!hasReloaded) {
          sessionStorage.setItem('chunk_reload_attempted', 'true');
          window.location.reload();
        }
      }
    };

    window.addEventListener('error', handleChunkError);
    window.addEventListener('unhandledrejection', handleChunkError);

    return () => {
      window.removeEventListener('error', handleChunkError);
      window.removeEventListener('unhandledrejection', handleChunkError);
    };
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('assetlife_sidebar_collapsed');
      if (stored === null) {
        const w = window.innerWidth || 0;
        const shouldCollapse = w < 1024; // md e abaixo por padrão
        setSidebarCollapsed(shouldCollapse);
        localStorage.setItem('assetlife_sidebar_collapsed', shouldCollapse ? '1' : '0');
      }
    } catch {}
  }, []);
  const location = useLocation();
  const navigate = useNavigate();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const checkBackend = async () => {
    try {
      const res = await getHealth({ timeout: 3000 });
      setBackendStatus(res ? 'ok' : 'error');
    } catch (err) {
      setBackendStatus('error');
    }
  };

  useEffect(() => {
    setBackendStatus('checking');
    checkBackend();
    
    // Verificação periódica do backend a cada 30 segundos
    const interval = setInterval(() => {
      checkBackend();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const initialTabs = useMemo(() => [
    { id: 'home', title: 'Home', content: null, isClosable: false },
  ], []);

  const authRoutes = ['/login', '/forgot-password', '/reset-password', '/first-access'];
  const isAuthRoute = authRoutes.some((p) => location.pathname.startsWith(p));

  function RequireCompany({ children }) {
    try {
      const raw = localStorage.getItem('assetlife_permissoes');
      const perms = raw ? JSON.parse(raw) : null;
      const empresaIds = Array.isArray(perms?.empresas_ids) ? perms.empresas_ids : [];
      const selected = localStorage.getItem('assetlife_empresa');
      // Se há mais de uma empresa e nenhuma selecionada, redireciona para seleção
      if (empresaIds.length > 1 && !selected) {
        return <Navigate to="/select-company" replace />;
      }
      // Se há exatamente uma, garante seleção
      if (empresaIds.length === 1 && !selected) {
        try { localStorage.setItem('assetlife_empresa', String(empresaIds[0])); } catch {}
      }
    } catch {}
    return children;
  }

  const handleLogout = () => {
    try { localStorage.removeItem('assetlife_user'); } catch {}
    clearToken();
    navigate('/login', { replace: true });
  };

  function RequireAuth({ children }) {
    const token = (() => { try { return localStorage.getItem('assetlife_token'); } catch { return null; } })();
    if (!token) return <Navigate to="/login" replace state={{ from: location }} />;
    return children;
  }

  function RequirePermission({ route, children }) {
    try {
      const raw = localStorage.getItem('assetlife_permissoes');
      const rotas = raw ? JSON.parse(raw)?.rotas : [];
      const allowed = new Set(Array.isArray(rotas) ? rotas : []);
      const altList = {
        '/reviews/massa': ['/revisoes-massa'],
        // RVU: aceitar rotas alternativas antigas e o menu de relatórios
        '/relatorios-rvu': ['/relatorios/rvu', '/reports', '/reports/vida-util'],
        '/reviews/vidas-uteis': ['/revisoes/vidas-uteis', '/revisao/vidas-uteis', '/reviews/rvu'],
        // Notificações: permitir variação em PT
        '/notifications/new': ['/notificacoes/nova'],
      };
      const alts = altList[route] || [];
      const ok = (
        allowed.size === 0
          ? route === '/dashboard'
          : (allowed.has(route) || alts.some((a) => allowed.has(a)))
      );
      if (!ok) return <Navigate to="/dashboard" replace state={{ denied: route }} />;
    } catch {}
    return children;
  }

  return (
    <ThemeProvider>
      <div className="h-screen flex" style={{ background: 'var(--bg-secondary)' }}>
        {!isAuthRoute && <Sidebar collapsed={sidebarCollapsed} />}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!isAuthRoute && (
            <Header
              backendStatus={backendStatus}
              language={i18n.language}
              onLanguageChange={changeLanguage}
              onLogout={handleLogout}
              onChangeCompany={() => navigate('/select-company')}
              collapsed={sidebarCollapsed}
              onToggleSidebar={() => {
                setSidebarCollapsed((prev) => {
                  const next = !prev;
                  try { localStorage.setItem('assetlife_sidebar_collapsed', next ? '1' : '0'); } catch {}
                  return next;
                });
              }}
            />
          )}
          <main className="container-page scrollbar-stable">
            <ErrorBoundary>
            {!isAuthRoute && <DynamicTabs initialTabs={initialTabs} hideBody />}
            <Routes>
              {/* Auth routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/first-access" element={<RequireAuth><FirstAccessPage /></RequireAuth>} />

              {/* Company selection */}
              <Route path="/select-company" element={<RequireAuth><SelectCompanyPage /></RequireAuth>} />

              {/* Protected routes */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<RequireAuth><RequireCompany><DashboardPage t={t} /></RequireCompany></RequireAuth>} />
              <Route path="/cadastros" element={<RequireAuth><RequireCompany><DashboardPage t={t} registrationsOnly /></RequireCompany></RequireAuth>} />
              <Route path="/companies" element={<RequireAuth><RequireCompany><CompaniesPage /></RequireCompany></RequireAuth>} />
              <Route path="/relatorios-rvu" element={<RequireAuth><RequirePermission route="/relatorios-rvu"><RequireCompany><RelatoriosRVUView /></RequireCompany></RequirePermission></RequireAuth>} />
              <Route path="/relatorios/rvu" element={<RequireAuth><RequirePermission route="/relatorios-rvu"><RequireCompany><RelatoriosRVUView /></RequireCompany></RequirePermission></RequireAuth>} />
              <Route path="/supervisao-rvu" element={<RequireAuth><RequirePermission route="/supervisao/rvu"><SupervisaoRVUView /></RequirePermission></RequireAuth>} />
              <Route path="/employees" element={<RequireAuth><EmployeesPage /></RequireAuth>} />
              <Route path="/ugs" element={<RequireAuth><ManagementUnitsPage /></RequireAuth>} />
              <Route path="/tabs-demo" element={<RequireAuth><TabsDemo /></RequireAuth>} />
              <Route path="/assets" element={<RequireAuth><RequireCompany><AssetsPage /></RequireCompany></RequireAuth>} />
              <Route path="/asset-species" element={<RequireAuth><AssetSpeciesPage /></RequireAuth>} />
              <Route path="/classes-contabeis" element={<RequireAuth><RequireCompany><ClassesContabeisPage /></RequireCompany></RequireAuth>} />
              <Route path="/contas-contabeis" element={<RequireAuth><RequireCompany><ContasContabeisPage /></RequireCompany></RequireAuth>} />
              <Route path="/reviews" element={<RequireAuth><ReviewsMenu /></RequireAuth>} />
              <Route path="/reviews/periodos" element={<RequireAuth><RequirePermission route="/reviews/periodos"><ErrorBoundary><React.Suspense fallback={<div className="p-4">Carregando…</div>}><ReviewsPageLazy /></React.Suspense></ErrorBoundary></RequirePermission></RequireAuth>} />
              <Route path="/reviews/cronogramas" element={<RequireAuth><RequirePermission route="/reviews/cronogramas"><CronogramasMenu /></RequirePermission></RequireAuth>} />
              <Route path="/reviews/cronogramas/view" element={<RequireAuth><RequirePermission route="/reviews/cronogramas"><CronogramaRevisao /></RequirePermission></RequireAuth>} />
              <Route path="/reviews/delegacao" element={<RequireAuth><RequirePermission route="/reviews/delegacao"><DelegacaoPage /></RequirePermission></RequireAuth>} />
              <Route path="/reviews/vidas-uteis" element={<RequireAuth><RequirePermission route="/reviews/vidas-uteis"><RevisaoVidasUteis /></RequirePermission></RequireAuth>} />
              <Route path="/reviews/massa" element={<RequireAuth><RequirePermission route="/reviews/massa"><MassRevisionView /></RequirePermission></RequireAuth>} />
              <Route path="/revisoes-massa" element={<RequireAuth><RequireCompany><RequirePermission route="/revisoes-massa"><MassRevisionView /></RequirePermission></RequireCompany></RequireAuth>} />
              <Route path="/cost-centers" element={<RequireAuth><RequireCompany><CostCentersPage /></RequireCompany></RequireAuth>} />
              <Route path="/reports" element={<RequireAuth><RequireCompany><ReportsMenu /></RequireCompany></RequireAuth>} />
              <Route path="/reports/vida-util" element={<RequireAuth><RequireCompany><ReportUsefulLifePage /></RequireCompany></RequireAuth>} />
              <Route path="/permissions" element={<RequireAuth><RequireCompany><PermissionsMenu /></RequireCompany></RequireAuth>} />
              <Route path="/permissions/groups" element={<RequireAuth><RequireCompany><ErrorBoundary><PermissionsPage /></ErrorBoundary></RequireCompany></RequireAuth>} />
              <Route path="/notifications" element={<RequireAuth><RequireCompany><NotificationsPage /></RequireCompany></RequireAuth>} />
              <Route path="/notifications/new" element={<RequireAuth><RequireCompany><RequirePermission route="/notifications/new"><NotificationSendPage /></RequirePermission></RequireCompany></RequireAuth>} />
              <Route path="/notifications/:id" element={<RequireAuth><RequireCompany><NotificationDetailPage /></RequireCompany></RequireAuth>} />
              <Route path="/users" element={<RequireAuth><RequireCompany><UsersPage /></RequireCompany></RequireAuth>} />
              <Route path="/about" element={<RequireAuth><AboutPage /></RequireAuth>} />
              <Route path="/help" element={<RequireAuth><HelpPage /></RequireAuth>} />
            </Routes>
            </ErrorBoundary>
            <Toaster position="top-right" toastOptions={{
              style: { background: '#111827', color: '#F9FAFB' },
            }} />
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}

function Section({ title, body }) {
  return (
    <section>
      <h2 className="text-2xl font-semibold mb-2 text-slate-900 dark:text-slate-100">{title}</h2>
      <p className="text-slate-700 dark:text-slate-300">{body}</p>
    </section>
  );
}
