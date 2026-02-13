import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { login, saveToken, authMePermissions, authMe, resetApiBaseCache, getApiDebugInfo } from '../apiClient';

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [showConnectionHelp, setShowConnectionHelp] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    console.log('[Login] onSubmit chamado');
    setFormError('');
    setShowConnectionHelp(false);
    const idTrimmed = String(identifier || '').trim();
    if (!idTrimmed || !password) {
      console.log('[Login] Campos vazios, abortando');
      const msg = t('login_fill_required');
      setFormError(msg);
      toast.error(msg);
      return;
    }
    setLoading(true);
    setLoadingMessage(t('login_signing_in'));

    // Após 10 segundos, mostra mensagem sobre cold start
    const coldStartTimer = setTimeout(() => {
      setLoadingMessage('Aguarde, o servidor está iniciando... Isso pode levar até 2 minutos no plano gratuito.');
    }, 10000);

    try {
      const id = idTrimmed;
      const isEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(id);
      // Backend espera { email, senha } OU { identificador, senha }
      const payload = isEmail ? { email: id, senha: password } : { identificador: id, senha: password };
      console.log('[Login] Chamando login() com payload:', { ...payload, senha: '***' });
      const resp = await login(payload);
      clearTimeout(coldStartTimer);
      console.log('[Login] Resposta recebida:', resp ? 'OK' : 'null/undefined');
      const token = resp?.access_token;
      console.log('[Login] Token recebido:', token ? 'SIM' : 'NÃO');
      if (!token) throw new Error('No token');
      saveToken(token);
      console.log('[Login] Token salvo no localStorage');
      setLoadingMessage('Carregando dados...');
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
      clearTimeout(coldStartTimer);
      console.error('[Login] Erro capturado:', err);
      console.error('[Login] Erro message:', err?.message);
      console.error('[Login] Erro stack:', err?.stack);
      try {
        console.log('[Login] API debug info:', getApiDebugInfo());
      } catch {}
      const detail = extractError(err);
      const msg = String(err?.message || '').trim();
      console.log('[Login] Detail extraído:', detail);
      console.log('[Login] Mensagem final:', msg);
      // Em caso de erro de rede/CORS, mostre mensagem específica
      if (/Falha de conexão com a API/i.test(msg)) {
        const m = 'Não foi possível conectar ao servidor. Limpe o cache de conexão e tente novamente.';
        setFormError(m);
        setShowConnectionHelp(true);
        toast.error(m);
      } else if (/Tempo limite atingido/i.test(msg)) {
        const m = 'O servidor está demorando muito para responder. Por favor, tente novamente.';
        setFormError(m);
        toast.error(m);
      } else {
        const m = detail || t('login_invalid_credentials');
        setFormError(m);
        toast.error(m);
      }
    } finally {
      setLoading(false);
      setLoadingMessage('');
      console.log('[Login] Finalizando, loading = false');
    }
  };

  const handleResetConnection = () => {
    try {
      resetApiBaseCache();
    } catch {}
    try {
      window.location.reload();
    } catch {}
  };

  const changeLang = (lng) => i18n.changeLanguage(lng);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-muted dark:bg-darksurface-muted p-4">
      <div className="w-full max-w-md bg-gray-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
        <div className="text-center mb-6">
          <img src="/brand.svg" alt="Asset Life" className="mx-auto h-24 mb-2" />
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
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0 h-9 w-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
          <button type="submit" disabled={loading} className="w-full py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-60">
            {loading ? loadingMessage || t('login_signing_in') : t('login_sign_in')}
          </button>
        </form>
        {!!formError && (
          <div className="mt-3 text-xs text-center text-red-700 dark:text-red-300">
            {formError}
          </div>
        )}
        {loading && loadingMessage && (
          <div className="mt-3 text-xs text-center text-slate-600 dark:text-slate-400">
            {loadingMessage}
          </div>
        )}
        {showConnectionHelp && (
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={handleResetConnection}
              className="text-xs px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Limpar cache de conexão e recarregar
            </button>
          </div>
        )}
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
