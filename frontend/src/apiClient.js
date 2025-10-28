const BASE_URL = 'http://localhost:8000';

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout ?? 5000);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return res.json();
    }
    return res.text();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export async function getHealth() {
  return request('/health');
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
  return request('/unidades_gerenciais');
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
  return request('/usuarios');
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
  return request(`/revisoes/itens/${periodoId}`);
}

// Delegações de Revisão
export async function getReviewDelegations(periodoId) {
  return request(`/revisoes/delegacoes/${periodoId}`);
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
  return request(path);
}

export async function getCostCenter(id) {
  return request(`/centros_custos/${id}`);
}

export async function createCostCenter(payload) {
  return request('/centros_custos', { method: 'POST', body: JSON.stringify(payload) });
}