const PRIMARY_BASE = (import.meta?.env?.VITE_API_URL) || 'http://localhost:8000';
// Em produção (build do Vite em Vercel), use somente a base definida via ambiente
// para evitar qualquer tentativa de recurso http (Mixed Content) ou hosts/ports locais.
const IS_PROD = (() => {
  try { return !!(import.meta?.env?.PROD); } catch { return false; }
})();
// Ajuste: quando acessando via IP da rede (ex.: 192.168.x.x), usar o mesmo host para o backend
let HOST_BASE = null;
let HOST_BASE_ALT_PORT = null;
let ACTIVE_BASE = null;
try {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    HOST_BASE = `http://${window.location.hostname}:8000`;
    HOST_BASE_ALT_PORT = `http://${window.location.hostname}:8001`;
  }
} catch {}
// Inclui fallback automático para porta 8001 (documentada no README) e loopback
// Prioriza o mesmo host do frontend (HOST_BASE) para evitar bloqueios ao acessar via IP da rede
// Priorizar sempre a base definida via ambiente (produção) para evitar 404/CORS no domínio do frontend
const BASE_CANDIDATES = IS_PROD
  ? [PRIMARY_BASE]
  : [
      PRIMARY_BASE,
      HOST_BASE,
      'http://127.0.0.1:8000',
      HOST_BASE_ALT_PORT,
      'http://localhost:8001',
      'http://127.0.0.1:8001'
    ].filter(Boolean);

// Em contextos HTTPS (Vercel), bloqueia fallbacks http para evitar Mixed Content
const IS_HTTPS = (() => {
  try { return typeof window !== 'undefined' && window.location?.protocol === 'https:'; } catch { return false; }
})();
const SAFE_CANDIDATES = BASE_CANDIDATES.filter((b) => !IS_HTTPS || /^https:\/\//i.test(String(b)));

async function resolveBase() {
  // Se já temos uma base ativa, reutiliza
  if (ACTIVE_BASE) return ACTIVE_BASE;
  for (const base of SAFE_CANDIDATES) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    try {
      const res = await fetch(`${base}/health`, { signal: controller.signal, headers: { Accept: 'application/json' }, cache: 'no-store' });
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
  // Sem base validada; mantém ACTIVE_BASE nulo para tentativas no request()
  return SAFE_CANDIDATES[0];
}

function getToken() {
  try {
    return localStorage.getItem('assetlife_token');
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token && !(options.headers || {}).Authorization ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Anexa contexto de empresa selecionada (segregação de dados)
  try {
    const empresaId = localStorage.getItem('assetlife_empresa');
    // Não enviar X-Company-Id durante o login
    const isLoginPath = path === '/auth/login';
    if (empresaId && !headers['X-Company-Id'] && !isLoginPath) {
      headers['X-Company-Id'] = String(empresaId);
    }
  } catch {}

  let lastErr;
  // Tenta primeiro a base ativa (se houver), depois demais candidatas
  // Resolve uma base válida antes de tentar, reduzindo tentativas bloqueadas por Mixed Content
  const initialBase = await resolveBase();
  const bases = initialBase ? [initialBase, ...SAFE_CANDIDATES.filter(b => b !== initialBase)] : [...SAFE_CANDIDATES];
  for (const base of bases) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout ?? 20000);
    try {
      const res = await fetch(`${base}${path}`, {
        ...options,
        signal: controller.signal,
        headers,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const text = await res.text();
        if (res.status === 401 && /Token inválido|Not authenticated|Not Authorized|Unauthorized/i.test(text)) {
          try {
            localStorage.removeItem('assetlife_token');
            localStorage.removeItem('assetlife_permissoes');
            localStorage.removeItem('assetlife_user');
          } catch {}
          // Redireciona sem propagar erro para evitar logs desnecessários
          if (path !== '/auth/login' && typeof window !== 'undefined') {
            try { window.location.href = '/login'; } catch {}
          }
          return null;
        }
        // Para erros de cliente/negócio, não tenta próximo base
        if (res.status >= 400 && res.status < 500) {
          throw new Error(`HTTP ${res.status}: ${text}`);
        }
        lastErr = new Error(`HTTP ${res.status}: ${text}`);
        continue;
      }
      // Marca base ativa caso ainda não esteja definida
      if (!ACTIVE_BASE) {
        ACTIVE_BASE = base;
        try { if (typeof window !== 'undefined') window.__ASSETS_API_BASE = ACTIVE_BASE; } catch {}
      }
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return res.json();
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
      // Tratamento amigável para abort por timeout
      if (err?.name === 'AbortError' || /aborted|AbortError/i.test(String(err?.message || ''))) {
        lastErr = new Error('Tempo limite atingido. Ajuste os filtros ou tente novamente.');
      } else {
        lastErr = err;
      }
      // tenta próximo base em caso de falhas de rede/timeout
      continue;
    }
  }
  // Mensagem amigável para erros genéricos de rede (ex.: CORS, servidor offline)
  const msg = String(lastErr?.message || '');
  if (/Failed to fetch|NetworkError|TypeError: Failed to fetch/i.test(msg)) {
    throw new Error('Falha de conexão com a API. Verifique se o backend está ativo (porta 8000), o token de acesso e as permissões/CORS.');
  }
  throw lastErr || new Error('Falha ao conectar ao backend');
}

export async function getHealth(options = {}) {
  try {
    const base = await resolveBase();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), Math.max(options.timeout ?? 0, 3000));
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
  // Em falta de endpoint, retorna lista vazia para manter a tela funcional
  return [];
}

// --- Relatórios RVU ---
export async function getRelatoriosResumo(params = {}) {
  const q = new URLSearchParams(Object.entries(params).filter(([_, v]) => v != null && v !== '')).toString();
  // Em datasets grandes a consulta pode demorar; ampliar timeout
  return request(`/relatorios/rvu/resumo${q ? `?${q}` : ''}`, { timeout: 60000 });
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

export async function getUsers(empresaId) {
  // Lista de usuários pode ter volume considerável; dar mais margem
  const opts = { timeout: 8000 };
  if (empresaId) {
    opts.headers = { 'X-Company-Id': String(empresaId) };
  }
  return request('/usuarios', opts);
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
  const url = `${base}/revisoes/upload_base/${periodoId}`;
  const form = new FormData();
  form.append('file', file);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      body: form,
      signal: controller.signal,
      headers: (() => {
        const t = getToken();
        return t ? { Authorization: `Bearer ${t}` } : undefined;
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
  // Carregamento pode ser pesado; aumentar timeout para evitar abort precoce
  return request(`/revisoes/itens/${periodoId}`, { timeout: 20000 });
}

// Atualizar item de revisão (útil para ajustar vida útil, data fim e metadados)
export async function updateReviewItem(periodoId, itemId, payload) {
  return request(`/revisoes/${periodoId}/itens/${itemId}`, { method: 'PUT', body: JSON.stringify(payload) });
}

// Aplicar revisão em massa
export async function applyMassRevision(payload) {
  // payload: { ativos_ids: number[], incremento?, nova_vida_util_anos?, nova_vida_util_meses?, nova_data_fim?, condicao_fisica?, motivo?, justificativa? }
  return request('/revisoes/massa', { method: 'POST', body: JSON.stringify(payload), timeout: 20000 });
}

// Delegações de Revisão
export async function getReviewDelegations(periodoId) {
  // Pode haver volume razoável; aumentar timeout
  return request(`/revisoes/delegacoes/${periodoId}`, { timeout: 15000 });
}

export async function createReviewDelegation(payload) {
  return request('/revisoes/delegacoes', { method: 'POST', body: JSON.stringify(payload) });
}

export async function deleteReviewDelegation(id) {
  return request(`/revisoes/delegacoes/${id}`, { method: 'DELETE' });
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
  return request(path, { timeout: 12000 });
}

export async function getCostCenter(id) {
  return request(`/centros_custos/${id}`);
}

export async function createCostCenter(payload) {
  return request('/centros_custos', { method: 'POST', body: JSON.stringify(payload) });
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
  return request(`/supervisao/rvu/listar${q ? `?${q}` : ''}`, { timeout: 60000 });
}

export async function comentarSupervisaoRVU(payload) {
  return request('/supervisao/rvu/comentar', { method: 'POST', body: JSON.stringify(payload) });
}

export async function reverterSupervisaoRVU(payload) {
  return request('/supervisao/rvu/reverter', { method: 'POST', body: JSON.stringify(payload) });
}

export async function aprovarSupervisaoRVU(payload) {
  return request('/supervisao/rvu/aprovar', { method: 'POST', body: JSON.stringify(payload) });
}

export async function historicoSupervisaoRVU(params = {}) {
  const q = new URLSearchParams(Object.entries(params).filter(([_, v]) => v != null && v !== '')).toString();
  // Histórico é informativo; dar mais tempo para bases grandes
  return request(`/supervisao/rvu/historico${q ? `?${q}` : ''}`, { timeout: 60000 });
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
  // Em produção (Render free), a instância pode ter cold start (>50s).
  // Aumenta o timeout para evitar abort prematuro na primeira chamada.
  return request('/auth/login', { method: 'POST', body: JSON.stringify(payload), timeout: 60000 });
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