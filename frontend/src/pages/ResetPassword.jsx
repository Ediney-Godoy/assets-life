import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { resetPassword } from '../apiClient';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const query = useQuery();
  const token = query.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!token) { toast.error(t('reset_missing_token')); return; }
    if (!password || !confirm) { toast.error(t('reset_fill_required')); return; }
    setLoading(true);
    try {
      await resetPassword(token, password, confirm);
      toast.success(t('reset_success'));
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(t('reset_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-muted dark:bg-darksurface-muted p-4">
      <div className="w-full max-w-md bg-gray-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
        <div className="text-center mb-6">
          <div className="text-xl font-semibold text-slate-900 dark:text-slate-100">{t('reset_title')}</div>
          <div className="text-slate-600 dark:text-slate-400 text-sm">{t('reset_subtitle')}</div>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">{t('reset_new_password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">{t('reset_confirm_password')}</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-60">
            {loading ? t('reset_submitting') : t('reset_submit')}
          </button>
          <div className="text-sm text-right">
            <Link to="/login" className="text-slate-700 dark:text-slate-300 hover:underline">{t('back_to_login')}</Link>
          </div>
        </form>
      </div>
    </div>
  );
}