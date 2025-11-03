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