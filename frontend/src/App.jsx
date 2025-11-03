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
  }, []);

  const initialTabs = useMemo(() => [
    { id: 'home', title: 'Home', content: null, isClosable: false },
  ], []);

  const authRoutes = ['/login', '/forgot-password', '/reset-password', '/first-access'];
  const isAuthRoute = authRoutes.some((p) => location.pathname.startsWith(p));

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
      const ok = allowed.size === 0 || allowed.has(route) || (alt ? allowed.has(alt) : false);
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
            <Header backendStatus={backendStatus} language={i18n.language} onLanguageChange={changeLanguage} onLogout={handleLogout} />
          )}
          <main className="container-page">
            {!isAuthRoute && <DynamicTabs initialTabs={initialTabs} hideBody />}
            <Routes>
              {/* Auth routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/first-access" element={<RequireAuth><FirstAccessPage /></RequireAuth>} />

              {/* Protected routes */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<RequireAuth><DashboardPage t={t} /></RequireAuth>} />
              <Route path="/cadastros" element={<RequireAuth><DashboardPage t={t} registrationsOnly /></RequireAuth>} />
              <Route path="/companies" element={<RequireAuth><CompaniesPage /></RequireAuth>} />
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
              <Route path="/revisoes-massa" element={<RequireAuth><RequirePermission route="/revisoes-massa"><MassRevisionView /></RequirePermission></RequireAuth>} />
              <Route path="/cost-centers" element={<RequireAuth><CostCentersPage /></RequireAuth>} />
              <Route path="/reports" element={<RequireAuth><ReportsMenu /></RequireAuth>} />
              <Route path="/reports/vida-util" element={<RequireAuth><ReportUsefulLifePage /></RequireAuth>} />
              <Route path="/permissions" element={<RequireAuth><PermissionsMenu /></RequireAuth>} />
              <Route path="/permissions/groups" element={<RequireAuth><ErrorBoundary><PermissionsPage /></ErrorBoundary></RequireAuth>} />
              <Route path="/users" element={<RequireAuth><UsersPage /></RequireAuth>} />
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