import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { login, saveToken, authMePermissions, authMe } from '../apiClient';

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    console.log('[Login] onSubmit chamado');
    if (!identifier || !password) {
      console.log('[Login] Campos vazios, abortando');
      toast.error(t('login_fill_required'));
      return;
    }
    setLoading(true);
    try {
      const id = String(identifier || '').trim();
      const isEmail = /@/.test(id);
      // Backend espera { email, senha } OU { identificador, senha }
      const payload = isEmail ? { email: id, senha: password } : { identificador: id, senha: password };
      console.log('[Login] Chamando login() com payload:', { ...payload, senha: '***' });
      const resp = await login(payload);
      console.log('[Login] Resposta recebida:', resp ? 'OK' : 'null/undefined');
      const token = resp?.access_token;
      console.log('[Login] Token recebido:', token ? 'SIM' : 'NÃO');
      if (!token) throw new Error('No token');
      saveToken(token);
      console.log('[Login] Token salvo no localStorage');
      // carregar permissões e redirecionar
      // carregar dados do usuário logado
      try {
        const me = await authMe(token);
        try { localStorage.setItem('assetlife_user', JSON.stringify(me)); } catch {}
      } catch {}
      try {
        const perms = await authMePermissions();
        try { localStorage.setItem('assetlife_permissoes', JSON.stringify(perms)); } catch {}
        const empresas = Array.isArray(perms?.empresas_ids) ? perms.empresas_ids : [];
        // Seleção automática se o usuário tiver uma única empresa
        if (empresas.length === 1) {
          try { localStorage.setItem('assetlife_empresa', String(empresas[0])); } catch {}
          navigate('/dashboard', { replace: true });
        } else {
          // Limpa seleção e força fluxo de seleção de empresa
          try { localStorage.removeItem('assetlife_empresa'); } catch {}
          navigate('/select-company', { replace: true });
        }
      } catch {
        // Em caso de falha ao obter permissões, segue para dashboard padrão
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('[Login] Erro capturado:', err);
      console.error('[Login] Erro message:', err?.message);
      console.error('[Login] Erro stack:', err?.stack);
      const detail = extractError(err);
      const msg = String(err?.message || '').trim();
      console.log('[Login] Detail extraído:', detail);
      console.log('[Login] Mensagem final:', msg);
      // Em caso de erro de rede/CORS, mostre mensagem específica
      if (/Falha de conexão com a API/i.test(msg)) {
        toast.error(msg);
      } else {
        toast.error(detail || t('login_invalid_credentials'));
      }
    } finally {
      setLoading(false);
      console.log('[Login] Finalizando, loading = false');
    }
  };

  const changeLang = (lng) => i18n.changeLanguage(lng);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-muted dark:bg-darksurface-muted p-4">
      <div className="w-full max-w-md bg-gray-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
        <div className="text-center mb-6">
          <img src="/brand.svg" alt="Asset Life" className="mx-auto h-12 mb-2" />
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">Asset Life</div>
          <div className="text-slate-600 dark:text-slate-400 text-sm">{t('login_welcome')}</div>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">{t('login_username_or_email')}</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder={t('login_username_placeholder')}
            />
          </div>
      <div>
        <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">{t('login_password')}</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 pr-12 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
            placeholder={t('login_password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-sm px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {showPassword ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
      </div>
          <button type="submit" disabled={loading} className="w-full py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-60">
            {loading ? t('login_signing_in') : t('login_sign_in')}
          </button>
        </form>
        <div className="flex items-center justify-between mt-4 text-sm">
          <Link to="/forgot-password" className="text-slate-700 dark:text-slate-300 hover:underline">{t('login_forgot_password')}</Link>
          <div className="space-x-2">
            <button onClick={() => changeLang('pt')} className="text-slate-600 dark:text-slate-300 hover:underline">PT</button>
            <button onClick={() => changeLang('es')} className="text-slate-600 dark:text-slate-300 hover:underline">ES</button>
            <button onClick={() => changeLang('en')} className="text-slate-600 dark:text-slate-300 hover:underline">EN</button>
          </div>
        </div>
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
  // Fallback: tenta extrair detail de string sem JSON ou do prefixo "HTTP <status>: <msg>"
  try {
    const s = String(err.message || err);
    const md = s.match(/detail\"?\s*:\s*\"([^\"]+)/i);
    if (md && md[1]) return md[1];
    const mh = s.match(/HTTP\s+\d+\s*:\s*(.*)$/i);
    if (mh && mh[1]) {
      const txt = mh[1].trim();
      // evita retornar mensagens genéricas do navegador
      if (txt && !/Failed to fetch|NetworkError/i.test(txt)) return txt;
    }
  } catch {}
  return null;
}