const PRIMARY_BASE = (import.meta?.env?.VITE_API_URL) || 'http://localhost:8001';
const BASE_CANDIDATES = [PRIMARY_BASE, 'http://127.0.0.1:8001'];

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

  let lastErr;
  for (const base of BASE_CANDIDATES) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout ?? 5000);
    try {
      const res = await fetch(`${base}${path}`, {
        ...options,
        signal: controller.signal,
        headers,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const text = await res.text();
        if (res.status === 401 && /Token inválido|Not authenticated/i.test(text)) {
          try {
            localStorage.removeItem('assetlife_token');
            localStorage.removeItem('assetlife_permissoes');
            localStorage.removeItem('assetlife_user');
          } catch {}
          if (path !== '/auth/login' && typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        // Para erros de cliente/negócio, não tenta próximo base
        if (res.status >= 400 && res.status < 500) {
          throw new Error(`HTTP ${res.status}: ${text}`);
        }
        lastErr = new Error(`HTTP ${res.status}: ${text}`);
        continue;
      }
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return res.json();
      }
      return res.text();
    } catch (err) {
      clearTimeout(timeoutId);
      lastErr = err;
      // tenta próximo base em caso de falhas de rede/timeout
      continue;
    }
  }
  throw lastErr || new Error('Falha ao conectar ao backend');
}

export async function getHealth(options = {}) {
  return request('/health', { ...options, timeout: Math.max(options.timeout ?? 0, 6000) });
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
export async function getManagementUnits() {
  // Pode ser volumoso em bases grandes; aumentar timeout para evitar abort precoce
  return request('/unidades_gerenciais', { timeout: 12000 });
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

export async function getUsers() {
  // Lista de usuários pode ter volume considerável; dar mais margem
  return request('/usuarios', { timeout: 8000 });
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
  const url = `${BASE_URL}/revisoes/upload_base/${periodoId}`;
  const form = new FormData();
  form.append('file', file);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      body: form,
      signal: controller.signal,
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
  return request('/auth/login', { method: 'POST', body: JSON.stringify(payload) });
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