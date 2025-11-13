import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../components/ui/Button';
import { getCompanies } from '../apiClient';

function CompanyCard({ company, onSelect, colorClass, iconClass }) {
  const {
    id,
    name,
    razao_social,
    nome,
    cnpj,
    city,
    cidade,
    state,
    estado,
    street,
    logradouro,
    district,
    bairro,
    status,
  } = company;

  const title = name || razao_social || nome || 'Empresa';
  const cityVal = city || cidade || '';
  const stateVal = state || estado || '';
  const location = [cityVal, stateVal].filter(Boolean).join(' / ');
  const streetVal = street || logradouro || '';
  const districtVal = district || bairro || '';
  const address = [streetVal, districtVal].filter(Boolean).join(', ');

  return (
    <div className={`rounded-xl border shadow-card p-4 flex flex-col gap-2 ${colorClass}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${iconClass}`}>🏢</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">{title}</h3>
          {cnpj && <p className="text-sm text-slate-700 dark:text-slate-300">CNPJ: {cnpj}</p>}
          {address && <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{address}</p>}
          {location && <p className="text-sm text-slate-700 dark:text-slate-300">{location}</p>}
        </div>
      </div>
      <div className="flex items-center justify-between mt-2">
        {status && (
          <span
            className={`inline-block text-xs px-2 py-1 rounded-md w-fit ${
              status?.toLowerCase() === 'ativo'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300'
            }`}
          >
            {status}
          </span>
        )}
        <Button onClick={() => onSelect(company)}>{'Acessar Empresa'}</Button>
      </div>
    </div>
  );
}

export default function SelectCompanyPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [companies, setCompanies] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  // Paleta suave consistente com Dashboard
  const accentColors = React.useMemo(() => ['blue', 'violet', 'emerald', 'amber', 'indigo', 'cyan', 'teal', 'rose'], []);
  const colorMap = React.useMemo(() => ({
    blue: {
      card: 'bg-blue-50/60 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30 hover:border-blue-200 dark:hover:border-blue-800',
      icon: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    },
    violet: {
      card: 'bg-violet-50/60 dark:bg-violet-900/20 border-violet-100 dark:border-violet-900/30 hover:border-violet-200 dark:hover:border-violet-800',
      icon: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
    },
    emerald: {
      card: 'bg-emerald-50/60 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30 hover:border-emerald-200 dark:hover:border-emerald-800',
      icon: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
    },
    amber: {
      card: 'bg-amber-50/60 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30 hover:border-amber-200 dark:hover:border-amber-800',
      icon: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    },
    indigo: {
      card: 'bg-indigo-50/60 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/30 hover:border-indigo-200 dark:hover:border-indigo-800',
      icon: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
    },
    cyan: {
      card: 'bg-cyan-50/60 dark:bg-cyan-900/20 border-cyan-100 dark:border-cyan-900/30 hover:border-cyan-200 dark:hover:border-cyan-800',
      icon: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300',
    },
    teal: {
      card: 'bg-teal-50/60 dark:bg-teal-900/20 border-teal-100 dark:border-teal-900/30 hover:border-teal-200 dark:hover:border-teal-800',
      icon: 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300',
    },
    rose: {
      card: 'bg-rose-50/60 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30 hover:border-rose-200 dark:hover:border-rose-800',
      icon: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300',
    },
  }), []);

  const load = React.useCallback(async () => {
    try {
      setLoading(true); setError(false);
      // empresas permitidas pelas permissões
      let allowedIds = [];
      try {
        const raw = localStorage.getItem('assetlife_permissoes');
        const perms = raw ? JSON.parse(raw) : null;
        allowedIds = Array.isArray(perms?.empresas_ids) ? perms.empresas_ids : [];
      } catch {}
      const list = await getCompanies();
      const arr = Array.isArray(list) ? list : [];
      const filtered = allowedIds.length > 0 ? arr.filter((c) => allowedIds.includes(Number(c.id))) : arr;
      setCompanies(filtered);
      // Se o usuário tem acesso a apenas uma empresa, selecionar automaticamente
      if (filtered.length === 1) {
        const only = filtered[0];
        try { localStorage.setItem('assetlife_empresa', String(only.id)); } catch {}
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  React.useEffect(() => { load(); }, [load]);

  const onSelect = (company) => {
    try { localStorage.setItem('assetlife_empresa', String(company.id)); } catch {}
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="container-page">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{t('select_company_title') || 'Selecione a Empresa'}</h2>
        <p className="text-slate-700 dark:text-slate-300">{t('select_company_subtitle') || 'Escolha a empresa para acessar seus dados.'}</p>
      </div>

      {loading && (
        <div className="text-slate-700 dark:text-slate-300">{t('loading') || 'Carregando...'}</div>
      )}
      {error && (
        <div className="text-red-600">{t('error_loading_companies') || 'Erro ao carregar empresas.'}</div>
      )}

      {!loading && !error && companies.length === 0 && (
        <div className="text-slate-700 dark:text-slate-300">{t('no_companies_available') || 'Nenhuma empresa disponível.'}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {companies.map((c, idx) => {
          const palette = colorMap[accentColors[idx % accentColors.length]] || colorMap.blue;
          return (
            <CompanyCard
              key={c.id || idx}
              company={c}
              onSelect={onSelect}
              colorClass={palette.card}
              iconClass={palette.icon}
            />
          );
        })}
      </div>
    </div>
  );
}