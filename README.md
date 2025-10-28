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
Acesse `http://localhost:5173/`.

## Backend
Crie o `.env` baseado em `.env.example`.
```
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
API disponível em `http://localhost:8000/`.

## i18n
Idiomas suportados: inglês (en), português (pt), espanhol (es). Troca via seletor na UI.