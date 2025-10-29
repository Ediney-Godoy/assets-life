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
import CostCentersPage from './pages/CostCenters';
import UsersPage from './pages/Users';
import PermissionsPage from './pages/Permissions';
import ErrorBoundary from './components/ErrorBoundary';
import LoginPage from './pages/Login';
import ForgotPasswordPage from './pages/ForgotPassword';
import ResetPasswordPage from './pages/ResetPassword';
import FirstAccessPage from './pages/FirstAccess';
import { clearToken } from './apiClient';

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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch('http://localhost:8000/health', { signal: controller.signal });
      clearTimeout(timeoutId);
      setBackendStatus(res.ok ? 'ok' : 'error');
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
              <Route path="/reviews" element={<RequireAuth><ReviewsMenu /></RequireAuth>} />
              <Route path="/reviews/periodos" element={<RequireAuth><Reviews /></RequireAuth>} />
              <Route path="/reviews/delegacao" element={<RequireAuth><DelegacaoPage /></RequireAuth>} />
              <Route path="/reviews/vidas-uteis" element={<RequireAuth><RevisaoVidasUteis /></RequireAuth>} />
              <Route path="/cost-centers" element={<RequireAuth><CostCentersPage /></RequireAuth>} />
              <Route path="/reports" element={<RequireAuth><Section title={t('nav_reports')} body={t('coming_soon')} /></RequireAuth>} />
              <Route path="/permissions" element={<RequireAuth><ErrorBoundary><PermissionsPage /></ErrorBoundary></RequireAuth>} />
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