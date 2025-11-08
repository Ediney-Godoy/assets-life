# Asset Life

Projeto inicial com frontend React (Vite) e backend FastAPI.

## Requisitos
- Node.js 18+
- Python 3.11+
- PostgreSQL 14+

## Frontend
```
cd frontend
npm install
npm run dev
```
Acesse `http://localhost:5175/`.

## Backend
Crie o `.env` baseado em `.env.example`.
```
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn backend.app.main:app --host 0.0.0.0 --reload --port 8001
```
API disponível em `http://localhost:8001/`.

## Banco de Dados
O projeto utiliza exclusivamente PostgreSQL. Configure o arquivo `.env` (na raiz do projeto ou `backend/.env`) com a URL do banco:

```
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/assetlife
```

Após configurar e garantir o PostgreSQL rodando, execute as migrações:

```
cd backend
alembic upgrade head
```

Observação: não há compartilhamento de dados com outros sistemas; este projeto está completamente isolado.

## i18n
Idiomas suportados: inglês (en), português (pt), espanhol (es). Troca via seletor na UI.

## Deploy (Vercel + Supabase + Backend host)

- Frontend (Vercel)
  - Conecte o repositório GitHub e selecione a pasta `frontend/` como root do projeto.
  - Configure variáveis:
    - `VITE_API_URL` = URL pública do backend (ex.: `https://assets-life-backend.onrender.com`).
  - Build e deploy automáticos a cada push.

- Banco de dados (Supabase)
  - Crie um projeto e obtenha a connection string Postgres (`postgresql://user:pass@host:port/db`).
  - Defina `DATABASE_URL` no backend com essa string.
  - Execute migrações Alembic: `alembic upgrade head`.

- Backend (Render/Railway/Fly.io)
  - Use o `backend/Dockerfile` para rodar FastAPI com Uvicorn.
  - Variáveis de ambiente recomendadas:
    - `DATABASE_URL` = string do Supabase
    - `SECRET_KEY` = chave JWT forte
    - `FRONTEND_ORIGIN` = domínio do app Vercel (ex.: `https://<app>.vercel.app`)
    - `FRONTEND_BASE_URL` = mesmo domínio, para links gerados (reset de senha)
    - `ALLOW_DDL` = `false` em produção; use Alembic
  - Valide `GET /health` e `GET /docs` após deploy.

- GitHub Actions (migrações Alembic)
  - Workflow manual disponível em `.github/workflows/alembic_migrate.yml`.
  - Configure o segredo `DATABASE_URL` no repositório GitHub.
  - Dispare a execução pelo Actions > Alembic Migrate > Run workflow.

- Testes pós-deploy
  - Frontend: acessar `https://<app>.vercel.app` e verificar `/health` do backend.
  - Relatórios RVU: gerar cronograma mensal:
    - JSON: `GET /relatorios/rvu/cronograma?item_id=...` (token necessário)
    - Excel: `GET /relatorios/rvu/cronograma/excel?item_id=...` (token necessário)