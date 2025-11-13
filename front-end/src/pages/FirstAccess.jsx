import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { changePassword, clearToken } from '../apiClient';

export default function FirstAccessPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!current || !password || !confirm) { toast.error(t('first_fill_required')); return; }
    setLoading(true);
    try {
      await changePassword(current, password, confirm);
      toast.success(t('first_changed')); 
      clearToken();
      navigate('/login', { replace: true });
    } catch (err) {
      const detail = extractError(err);
      toast.error(detail || t('first_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-muted dark:bg-darksurface-muted p-4">
      <div className="w-full max-w-md bg-gray-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
        <div className="text-center mb-6">
          <div className="text-xl font-semibold text-slate-900 dark:text-slate-100">{t('first_title')}</div>
          <div className="text-slate-600 dark:text-slate-400 text-sm">{t('first_subtitle')}</div>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">{t('first_current_password')}</label>
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">{t('first_new_password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">{t('first_confirm_password')}</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-60">
            {loading ? t('first_saving') : t('first_save')}
          </button>
          <div className="text-sm text-right">
            <Link to="/dashboard" className="text-slate-700 dark:text-slate-300 hover:underline">{t('first_skip')}</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

function extractError(err) {
  try {
    const m = String(err.message || err).match(/\{.*\}$/);
    if (m) {
      const j = JSON.parse(m[0]);
      return j?.detail;
    }
  } catch {}
  return null;
}