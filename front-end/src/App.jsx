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
import Reviews from './pages/Reviews';
import DelegacaoPage from './pages/Delegacao';
import RevisaoVidasUteis from './pages/RevisaoVidasUteis';
import MassRevisionView from './pages/MassRevisionView';
import CostCentersPage from './pages/CostCenters';
import UsersPage from './pages/Users';
import PermissionsPage from './pages/Permissions';
import AssetSpeciesPage from './pages/AssetSpecies';
import ReportUsefulLifePage from './pages/ReportUsefulLife';
import ReportsMenu from './pages/ReportsMenu';
import PermissionsMenu from './pages/PermissionsMenu';
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
      const altMap = {
        '/reviews/massa': '/revisoes-massa',
      };
      const alt = altMap[route];
      const ok = (
        allowed.size === 0
          ? route === '/dashboard'
          : allowed.has(route) || (alt ? allowed.has(alt) : false)
      );
      if (!ok) return <Navigate to="/dashboard" replace state={{ denied: route }} />;
    } catch {}
    return children;
  }

  return (
    <ThemeProvider>
      <div className="h-screen flex bg-surface-muted dark:bg-darksurface-muted">
        {!isAuthRoute && <Sidebar />}
        <div className="flex-1 flex flex-col">
          {!isAuthRoute && (
            <Header backendStatus={backendStatus} language={i18n.language} onLanguageChange={changeLanguage} onLogout={handleLogout} onChangeCompany={() => navigate('/select-company')} />
          )}
          <main className="container-page scrollbar-stable">
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
              <Route path="/relatorios-rvu" element={<RequireAuth><RequireCompany><RelatoriosRVUView /></RequireCompany></RequireAuth>} />
              <Route path="/supervisao-rvu" element={<RequireAuth><RequirePermission route="/supervisao/rvu"><SupervisaoRVUView /></RequirePermission></RequireAuth>} />
              <Route path="/employees" element={<RequireAuth><EmployeesPage /></RequireAuth>} />
              <Route path="/ugs" element={<RequireAuth><ManagementUnitsPage /></RequireAuth>} />
              <Route path="/tabs-demo" element={<RequireAuth><TabsDemo /></RequireAuth>} />
              <Route path="/assets" element={<RequireAuth><Section title={t('nav_assets')} body={t('coming_soon')} /></RequireAuth>} />
              <Route path="/asset-species" element={<RequireAuth><AssetSpeciesPage /></RequireAuth>} />
              <Route path="/reviews" element={<RequireAuth><ReviewsMenu /></RequireAuth>} />
              <Route path="/reviews/periodos" element={<RequireAuth><RequirePermission route="/reviews/periodos"><Reviews /></RequirePermission></RequireAuth>} />
              <Route path="/reviews/delegacao" element={<RequireAuth><RequirePermission route="/reviews/delegacao"><DelegacaoPage /></RequirePermission></RequireAuth>} />
              <Route path="/reviews/vidas-uteis" element={<RequireAuth><RequirePermission route="/reviews/vidas-uteis"><RevisaoVidasUteis /></RequirePermission></RequireAuth>} />
              <Route path="/reviews/massa" element={<RequireAuth><RequirePermission route="/reviews/massa"><MassRevisionView /></RequirePermission></RequireAuth>} />
              <Route path="/revisoes-massa" element={<RequireAuth><RequireCompany><RequirePermission route="/revisoes-massa"><MassRevisionView /></RequirePermission></RequireCompany></RequireAuth>} />
              <Route path="/cost-centers" element={<RequireAuth><RequireCompany><CostCentersPage /></RequireCompany></RequireAuth>} />
              <Route path="/reports" element={<RequireAuth><RequireCompany><ReportsMenu /></RequireCompany></RequireAuth>} />
              <Route path="/reports/vida-util" element={<RequireAuth><RequireCompany><ReportUsefulLifePage /></RequireCompany></RequireAuth>} />
              <Route path="/permissions" element={<RequireAuth><RequireCompany><PermissionsMenu /></RequireCompany></RequireAuth>} />
              <Route path="/permissions/groups" element={<RequireAuth><RequireCompany><ErrorBoundary><PermissionsPage /></ErrorBoundary></RequireCompany></RequireAuth>} />
              <Route path="/users" element={<RequireAuth><RequireCompany><UsersPage /></RequireCompany></RequireAuth>} />
            </Routes>
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