import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { forgotPassword } from '../apiClient';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email) { toast.error(t('forgot_email_required')); return; }
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
      toast.success(t('forgot_sent'));
    } catch (err) {
      toast.error(t('forgot_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-muted dark:bg-darksurface-muted p-4">
      <div className="w-full max-w-md bg-gray-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
        <div className="text-center mb-6">
          <div className="text-xl font-semibold text-slate-900 dark:text-slate-100">{t('forgot_title')}</div>
          <div className="text-slate-600 dark:text-slate-400 text-sm">{t('forgot_subtitle')}</div>
        </div>
        {sent ? (
          <div className="text-sm text-slate-700 dark:text-slate-300 space-y-3">
            <p>{t('forgot_check_email')}</p>
            <Link to="/login" className="text-slate-900 dark:text-slate-100 hover:underline">{t('back_to_login')}</Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">{t('forgot_email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
                placeholder="email@empresa.com"
              />
            </div>
            <button type="submit" disabled={loading} className="w-full py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-60">
              {loading ? t('forgot_sending') : t('forgot_send_link')}
            </button>
            <div className="text-sm text-right">
              <Link to="/login" className="text-slate-700 dark:text-slate-300 hover:underline">{t('back_to_login')}</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}