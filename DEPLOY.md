# 🚀 Guia de Deploy - Asset Life

## 📋 Visão Geral

Este guia cobre o deploy completo do sistema na nuvem:
- **Frontend**: Vercel (gratuito, sem hibernação)
- **Backend**: Opções gratuitas sem hibernação
- **Database**: Supabase (já configurado)

---

## 🎯 Opções de Backend Gratuitas (SEM Hibernação)

### ✅ **1. Koyeb (RECOMENDADO para MVP)**
- ✅ **100% Gratuito** para MVP
- ✅ **NÃO hiberna** (sempre ativo 24/7)
- ✅ Suporta Docker
- ✅ Deploy automático via GitHub
- ✅ SSL automático
- ⚠️ Limite: 2 serviços simultâneos no plano gratuito

### ✅ **2. Google Cloud Run**
- ✅ **Tier gratuito generoso** (2 milhões de requisições/mês)
- ✅ **NÃO hiberna** se configurado com mínimo de instâncias = 1
- ✅ Escalável automaticamente
- ⚠️ Requer cartão de crédito (mas não cobra no tier gratuito)

### ⚠️ **3. Fly.io**
- ✅ Plano gratuito disponível
- ⚠️ **PODE hibernar** após inatividade (mas pode ser configurado)
- ⚠️ Limite de recursos no plano gratuito

### ❌ **4. Render**
- ❌ Hiberna após 15min de inatividade (não recomendado)

---

## 🚀 Deploy Completo - Passo a Passo

### **1. Frontend na Vercel** ✅

1. **Conecte o repositório GitHub na Vercel:**
   - Acesse [vercel.com](https://vercel.com)
   - Importe o repositório
   - Configure:
     - **Root Directory**: `front-end`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`

2. **Variáveis de Ambiente:**
   ```
   VITE_API_URL=https://seu-backend.koyeb.app
   ```
   (Substitua pela URL do seu backend após deploy)

3. **Deploy automático** a cada push no GitHub

---

### **2. Backend no Koyeb** (Recomendado)

#### **Pré-requisitos:**
- Conta no [Koyeb](https://www.koyeb.com) (gratuita)
- Repositório no GitHub

#### **Passo a Passo:**

1. **Criar arquivo `koyeb.toml`** (já criado no projeto)

2. **No painel Koyeb:**
   - Clique em "Create App"
   - Selecione "GitHub" como fonte
   - Escolha seu repositório
   - Configure:
     - **Build Command**: (deixe vazio, usa Dockerfile)
     - **Run Command**: (deixe vazio, usa Dockerfile)
     - **Dockerfile Path**: `backend/Dockerfile`
     - **Working Directory**: `backend`

3. **Variáveis de Ambiente no Koyeb:**
   ```
   DATABASE_URL=postgresql+psycopg2://postgres:SUA_SENHA@db.igjnpthqofsfesmssvxi.supabase.co:5432/postgres?sslmode=require
   SECRET_KEY=uma-chave-secreta-forte-aqui-gerada-aleatoriamente
   FRONTEND_ORIGIN=https://seu-app.vercel.app
   FRONTEND_BASE_URL=https://seu-app.vercel.app
   ALLOW_DDL=false
   PORT=8000
   ```

4. **Deploy automático** a cada push

5. **URL do backend**: `https://seu-app.koyeb.app`

---

### **3. Backend no Google Cloud Run** (Alternativa)

#### **Pré-requisitos:**
- Conta Google Cloud (requer cartão, mas não cobra no tier gratuito)
- Google Cloud SDK instalado

#### **Passo a Passo:**

1. **Criar projeto no Google Cloud Console**

2. **Ativar Cloud Run API**

3. **Build e Deploy:**
   ```bash
   # Autenticar
   gcloud auth login
   
   # Configurar projeto
   gcloud config set project SEU_PROJECT_ID
   
   # Build da imagem
   gcloud builds submit --tag gcr.io/SEU_PROJECT_ID/assets-life-backend ./backend
   
   # Deploy no Cloud Run
   gcloud run deploy assets-life-backend \
     --image gcr.io/SEU_PROJECT_ID/assets-life-backend \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --min-instances 1 \
     --max-instances 10 \
     --set-env-vars "DATABASE_URL=postgresql+psycopg2://postgres:SUA_SENHA@db.igjnpthqofsfesmssvxi.supabase.co:5432/postgres?sslmode=require,SECRET_KEY=uma-chave-secreta-forte,FRONTEND_ORIGIN=https://seu-app.vercel.app,ALLOW_DDL=false"
   ```

4. **Configurar mínimo de instâncias = 1** para evitar hibernação

---

### **4. Backend no Fly.io** (Se preferir)

#### **Configuração para evitar hibernação:**

1. **Instalar Fly CLI:**
   ```bash
   # Windows (PowerShell)
   iwr https://fly.io/install.ps1 -useb | iex
   ```

2. **Login:**
   ```bash
   fly auth login
   ```

3. **Criar app:**
   ```bash
   cd backend
   fly launch
   ```

4. **Configurar `fly.toml`** (já criado):
   - Define `min_machines = 1` para evitar hibernação

5. **Variáveis de ambiente:**
   ```bash
   fly secrets set DATABASE_URL="postgresql+psycopg2://..."
   fly secrets set SECRET_KEY="sua-chave-secreta"
   fly secrets set FRONTEND_ORIGIN="https://seu-app.vercel.app"
   ```

6. **Deploy:**
   ```bash
   fly deploy
   ```

⚠️ **Nota**: Fly.io pode ter custos se exceder o limite gratuito. Koyeb é mais seguro para MVP.

---

## 🔧 Configurações Importantes

### **Variáveis de Ambiente do Backend:**

```env
# Banco de Dados (Supabase)
DATABASE_URL=postgresql+psycopg2://postgres:SENHA@db.PROJETO.supabase.co:5432/postgres?sslmode=require

# Segurança
SECRET_KEY=gerar-uma-chave-aleatoria-forte-aqui

# Frontend
FRONTEND_ORIGIN=https://seu-app.vercel.app
FRONTEND_BASE_URL=https://seu-app.vercel.app

# Configurações
ALLOW_DDL=false
PORT=8000
```

### **Gerar SECRET_KEY:**
```python
import secrets
print(secrets.token_urlsafe(32))
```

---

## 📝 Checklist de Deploy

- [ ] Backend deployado (Koyeb/Cloud Run/Fly.io)
- [ ] Frontend deployado na Vercel
- [ ] Variáveis de ambiente configuradas
- [ ] CORS configurado corretamente
- [ ] Testar endpoint `/health` do backend
- [ ] Testar login no frontend
- [ ] Verificar conexão com Supabase
- [ ] Migrações executadas (já feitas)

---

## 🧪 Testes Pós-Deploy

1. **Backend Health:**
   ```bash
   curl https://seu-backend.koyeb.app/health
   ```

2. **API Docs:**
   ```
   https://seu-backend.koyeb.app/docs
   ```

3. **Frontend:**
   ```
   https://seu-app.vercel.app
   ```

---

## 💡 Dicas

- **Koyeb** é a melhor opção para MVP: gratuito, sem hibernação, fácil de usar
- **Google Cloud Run** é bom se você já tem conta Google
- **Fly.io** pode ter custos inesperados
- Sempre use `ALLOW_DDL=false` em produção
- Mantenha `SECRET_KEY` seguro e nunca commite no Git

---

## 🆘 Troubleshooting

### Backend não responde:
- Verificar variáveis de ambiente
- Verificar logs no painel do provedor
- Verificar se porta está correta (8000)

### CORS errors:
- Verificar `FRONTEND_ORIGIN` está correto
- Verificar regex de CORS no `main.py`

### Erro de conexão com banco:
- Verificar `DATABASE_URL` está correto
- Verificar se Supabase permite conexões externas
- Verificar SSL mode (`?sslmode=require`)

