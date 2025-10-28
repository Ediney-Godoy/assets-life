import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPage from './pages/Dashboard';
import CompaniesPage from './pages/Companies';
import EmployeesPage from './pages/Employees';
import { ThemeProvider } from './theme/ThemeProvider';
import TabsDemo from './pages/TabsDemo';
import DynamicTabs from './components/DynamicTabs';
import ManagementUnitsPage from './pages/ManagementUnits';
import Users from './pages/Users';
import ReviewsMenu from './pages/ReviewsMenu';
import Reviews from './pages/Reviews';
import DelegacaoPage from './pages/Delegacao';
import CostCentersPage from './pages/CostCenters';

export default function App() {
  const { t, i18n } = useTranslation();
  const [backendStatus, setBackendStatus] = useState('checking');

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

  return (
    <ThemeProvider>
      <div className="h-screen flex bg-surface-muted dark:bg-darksurface-muted">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header backendStatus={backendStatus} language={i18n.language} onLanguageChange={changeLanguage} />
          <main className="container-page">
            <DynamicTabs initialTabs={initialTabs} hideBody />
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage t={t} />} />
              <Route path="/cadastros" element={<DashboardPage t={t} registrationsOnly />} />
              <Route path="/companies" element={<CompaniesPage />} />
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/ugs" element={<ManagementUnitsPage />} />
              <Route path="/tabs-demo" element={<TabsDemo />} />
              <Route path="/assets" element={<Section title={t('nav_assets')} body={t('coming_soon')} />} />
              <Route path="/reviews" element={<ReviewsMenu />} />
              <Route path="/reviews/periodos" element={<Reviews />} />
              <Route path="/reviews/delegacao" element={<DelegacaoPage />} />
              <Route path="/cost-centers" element={<CostCentersPage />} />
              <Route path="/reports" element={<Section title={t('nav_reports')} body={t('coming_soon')} />} />
              <Route path="/permissions" element={<Section title={t('nav_permissions')} body={t('coming_soon')} />} />
              <Route path="/users" element={<Users />} />
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