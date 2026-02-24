// URL do backend em produção (Koyeb)
const PRODUCTION_API_URL = 'https://different-marlie-assetslifev2-bc199b4b.koyeb.app';

// Base primária vinda do ambiente (sem barra final); em dev, fallback localhost:8000
let rawBase = import.meta?.env?.VITE_API_URL;
if (rawBase && typeof rawBase === 'string') rawBase = rawBase.replace(/\/+$/, '');
if (!rawBase && typeof window !== 'undefined') {
  const isHttps = window.location?.protocol === 'https:';
  const hostname = window.location?.hostname || '';
  const isProduction = isHttps && !hostname.includes('localhost') && !hostname.includes('127.0.0.1');
  if (isProduction) {
    // Em produção, usar URL hardcoded se VITE_API_URL não estiver disponível
    rawBase = PRODUCTION_API_URL;
  } else {
    rawBase = 'http://localhost:8000';
  }
}
const PRIMARY_BASE = rawBase || null;

const IS_PROD = (() => {
  try {
    if (import.meta?.env?.PROD) return true;
    // Se estiver em HTTPS e não for localhost, considerar produção
    if (typeof window !== 'undefined') {
      const hostname = window.location?.hostname || '';
      const isHttps = window.location?.protocol === 'https:';
      if (isHttps && !hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
        return true;
      }
    }
    return false;
  } catch { return false; }
})();

// Ajuste: quando acessando via IP da rede (ex.: 192.168.x.x), usar o mesmo host para o backend
let HOST_BASE = null;
let HOST_BASE_ALT_PORT = null;
let ACTIVE_BASE = null;
const DEBUG_API = (() => {
  try { return (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('debug_api') === '1'); } catch { return false; }
})();

const debugLog = (...args) => {
  if (DEBUG_API) console.log(...args);
};

const debugWarn = (...args) => {
  if (DEBUG_API) console.warn(...args);
};
try {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    HOST_BASE = `http://${window.location.hostname}:8000`;
    HOST_BASE_ALT_PORT = `http://${window.location.hostname}:8001`;
  }
} catch {}
const IS_HTTPS = (() => { try { return typeof window !== 'undefined' && window.location?.protocol === 'https:'; } catch { return false; }})();

// Lista de URLs antigas que devem ser limpas
const OLD_URLS = [
  'https://brief-grete-assetlife-f50c6bd0.koyeb.app',
  'https://brief-grete-assetlife-f50c6bd0.koyeb.app/',
  'http://brief-grete-assetlife-f50c6bd0.koyeb.app',
  'http://brief-grete-assetlife-f50c6bd0.koyeb.app/',
  // Adicione outras URLs antigas aqui se necessário
];

function normalizeBaseUrl(base) {
  if (!base) return base;
  return String(base).replace(/\/+$/, '');
}

const DEFAULT_KOYEB_BASES = [
  'https://different-marlie-assetslifev2-bc199b4b.koyeb.app',
];


// Limpa cache de URL antiga antes de usar
if (typeof window !== 'undefined') {
  try {
    const cachedBase = normalizeBaseUrl(window.__ASSETS_API_BASE);
    debugLog('[apiClient] Verificando cache:', { cachedBase, PRIMARY_BASE, OLD_URLS });
    
    // Se há uma URL configurada via env e é diferente da cacheada, limpa o cache
    const normalizedPrimary = normalizeBaseUrl(PRIMARY_BASE);

    if (normalizedPrimary && cachedBase && cachedBase !== normalizedPrimary) {
      debugLog('[apiClient] Limpando cache de URL antiga:', cachedBase, '→ Nova:', PRIMARY_BASE);
      delete window.__ASSETS_API_BASE;
      ACTIVE_BASE = null;
    }
    // Em preview/local (HTTP), não usar base remota HTTPS cacheada
    else if (!IS_HTTPS && cachedBase && /^https:\/\//i.test(String(cachedBase))) {
      debugLog('[apiClient] Removendo base remota em ambiente HTTP:', cachedBase);
      delete window.__ASSETS_API_BASE;
      ACTIVE_BASE = null;
    }
    // Se a URL cacheada é uma URL antiga conhecida, limpa mesmo sem PRIMARY_BASE
    else if (cachedBase && OLD_URLS.map(normalizeBaseUrl).includes(cachedBase)) {
      debugWarn('[apiClient] Limpando cache de URL antiga conhecida:', cachedBase);
      delete window.__ASSETS_API_BASE;
      ACTIVE_BASE = null;
      debugLog('[apiClient] Cache limpo! ACTIVE_BASE resetado.');
    }
    // Restaura ACTIVE_BASE do cache apenas se não foi limpo e não é URL antiga
    else if (cachedBase && !OLD_URLS.map(normalizeBaseUrl).includes(cachedBase)) {
      ACTIVE_BASE = cachedBase;
      try { window.__ASSETS_API_BASE = ACTIVE_BASE; } catch {}
      debugLog('[apiClient] Restaurando ACTIVE_BASE do cache:', ACTIVE_BASE);
    }
  } catch (e) {
    console.error('[apiClient] Erro ao limpar cache:', e);
  }
}

export function resetApiBaseCache() {
  try {
    if (typeof window !== 'undefined') {
      delete window.__ASSETS_API_BASE;
    }
  } catch {}
  ACTIVE_BASE = null;
}

export function getApiDebugInfo() {
  return {
    PRIMARY_BASE,
    ACTIVE_BASE,
    IS_HTTPS,
    IS_PROD,
    SAFE_CANDIDATES,
  };
}

const BASE_CANDIDATES = (() => {
  const list = [];
  if (PRIMARY_BASE) list.push(PRIMARY_BASE);
  if (IS_HTTPS) list.push(...DEFAULT_KOYEB_BASES);
  // Em desenvolvimento (HTTP), permitir fallback ao host local
  if (!IS_HTTPS && HOST_BASE) list.push(HOST_BASE);
  if (!IS_HTTPS && HOST_BASE_ALT_PORT) list.push(HOST_BASE_ALT_PORT);
  const uniq = [];
  const seen = new Set();
  for (const b of list.filter(Boolean)) {
    const key = String(b).toLowerCase();
    if (!seen.has(key)) { seen.add(key); uniq.push(b); }
  }
  return uniq;
})();
const SAFE_CANDIDATES = IS_HTTPS
  ? BASE_CANDIDATES.filter((b) => /^https:\/\//i.test(String(b)))
  : BASE_CANDIDATES;

// Tenta resolver a URL base da API
// Retorna a URL base ativa ou lança erro
async function resolveBase() {
  if (ACTIVE_BASE) return ACTIVE_BASE;

  // Detecta se estamos usando uma URL de produção (Koyeb, Render, etc.)
  // para evitar health check rigoroso que falha em cold starts
  const isProductionUrl = PRIMARY_BASE && (
    PRIMARY_BASE.includes('koyeb.app') || 
    PRIMARY_BASE.includes('onrender.com') || 
    PRIMARY_BASE.includes('herokuapp.com')
  );

  debugLog('[apiClient] resolveBase() chamado, ACTIVE_BASE:', ACTIVE_BASE);

  // Em produção ou URL de produção, confiar na configuração para evitar timeout de cold start
  // Isso evita que a verificação de saúde falhe se o backend demorar > 15s para subir
  if ((IS_PROD || isProductionUrl) && PRIMARY_BASE) {
    debugLog('[apiClient] resolveBase() - IS_PROD/ProdURL=true, usando PRIMARY_BASE imediatamente:', PRIMARY_BASE);
    ACTIVE_BASE = PRIMARY_BASE;
    try { if (typeof window !== 'undefined') window.__ASSETS_API_BASE = ACTIVE_BASE; } catch {}
    return PRIMARY_BASE;
  }

  try {
    if (IS_HTTPS && PRIMARY_BASE && /^https:\/\//i.test(String(PRIMARY_BASE))) {
      try {
        const controller = new AbortController();
        // Aumentado para 15s para suportar cold start
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        // Usa /version (leve) em vez de /health (pesado/DB) para checar conectividade
        const res = await fetch(`${PRIMARY_BASE}/version`, { signal: controller.signal, headers: { Accept: 'application/json' }, cache: 'no-store' });
        clearTimeout(timeoutId);
        if (res.ok) {
          ACTIVE_BASE = PRIMARY_BASE;
          try { if (typeof window !== 'undefined') window.__ASSETS_API_BASE = ACTIVE_BASE; } catch {}
          debugLog('[apiClient] resolveBase() - PRIMARY_BASE OK:', PRIMARY_BASE);
          return PRIMARY_BASE;
        }
      } catch {}
    }
  } catch {}
  // Se já temos uma base ativa, reutiliza
  if (ACTIVE_BASE) {
    debugLog('[apiClient] Usando ACTIVE_BASE existente:', ACTIVE_BASE);
    return ACTIVE_BASE;
  }
  
  debugLog('[apiClient] resolveBase() - SAFE_CANDIDATES.length:', SAFE_CANDIDATES.length);
  if (SAFE_CANDIDATES.length === 0) {
    // Se não há candidatos seguros, retorna null para evitar loop
    debugWarn('[apiClient] resolveBase() - Nenhuma base disponível, retornando null');
    return null;
  }
  debugLog('[apiClient] resolveBase() - Testando SAFE_CANDIDATES:', SAFE_CANDIDATES);
  for (const base of SAFE_CANDIDATES) {
    debugLog('[apiClient] resolveBase() - Testando base:', base);
    if (!base) continue; // Pula valores nulos/undefined
    const controller = new AbortController();
    // Aumentado para 15s para suportar cold start
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
      // Usa /version para teste de conectividade mais leve
      const res = await fetch(`${base}/version`, { signal: controller.signal, headers: { Accept: 'application/json' }, cache: 'no-store' });
      clearTimeout(timeoutId);
      if (res.ok) {
        ACTIVE_BASE = base;
        try { if (typeof window !== 'undefined') window.__ASSETS_API_BASE = ACTIVE_BASE; } catch {}
        return base;
      }
    } catch {
      clearTimeout(timeoutId);
      // tenta próxima base
      continue;
    }
  }
  // Sem base validada; retorna a primeira candidata ou PRIMARY_BASE como fallback
  const fallback = SAFE_CANDIDATES[0] || (IS_HTTPS && PRIMARY_BASE && /^https:\/\//i.test(String(PRIMARY_BASE)) ? PRIMARY_BASE : null);
  if (fallback) {
    ACTIVE_BASE = fallback;
    try { if (typeof window !== 'undefined') window.__ASSETS_API_BASE = ACTIVE_BASE; } catch {}
  }
  return fallback;
}

function getToken() {
  try {
    return localStorage.getItem('assetlife_token');
  } catch {
    return null;
  }
}

// Helper para retry com exponential backoff
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 2000) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const msg = String(err?.message || '');

      // Não faz retry para erros de cliente (400-499), exceto timeout
      const isTimeout = /Tempo limite atingido|aborted|AbortError/i.test(msg);
      const isNetworkError = /Falha de conexão|Failed to fetch|NetworkError/i.test(msg);
      const isClientError = /HTTP 4\d\d/.test(msg);

      if (isClientError && !isTimeout) {
        throw err; // Propaga erros 4xx imediatamente (credenciais inválidas, etc)
      }

      // Se é o último retry, propaga o erro
      if (attempt === maxRetries) {
        throw err;
      }

      // Só faz retry para erros de rede/timeout
      if (isTimeout || isNetworkError) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`[apiClient] Tentativa ${attempt + 1} falhou. Aguardando ${delay}ms antes de tentar novamente...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // Para outros erros, não faz retry
        throw err;
      }
    }
  }
  throw lastError;
}

async function request(path, options = {}) {
  debugLog('[apiClient] request() chamado:', { path, method: options.method || 'GET' });
  const token = getToken();
  debugLog('[apiClient] Token presente:', token ? 'SIM' : 'NÃO');
  const isLoginPath = path === '/auth/login';
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token && !isLoginPath && !(options.headers || {}).Authorization ? { Authorization: `Bearer ${token}` } : {}),
  };
  debugLog('[apiClient] Headers preparados:', { ...headers, Authorization: headers.Authorization ? 'Bearer ***' : undefined });

  // Anexa contexto de empresa selecionada (segregação de dados)
  try {
    const empresaId = localStorage.getItem('assetlife_empresa');
    // Não enviar X-Company-Id durante o login
    if (empresaId && !headers['X-Company-Id'] && !isLoginPath) {
      headers['X-Company-Id'] = String(empresaId);
    }
  } catch {}

  let lastErr;
  // Tenta primeiro a base ativa (se houver), depois demais candidatas
  // Resolve uma base válida antes de tentar, reduzindo tentativas bloqueadas por Mixed Content
  debugLog('[apiClient] Resolvendo base...');
  const initialBase = await resolveBase();
  debugLog('[apiClient] Base inicial resolvida:', initialBase);

  // Se não conseguiu resolver e estamos em HTTPS, tenta PRIMARY_BASE diretamente
  let bases = [];
  if (initialBase) {
    bases = [initialBase, ...SAFE_CANDIDATES.filter(b => b && b !== initialBase)];
  } else if (IS_HTTPS && PRIMARY_BASE && /^https:\/\//i.test(String(PRIMARY_BASE))) {
    // Fallback de emergência: usar PRIMARY_BASE diretamente
    bases = [PRIMARY_BASE];
  } else {
    bases = [...SAFE_CANDIDATES].filter(Boolean);
  }
  debugLog('[apiClient] Bases candidatas:', bases);
  debugLog('[apiClient] IS_HTTPS:', IS_HTTPS);
  debugLog('[apiClient] PRIMARY_BASE:', PRIMARY_BASE);
  debugLog('[apiClient] SAFE_CANDIDATES:', SAFE_CANDIDATES);

  // Se ainda não há bases, retorna erro imediatamente
  if (bases.length === 0) {
    const errorMsg = IS_HTTPS
      ? 'VITE_API_URL não está configurada. Configure a variável na Vercel e faça redeploy.'
      : 'Nenhuma URL de API configurada. Configure VITE_API_URL.';
    console.error('[apiClient] Nenhuma base disponível!', { IS_HTTPS, PRIMARY_BASE, SAFE_CANDIDATES });
    throw new Error(errorMsg);
  }
  for (const base of bases) {
    const url = `${base}${path}`;
    // FORCE DEBUG: Log full URL
    console.log(`[API Request] Full URL: ${url}`);
    
    debugLog('[apiClient] Tentando requisição para:', url);
    const controller = new AbortController();
    // Timeout padrão aumentado para 120s (cold start severo do backend)
    const timeoutId = setTimeout(() => controller.abort(), options.timeout ?? 120000);
    try {
      debugLog('[apiClient] Fetch iniciado:', { url, method: options.method || 'GET' });
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers,
      });
      clearTimeout(timeoutId);
      debugLog('[apiClient] Resposta recebida:', { status: res.status, statusText: res.statusText, ok: res.ok });
      if (!res.ok) {
        const text = await res.text();
        // Tratamento amigável para endpoints de notificações ausentes
        if (res.status === 404) {
          const p = String(path || '');
          const isNotifications = /notific/i.test(p);
          if (isNotifications) {
            const isDetail = /\/notificacoes\/.+|\/notifications\/.+/i.test(p);
            const isGet = String(options.method || 'GET').toUpperCase() === 'GET';
            if (isGet && isDetail) return null; // detalhe inexistente
            if (isGet) return []; // lista inexistente
            // ações (read/archive) inexistentes: silencia e retorna null
            return null;
          }
        }
        // Tratamento especial para 401: só limpa token se for realmente um erro de token inválido
        // No login, 401 com "Credenciais inválidas" deve ser propagado normalmente
        if (res.status === 401) {
          const isLoginPath = path === '/auth/login';
          // Tenta parsear JSON para verificar o detail
          let detail = '';
          try {
            const json = JSON.parse(text);
            detail = json?.detail || '';
          } catch {
            detail = text;
          }

          // Verifica se é realmente um erro de token inválido (não erro de credenciais no login)
          const isTokenError = /Token inválido|Not authenticated|Not Authorized|Unauthorized|Token expired|Invalid token|Usuário não encontrado/i.test(detail);

          // Se for erro de token E não for o endpoint de login, limpa token e redireciona
          if (isTokenError && !isLoginPath) {
            try {
              localStorage.removeItem('assetlife_token');
              localStorage.removeItem('assetlife_permissoes');
              localStorage.removeItem('assetlife_user');
            } catch {}
            // Redireciona sem propagar erro para evitar logs desnecessários
            if (typeof window !== 'undefined') {
              try { window.location.href = '/login'; } catch {}
            }
            return null;
          }
          // Se for login ou erro de credenciais, propaga o erro normalmente
        }
        if (res.status >= 400 && res.status < 500) {
          let message = `HTTP ${res.status}`;
          try {
            const j = JSON.parse(text);
            const d = j && (j.detail || j.message || j.error);
            if (typeof d === 'string' && d.trim()) message = d;
          } catch {}

          const shouldTryNextBase = (bases.length > 1) && (res.status === 404 || res.status === 405 || res.status === 410);
          if (shouldTryNextBase) {
            lastErr = new Error(`${message} (base=${base})`);
            continue;
          }

          const p = String(path || '');
          const m = String(options.method || 'GET').toUpperCase();
          if (m === 'POST' && /^\/cronogramas(?:\?|$)/.test(p)) {
            throw new Error(message);
          }
          throw new Error(message);
        }
        let errorId = res.headers.get('x-error-id') || '';
        let detail = text;
        try {
          const j = JSON.parse(text);
          if (!errorId && typeof j?.error_id === 'string') errorId = j.error_id;
          const d = j && (j.detail || j.message || j.error);
          if (typeof d === 'string' && d.trim()) detail = d;
        } catch {}
        const msg = errorId ? `HTTP ${res.status} (error_id=${errorId}): ${detail}` : `HTTP ${res.status}: ${detail}`;
        lastErr = new Error(msg);
        if (errorId) lastErr.errorId = errorId;
        continue;
      }
      // Marca base ativa caso ainda não esteja definida
      if (!ACTIVE_BASE) {
        ACTIVE_BASE = base;
        try { if (typeof window !== 'undefined') window.__ASSETS_API_BASE = ACTIVE_BASE; } catch {}
      }
      if (res.status === 204) return null;
      const contentType = res.headers.get('content-type') || '';
      debugLog('[apiClient] Content-Type:', contentType);
      if (contentType.includes('application/json')) {
        const json = await res.json();
        debugLog('[apiClient] JSON retornado:', json);
        return json;
      }
      // Conteúdos binários (PDF/Excel)
      if (
        contentType.includes('application/pdf') ||
        contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      ) {
        return res.arrayBuffer();
      }
      return res.text();
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('[apiClient] Erro na requisição:', err);
      console.error('[apiClient] Erro name:', err?.name);
      console.error('[apiClient] Erro message:', err?.message);
      // Se for erro 4xx (cliente/negócio), não tentar próxima base
      if (/HTTP 4\d\d/.test(String(err?.message || ''))) {
        throw err;
      }
      // Tratamento amigável para abort por timeout
      if (err?.name === 'AbortError' || /aborted|AbortError/i.test(String(err?.message || ''))) {
        debugWarn('[apiClient] Timeout detectado');
        lastErr = new Error('Tempo limite atingido. Ajuste os filtros ou tente novamente.');
      } else {
        const emsg = String(err?.message || err);
        if (/Failed to fetch|NetworkError/i.test(emsg)) {
          lastErr = new Error(`Falha de conexão ao acessar ${url}`);
        } else {
          lastErr = err;
        }
      }
      // tenta próximo base em caso de falhas de rede/timeout
      debugLog('[apiClient] Tentando próxima base...');
      continue;
    }
  }
  // Mensagem amigável para erros genéricos de rede (ex.: CORS, servidor offline)
  const msg = String(lastErr?.message || '');
  console.error('[apiClient] Todas as bases falharam. Último erro:', lastErr);
  if (/Failed to fetch|NetworkError|TypeError: Failed to fetch/i.test(msg)) {
    throw new Error('Falha de conexão com a API. Verifique a URL do backend (VITE_API_URL) e permissões/CORS. Se o problema persistir, limpe o cache do navegador e recarregue a página.');
  }
  throw lastErr || new Error('Falha ao conectar ao backend');
}

export async function getHealth(options = {}) {
  try {
    const base = await resolveBase();
    if (!base) {
      // Se não conseguiu resolver base, retorna null silenciosamente
      return null;
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), Math.max(options.timeout ?? 0, 8000));
    const res = await fetch(`${base}/health`, { signal: controller.signal, headers: { Accept: 'application/json' }, cache: 'no-store' });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    ACTIVE_BASE = base; // garante fixação
    return res.json();
  } catch {
    // Não propaga erro do health; apenas indica offline
    return null;
  }
}

export async function getCompanies() {
  return request('/companies');
}

export async function createCompany(payload) {
  return request('/companies', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateCompany(id, payload) {
  return request(`/companies/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function deleteCompany(id) {
  return request(`/companies/${id}`, { method: 'DELETE' });
}

export async function getEmployees() {
  return request('/colaboradores');
}

// Placeholder: lista de classes contábeis (integração futura)
export async function getAccountingClasses() {
  const data = await request('/classes_contabeis');
  return Array.isArray(data) ? data : [];
}

// --- Ativos (Assets) ---
export async function getAssets(params = {}) {
  const q = new URLSearchParams(Object.entries(params).filter(([_, v]) => v != null && v !== '')).toString();
  // Pode ser volumoso, aumentar timeout
  return request(`/assets${q ? `?${q}` : ''}`, { timeout: 30000 });
}

export async function getAsset(id) {
  return request(`/assets/${id}`);
}

export async function createAsset(payload) {
  return request('/assets', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateAsset(id, payload) {
  return request(`/assets/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function deleteAsset(id) {
  return request(`/assets/${id}`, { method: 'DELETE' });
}

// --- Relatórios RVU ---
export async function getRelatoriosResumo(params = {}) {
  const q = new URLSearchParams(Object.entries(params).filter(([_, v]) => v != null && v !== '')).toString();
  // Em datasets grandes a consulta pode demorar; ampliar timeout
  return request(`/relatorios/rvu/resumo${q ? `?${q}` : ''}`, { timeout: 120000 });
}

export async function getRelatoriosExcel(params = {}) {
  const q = new URLSearchParams(Object.entries(params).filter(([_, v]) => v != null && v !== '')).toString();
  const ab = await request(`/relatorios/rvu/excel${q ? `?${q}` : ''}`, { headers: { Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }, timeout: 30000 });
  return new Uint8Array(ab);
}

export async function getRelatoriosPdf(params = {}) {
  const q = new URLSearchParams(Object.entries(params).filter(([_, v]) => v != null && v !== '')).toString();
  const ab = await request(`/relatorios/rvu/pdf${q ? `?${q}` : ''}`, { headers: { Accept: 'application/pdf' }, timeout: 30000 });
  return new Uint8Array(ab);
}

export async function listRelatoriosLog() {
  return request('/relatorios/rvu/log');
}

export async function listAuditLogs(params = {}) {
  const q = new URLSearchParams(
    Object.entries(params).filter(([_, v]) => v != null && v !== '')
  ).toString();
  return request(`/auditoria/logs${q ? `?${q}` : ''}`, { timeout: 120000 });
}

export async function simularDepreciacao(payload) {
  return request('/simulador/depreciacao', { method: 'POST', body: JSON.stringify(payload), timeout: 120000 });
}

export async function simularDepreciacaoExcel(params = {}) {
  const q = new URLSearchParams(Object.entries(params).filter(([_, v]) => v != null && v !== '')).toString();
  const ab = await request(`/simulador/depreciacao/excel${q ? `?${q}` : ''}`, {
    headers: { Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    timeout: 60000,
  });
  return new Uint8Array(ab);
}

export async function simularDepreciacaoPdf(params = {}) {
  const q = new URLSearchParams(Object.entries(params).filter(([_, v]) => v != null && v !== '')).toString();
  const ab = await request(`/simulador/depreciacao/pdf${q ? `?${q}` : ''}`, {
    headers: { Accept: 'application/pdf' },
    timeout: 60000,
  });
  return new Uint8Array(ab);
}

export async function createEmployee(payload) {
  return request('/colaboradores', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateEmployee(id, payload) {
  return request(`/colaboradores/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function deleteEmployee(id) {
  return request(`/colaboradores/${id}`, { method: 'DELETE' });
}

// Unidades Gerenciais (UG)
export async function getManagementUnits(empresaId) {
  // Pode ser volumoso em bases grandes; aumentar timeout para evitar abort precoce
  const opts = { timeout: 12000 };
  if (empresaId) {
    opts.headers = { 'X-Company-Id': String(empresaId) };
  }
  return request('/unidades_gerenciais', opts);
}

export async function getManagementUnit(id) {
  return request(`/unidades_gerenciais/${id}`);
}

export async function createManagementUnit(payload) {
  return request('/unidades_gerenciais', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateManagementUnit(id, payload) {
  return request(`/unidades_gerenciais/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function deleteManagementUnit(id) {
  return request(`/unidades_gerenciais/${id}`, { method: 'DELETE' });
}

export async function getUsers(empresaId, delegatedPeriodId) {
  // Lista de usuários pode ter volume considerável; dar mais margem
  const opts = { timeout: 30000 };
  if (empresaId) {
    opts.headers = { 'X-Company-Id': String(empresaId) };
  }
  let url = '/usuarios';
  if (delegatedPeriodId) {
    url += `?delegated_period_id=${delegatedPeriodId}`;
  }
  return request(url, opts);
}

export async function createUser(payload) {
  return request('/usuarios', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateUser(id, payload) {
  return request(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function deleteUser(id) {
  return request(`/usuarios/${id}`, { method: 'DELETE' });
}

// Revisões de Vidas Úteis - Períodos
export async function getReviewPeriods() {
  return request('/revisoes/periodos');
}

export async function createReviewPeriod(payload) {
  return request('/revisoes/periodos', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateReviewPeriod(id, payload) {
  return request(`/revisoes/periodos/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function deleteReviewPeriod(id) {
  return request(`/revisoes/periodos/${id}`, { method: 'DELETE' });
}

export async function closeReviewPeriod(id) {
  return request(`/revisoes/fechar/${id}`, { method: 'POST' });
}

// Upload de base (.csv/.xlsx) para um período específico
export async function uploadReviewBase(periodoId, file) {
  const base = await resolveBase();
  if (!base) {
    throw new Error('Nenhuma URL de API configurada. Configure VITE_API_URL na Vercel.');
  }
  const url = `${base}/revisoes/upload_base/${periodoId}`;
  const form = new FormData();
  let toSend = file;
  try {
    const n = String(file?.name || '').toLowerCase();
    const t = String(file?.type || '').toLowerCase();
    if (n.endsWith('.xlsx') || /sheet|xlsx/.test(t)) {
      const XLSX = await import('xlsx');
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(new Uint8Array(buf), { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const csv = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csv], { type: 'text/csv' });
      const baseName = n.replace(/\.xlsx$/, '') || 'base';
      toSend = new File([blob], `${baseName}.csv`, { type: 'text/csv' });
    }
  } catch {}
  form.append('file', toSend);
  const controller = new AbortController();
  // Timeout de 10 minutos para uploads grandes
  const timeoutId = setTimeout(() => controller.abort(), 600000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      body: form,
      signal: controller.signal,
      mode: 'cors',
      credentials: 'omit',
      headers: (() => {
        const t = getToken();
        const h = { Accept: 'application/json' };
        if (t) h.Authorization = `Bearer ${t}`;
        return h;
      })(),
      // Não definir Content-Type explicitamente para permitir boundary correto
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const ct = res.headers.get('content-type') || '';
      let detail = '';
      try {
        if (ct.includes('application/json')) {
          const errJson = await res.json();
          detail = errJson?.detail || JSON.stringify(errJson);
        } else {
          detail = await res.text();
        }
      } catch {
        try { detail = await res.text(); } catch {}
      }
      throw new Error(detail ? `${detail}` : `HTTP ${res.status}`);
    }
    return res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// Listar itens importados de um período específico
export async function getReviewItems(periodoId) {
  if (!periodoId || (Array.isArray(periodoId) && periodoId.length === 0)) {
    throw new Error('ID do período inválido ou não fornecido');
  }
  // Validação estrita para evitar URLs como /revisoes/itens/[object Object] ou /revisoes/itens/undefined
  const pid = String(periodoId).trim();
  if (!pid || pid === 'undefined' || pid === 'null') {
    console.error('[getReviewItems] ID inválido:', periodoId);
    throw new Error('ID do período inválido');
  }

  console.log(`[getReviewItems] Fetching for period: ${pid}`);
  return request(`/revisoes/itens/${pid}`, { timeout: 60000 });
}

// Atualizar item de revisão (útil para ajustar vida útil, data fim e metadados)
export async function updateReviewItem(periodoId, itemId, payload) {
  return request(`/revisoes/${periodoId}/itens/${itemId}`, { method: 'PUT', body: JSON.stringify(payload) });
}

// Aplicar revisão em massa
export async function applyMassRevision(payload) {
  // payload: { ativos_ids: number[], incremento?, nova_vida_util_anos?, nova_vida_util_meses?, nova_data_fim?, condicao_fisica?, motivo?, justificativa? }
  return request('/revisoes/massa', { method: 'POST', body: JSON.stringify(payload), timeout: 60000 });
}

// Delegações de Revisão
export async function getReviewDelegations(periodoId) {
  if (!periodoId || (Array.isArray(periodoId) && periodoId.length === 0)) {
    // Retornar vazio se não houver período, em vez de erro, para não quebrar a UI
    return [];
  }
  // Pode haver volume razoável; aumentar timeout
  return request(`/revisoes/delegacoes/${periodoId}`, { timeout: 60000 });
}

export async function createReviewDelegation(payload) {
  return request('/revisoes/delegacoes', { method: 'POST', body: JSON.stringify(payload) });
}

export async function deleteReviewDelegation(id) {
  return request(`/revisoes/delegacoes/${id}`, { method: 'DELETE' });
}

export async function getCronogramas(params = {}) {
  const q = new URLSearchParams(Object.entries(params).filter(([_, v]) => v != null && v !== '')).toString();
  return request(`/cronogramas${q ? `?${q}` : ''}`);
}

export async function createCronograma(payload, { template = true } = {}) {
  const q = template ? '?template=true' : '?template=false';
  try {
    return await request(`/cronogramas${q}`, { method: 'POST', body: JSON.stringify(payload) });
  } catch (err) {
    const msg = String(err?.message || '');
    const isCors = /Failed to fetch|CORS|No 'Access-Control-Allow-Origin'/i.test(msg);
    if (template && isCors) {
      return await request(`/cronogramas?template=false`, { method: 'POST', body: JSON.stringify(payload) });
    }
    throw err;
  }
}

export async function updateCronograma(id, payload) {
  return request(`/cronogramas/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function getCronogramaTarefas(cronogramaId) {
  return request(`/cronogramas/${cronogramaId}/tarefas`);
}

export async function createCronogramaTarefa(cronogramaId, payload) {
  return request(`/cronogramas/${cronogramaId}/tarefas`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateCronogramaTarefa(cronogramaId, tarefaId, payload) {
  return request(`/cronogramas/${cronogramaId}/tarefas/${tarefaId}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function getCronogramaResumo(cronogramaId) {
  return request(`/cronogramas/${cronogramaId}/resumo`);
}

// Evidências de Tarefas
export async function listCronogramaTarefaEvidencias(cronogramaId, tarefaId) {
  return request(`/cronogramas/${cronogramaId}/tarefas/${tarefaId}/evidencias`);
}

export async function uploadCronogramaTarefaEvidencia(cronogramaId, tarefaId, file) {
  const base = await resolveBase();
  if (!base) throw new Error('Nenhuma URL de API configurada. Configure VITE_API_URL.');
  const url = `${base}/cronogramas/${cronogramaId}/tarefas/${tarefaId}/evidencias`;
  const form = new FormData();
  form.append('file', file);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 600000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      body: form,
      signal: controller.signal,
      headers: (() => {
        const t = getToken();
        const h = { Accept: 'application/json' };
        if (t) h.Authorization = `Bearer ${t}`;
        return h;
      })(),
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`HTTP ${res.status}: ${txt}`);
    }
    return res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export async function downloadCronogramaTarefaEvidencia(cronogramaId, tarefaId, evidenciaId) {
  const base = await resolveBase();
  if (!base) throw new Error('Nenhuma URL de API configurada. Configure VITE_API_URL.');
  const url = `${base}/cronogramas/${cronogramaId}/tarefas/${tarefaId}/evidencias/${evidenciaId}`;
  const res = await fetch(url, { headers: (() => { const t = getToken(); const h = {}; if (t) h.Authorization = `Bearer ${t}`; return h; })() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  return blob;
}

export async function deleteCronogramaTarefaEvidencia(cronogramaId, tarefaId, evidenciaId) {
  return request(`/cronogramas/${cronogramaId}/tarefas/${tarefaId}/evidencias/${evidenciaId}`, { method: 'DELETE' });
}
// Centros de Custos
export async function getCostCenters(filters = {}) {
  const qs = new URLSearchParams();
  if (filters.empresa_id) qs.set('empresa_id', filters.empresa_id);
  if (filters.ug_id) qs.set('ug_id', filters.ug_id);
  if (filters.nome) qs.set('nome', filters.nome);
  if (filters.status) qs.set('status', filters.status);
  const path = qs.toString() ? `/centros_custos?${qs.toString()}` : '/centros_custos';
  // Em bases com muitos CCs, 5s pode não bastar
  return request(path, { timeout: 12000, cache: 'no-store' });
}

export async function getCostCenter(id) {
  return request(`/centros_custos/${id}`);
}

export async function createCostCenter(payload) {
  return request('/centros_custos', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateCostCenter(id, payload) {
  return request(`/centros_custos/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

// Classes Contábeis
export async function getClassesContabeis(params = {}) {
  const q = new URLSearchParams(Object.entries(params).filter(([_, v]) => v != null && v !== '')).toString();
  return request(`/classes_contabeis${q ? `?${q}` : ''}`);
}

export async function getClasseContabil(id) {
  return request(`/classes_contabeis/${id}`);
}

export async function createClasseContabil(payload) {
  return request('/classes_contabeis', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateClasseContabil(id, payload) {
  return request(`/classes_contabeis/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function deleteClasseContabil(id) {
  return request(`/classes_contabeis/${id}`, { method: 'DELETE' });
}

// Contas Contábeis
export async function getContasContabeis(params = {}) {
  const q = new URLSearchParams(Object.entries(params).filter(([_, v]) => v != null && v !== '')).toString();
  return request(`/contas_contabeis${q ? `?${q}` : ''}`);
}

export async function getContaContabil(id) {
  return request(`/contas_contabeis/${id}`);
}

export async function createContaContabil(payload) {
  return request('/contas_contabeis', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateContaContabil(id, payload) {
  return request(`/contas_contabeis/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function deleteContaContabil(id) {
  return request(`/contas_contabeis/${id}`, { method: 'DELETE' });
}

// -----------------------------
// Permissões - Transações e Grupos
// -----------------------------
export async function getTransactions() {
  return request('/permissoes/transacoes');
}

export async function createTransaction(payload) {
  return request('/permissoes/transacoes', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateTransaction(id, payload) {
  return request(`/permissoes/transacoes/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function deleteTransaction(id) {
  return request(`/permissoes/transacoes/${id}`, { method: 'DELETE' });
}

export async function getPermissionGroups(q = '') {
  const qs = q ? `?q=${encodeURIComponent(q)}` : '';
  return request(`/permissoes/grupos${qs}`);
}

export async function getPermissionGroup(id) {
  return request(`/permissoes/grupos/${id}`);
}

export async function createPermissionGroup(payload) {
  return request('/permissoes/grupos', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updatePermissionGroup(id, payload) {
  return request(`/permissoes/grupos/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

// --- Supervisão RVU ---
export async function listarSupervisaoRVU(params = {}) {
  const q = new URLSearchParams(Object.entries(params).filter(([_, v]) => v != null && v !== '')).toString();
  // Em bases grandes, ampliar timeout para evitar abort precoce
  return request(`/supervisao/rvu/listar${q ? `?${q}` : ''}`, { timeout: 120000 });
}

export async function comentarSupervisaoRVU(payload) {
  return request('/supervisao/rvu/comentar', { method: 'POST', body: JSON.stringify(payload) });
}

export async function reverterSupervisaoRVU(payload) {
  return request('/supervisao/rvu/reverter', { method: 'POST', body: JSON.stringify(payload) });
}

export async function aprovarSupervisaoRVU(payload) {
  return request('/supervisao/rvu/aprovar', { method: 'POST', body: JSON.stringify(payload), timeout: 120000 });
}

export async function aprovarMassaSupervisaoRVU(payload) {
  return request('/supervisao/rvu/aprovar-massa', { method: 'POST', body: JSON.stringify(payload), timeout: 120000 });
}

export async function historicoSupervisaoRVU(params = {}) {
  const q = new URLSearchParams(Object.entries(params).filter(([_, v]) => v != null && v !== '')).toString();
  // Histórico é informativo; dar mais tempo para bases grandes
  return request(`/supervisao/rvu/historico${q ? `?${q}` : ''}`, { timeout: 120000 });
}

export async function listarComentariosRVU(ativoId) {
  return request(`/supervisao/rvu/comentarios?ativo_id=${ativoId}`);
}

export async function responderComentarioRVU(payload) {
  return request('/supervisao/rvu/comentarios/responder', { method: 'POST', body: JSON.stringify(payload) });
}

export async function deletePermissionGroup(id) {
  return request(`/permissoes/grupos/${id}`, { method: 'DELETE' });
}

export async function getNotifications(params = {}) {
  const q = new URLSearchParams(Object.entries(params).filter(([_, v]) => v != null && v !== '')).toString();
  const mapStatus = (s) => {
    if (s === 'pendente') return 'pending';
    if (s === 'lida') return 'read';
    if (s === 'arquivada') return 'archived';
    return s;
  };
  const { from_me, ...rest } = params || {};
  const paramsEn = { ...rest };
  if (paramsEn.status) paramsEn.status = mapStatus(String(paramsEn.status));
  const qEn = new URLSearchParams(Object.entries(paramsEn).filter(([_, v]) => v != null && v !== '')).toString();
  if (from_me) {
    try {
      const r = await request(`/notifications/sent${qEn ? `?${qEn}` : ''}`);
      if (Array.isArray(r) && r.length > 0) return r;
    } catch (errEn) {
      try {
        const r2 = await request(`/notificacoes/enviadas${q ? `?${q}` : ''}`);
        if (Array.isArray(r2) && r2.length > 0) return r2;
      } catch (errPt) {
        try {
          const raw = localStorage.getItem('assetlife_notifications');
          const arr = raw ? JSON.parse(raw) : [];
          return arr.filter((n) => n && n.from_me);
        } catch {
          return [];
        }
      }
    }
    try {
      const raw = localStorage.getItem('assetlife_notifications');
      const arr = raw ? JSON.parse(raw) : [];
      return arr.filter((n) => n && n.from_me);
    } catch {
      return [];
    }
  }
  try {
    const r = await request(`/notifications${qEn ? `?${qEn}` : ''}`);
    if (Array.isArray(r) && r.length > 0) return r;
  } catch (errEn) {
    try {
      const r2 = await request(`/notificacoes${q ? `?${q}` : ''}`);
      if (Array.isArray(r2) && r2.length > 0) return r2;
    } catch (errPt) {
      try {
        const raw = localStorage.getItem('assetlife_notifications');
        let arr = raw ? JSON.parse(raw) : [];
        const st = (params?.status || '').toString();
        if (st) arr = arr.filter((n) => String(n.status || '').toLowerCase() === st.toLowerCase());
        return arr;
      } catch {
        return [];
      }
    }
  }
  try {
    const raw = localStorage.getItem('assetlife_notifications');
    let arr = raw ? JSON.parse(raw) : [];
    const st = (params?.status || '').toString();
    if (st) arr = arr.filter((n) => String(n.status || '').toLowerCase() === st.toLowerCase());
    return arr;
  } catch {
    return [];
  }
}

export async function getNotification(id) {
  try {
    const resEn = await request(`/notifications/${id}`);
    if (resEn) return resEn;
  } catch (errEn) {}
  try {
    const resPt = await request(`/notificacoes/${id}`);
    if (resPt) return resPt;
  } catch (errPt) {}
  try {
    const raw = localStorage.getItem('assetlife_notifications');
    const arr = raw ? JSON.parse(raw) : [];
    const hit = arr.find((n) => String(n.id) === String(id));
    return hit || null;
  } catch {
    return null;
  }
}

export async function createNotification(payload) {
  try {
    const permsRaw = localStorage.getItem('assetlife_permissoes');
    const rotas = permsRaw ? JSON.parse(permsRaw)?.rotas : [];
    const allowed = new Set(Array.isArray(rotas) ? rotas : []);
    const canSend = (
      allowed.size === 0
        ? true
        : (allowed.has('/notifications/new') || allowed.has('/notificacoes/nova'))
    );
    if (!canSend) {
      throw new Error('Permissão insuficiente para enviar notificações');
    }
  } catch {}
  const body = JSON.stringify(payload);
  const candidates = [
    '/notifications',
    '/notifications/send',
    '/notificacoes',
    '/notificacoes/enviar',
  ];
  for (const path of candidates) {
    try {
      const res = await request(path, { method: 'POST', body });
      if (res) return res;
    } catch (err) {
    }
  }
  let user = null;
  try { user = JSON.parse(localStorage.getItem('assetlife_user') || 'null'); } catch {}
  const now = new Date().toISOString();
  const item = {
    id: `local-${Date.now()}`,
    titulo: payload.titulo || payload.title || '',
    mensagem: payload.mensagem || payload.message || '',
    status: 'pendente',
    created_at: now,
    remetente: (user && (user.nome_completo || user.full_name)) || '',
    remetente_id: payload.remetente_id || payload.sender_id || (user ? user.id : undefined),
    empresa_ids: payload.empresa_ids || payload.company_ids || [],
    periodo_ids: payload.periodo_ids || payload.period_ids || [],
    usuario_ids: payload.usuario_ids || payload.user_ids || [],
    cc_usuario_ids: payload.cc_usuario_ids || payload.cc_user_ids || [],
    enviar_email: !!(payload.enviar_email || payload.send_email),
    notificar_todos: !!(payload.notificar_todos || payload.notify_all),
    from_me: true,
  };
  try {
    const raw = localStorage.getItem('assetlife_notifications');
    const arr = raw ? JSON.parse(raw) : [];
    arr.unshift(item);
    localStorage.setItem('assetlife_notifications', JSON.stringify(arr));
  } catch {}
  return item;
}

export async function markNotificationRead(id) {
  try {
    const r = await request(`/notifications/${id}/read`, { method: 'POST' });
    if (r) return r;
  } catch {}
  try {
    const r2 = await request(`/notificacoes/${id}/lida`, { method: 'POST' });
    if (r2) return r2;
  } catch {}
  try {
    const raw = localStorage.getItem('assetlife_notifications');
    const arr = raw ? JSON.parse(raw) : [];
    const idx = arr.findIndex((n) => String(n.id) === String(id));
    if (idx >= 0) {
      const now = new Date().toISOString();
      arr[idx] = { ...arr[idx], status: 'lida', read: true, updated_at: now };
      localStorage.setItem('assetlife_notifications', JSON.stringify(arr));
      return arr[idx];
    }
    return null;
  } catch {
    return null;
  }
}

export async function archiveNotification(id) {
  try {
    const r = await request(`/notifications/${id}/archive`, { method: 'POST' });
    if (r) return r;
  } catch {}
  try {
    const r2 = await request(`/notificacoes/${id}/arquivar`, { method: 'POST' });
    if (r2) return r2;
  } catch {}
  try {
    const raw = localStorage.getItem('assetlife_notifications');
    const arr = raw ? JSON.parse(raw) : [];
    const idx = arr.findIndex((n) => String(n.id) === String(id));
    if (idx >= 0) {
      const now = new Date().toISOString();
      arr[idx] = { ...arr[idx], status: 'arquivada', archived: true, updated_at: now };
      localStorage.setItem('assetlife_notifications', JSON.stringify(arr));
      return arr[idx];
    }
    return null;
  } catch {
    return null;
  }
}

// Vínculos: Empresas
export async function listGroupCompanies(grupoId) {
  return request(`/permissoes/grupos/${grupoId}/empresas`);
}

export async function addGroupCompany(grupoId, empresaId) {
  return request(`/permissoes/grupos/${grupoId}/empresas`, { method: 'POST', body: JSON.stringify({ id: Number(empresaId) }) });
}

export async function removeGroupCompany(grupoId, empresaId) {
  return request(`/permissoes/grupos/${grupoId}/empresas/${empresaId}`, { method: 'DELETE' });
}

// Vínculos: Transações
export async function listGroupTransactions(grupoId) {
  return request(`/permissoes/grupos/${grupoId}/transacoes`);
}

export async function addGroupTransaction(grupoId, transacaoId) {
  return request(`/permissoes/grupos/${grupoId}/transacoes`, { method: 'POST', body: JSON.stringify({ id: Number(transacaoId) }) });
}

export async function removeGroupTransaction(grupoId, transacaoId) {
  return request(`/permissoes/grupos/${grupoId}/transacoes/${transacaoId}`, { method: 'DELETE' });
}

// Vínculos: Usuários
export async function listGroupUsers(grupoId) {
  return request(`/permissoes/grupos/${grupoId}/usuarios`);
}

export async function addGroupUser(grupoId, usuarioId) {
  return request(`/permissoes/grupos/${grupoId}/usuarios`, { method: 'POST', body: JSON.stringify({ id: Number(usuarioId) }) });
}

export async function removeGroupUser(grupoId, usuarioId) {
  return request(`/permissoes/grupos/${grupoId}/usuarios/${usuarioId}`, { method: 'DELETE' });
}

// Clonagem de grupo
export async function clonePermissionGroup(grupoId, payload) {
  return request(`/permissoes/grupos/${grupoId}/clonar`, { method: 'POST', body: JSON.stringify(payload) });
}

// Auth (opcional)
export async function login(payload) {
  debugLog('[apiClient] login() chamado com payload:', { ...payload, senha: '***' });
  // Em produção (Koyeb free), a instância pode ter cold start e levar >90s para acordar.
  // Usa retry logic com exponential backoff para lidar com cold start.
  try {
    const result = await retryWithBackoff(
      () => request('/auth/login', { method: 'POST', body: JSON.stringify(payload), timeout: 120000 }),
      3, // máximo de 3 retries
      3000 // delay inicial de 3s
    );
    debugLog('[apiClient] login() retornou:', result ? 'OK' : 'null/undefined');
    return result;
  } catch (err) {
    console.error('[apiClient] login() erro:', err);
    throw err;
  }
}

export async function authMe(token) {
  return request('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
}

export function saveToken(token) {
  try { localStorage.setItem('assetlife_token', token); } catch {}
}

export function clearToken() {
  try {
    localStorage.removeItem('assetlife_token');
    localStorage.removeItem('assetlife_permissoes');
    localStorage.removeItem('assetlife_user');
  } catch {}
}

export async function authMePermissions() {
  return request('/auth/me/permissoes');
}

export async function forgotPassword(email) {
  return request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
}

export async function resetPassword(token, novaSenha, confirmarSenha) {
  return request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, nova_senha: novaSenha, confirmar_senha: confirmarSenha }) });
}

export async function changePassword(senhaAtual, novaSenha, confirmarSenha) {
  return request('/auth/change-password', { method: 'POST', body: JSON.stringify({ senha_atual: senhaAtual, nova_senha: novaSenha, confirmar_senha: confirmarSenha }) });
}


