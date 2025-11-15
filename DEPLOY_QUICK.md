# 🚀 Deploy Rápido - Asset Life

## ⚡ Deploy em 5 minutos

### **1. Frontend (Vercel) - 2 min**

1. Acesse [vercel.com](https://vercel.com) e faça login com GitHub
2. Clique em "Add New Project"
3. Importe seu repositório
4. Configure:
   - **Root Directory**: `front-end`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Adicione variável de ambiente:
   - `VITE_API_URL` = `https://seu-backend.koyeb.app` (você vai atualizar depois)
6. Deploy!

---

### **2. Backend (Koyeb) - 3 min** ⭐ RECOMENDADO

#### **Por que Koyeb?**
- ✅ 100% gratuito para MVP
- ✅ **NÃO hiberna** (sempre ativo)
- ✅ Deploy automático via GitHub
- ✅ SSL automático

#### **Passo a Passo:**

1. **Criar conta:** [koyeb.com](https://www.koyeb.com) (gratuita)

2. **Gerar SECRET_KEY:**
   ```bash
   cd backend
   python scripts/generate_secret_key.py
   ```
   Copie a chave gerada!

3. **No painel Koyeb:**
   - Clique em **"Create App"**
   - Selecione **"GitHub"** como fonte
   - Escolha seu repositório
   - Configure:
     - **Dockerfile Path**: `backend/Dockerfile`
     - **Working Directory**: `backend`

4. **Variáveis de Ambiente:**
   ```
   DATABASE_URL=postgresql+psycopg2://postgres:.2YRXsLjJ%bM8ss@db.igjnpthqofsfesmssvxi.supabase.co:5432/postgres?sslmode=require
   SECRET_KEY=[cole-aqui-a-chave-gerada]
   FRONTEND_ORIGIN=https://seu-app.vercel.app
   FRONTEND_BASE_URL=https://seu-app.vercel.app
   ALLOW_DDL=false
   PORT=8000
   ```

5. **Deploy!** Aguarde 2-3 minutos

6. **Copie a URL do backend** (ex: `https://seu-app.koyeb.app`)

---

### **3. Atualizar Frontend**

1. Volte na Vercel
2. Vá em **Settings > Environment Variables**
3. Atualize `VITE_API_URL` com a URL do seu backend Koyeb
4. Faça um novo deploy (ou aguarde o automático)

---

### **4. Testar**

1. Acesse: `https://seu-app.vercel.app`
2. Teste login: `admin` / `admin123`
3. Verifique API: `https://seu-backend.koyeb.app/docs`

---

## ✅ Pronto!

Seu sistema está rodando 24/7 sem hibernação e **100% gratuito**! 🎉

---

## 🔄 Alternativas

### **Google Cloud Run** (se preferir)
- Tier gratuito generoso
- Não hiberna se configurar `min-instances=1`
- Requer cartão (mas não cobra no tier gratuito)

### **Fly.io** (se preferir)
- Pode hibernar no plano gratuito
- Pode ter custos inesperados
- Veja `DEPLOY.md` para configuração completa

---

## 🆘 Problemas?

- **Backend não responde**: Verifique variáveis de ambiente
- **CORS error**: Verifique `FRONTEND_ORIGIN` está correto
- **Erro de banco**: Verifique `DATABASE_URL` do Supabase

Veja `DEPLOY.md` para troubleshooting completo.

