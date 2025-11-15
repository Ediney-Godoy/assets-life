# 🔍 Diagnóstico de Deploy - Asset Life

Use este guia para identificar exatamente onde está o problema.

---

## ✅ Checklist de Configuração

### **Backend (Koyeb)**

Acesse: https://app.koyeb.com → Seu app → Settings → Environment Variables

- [ ] `DATABASE_URL` = `postgresql+psycopg2://postgres:.2YRXsLjJ%bM8ss@db.igjnpthqofsfesmssvxi.supabase.co:5432/postgres?sslmode=require`
- [ ] `SECRET_KEY` = `ODPtmvFsLYRU8zKJuVvZboUB1KlRudOzhTtpJCWwFPY`
- [ ] `FRONTEND_ORIGIN` = `https://assets-life-bp3b.vercel.app`
- [ ] `FRONTEND_BASE_URL` = `https://assets-life-bp3b.vercel.app`
- [ ] `ALLOW_DDL` = `false`
- [ ] `PORT` = `8000`

**Status do Deploy:**
- [ ] Deploy completado com sucesso (não está em "Building" ou "Failed")
- [ ] Logs não mostram erros

### **Frontend (Vercel)**

Acesse: https://vercel.com/dashboard → Seu projeto

- [ ] Re-deploy foi feito após atualizar `.env.production`
- [ ] Último deploy tem status "Ready" ✅
- [ ] Build não tem erros

**Opcional (recomendado):**
- [ ] Variável `VITE_API_URL` = `https://brief-grete-assetlife-f50c6bd0.koyeb.app` adicionada

---

## 🧪 Testes Passo a Passo

Execute estes testes **NA ORDEM** e anote os resultados.

---

### **Teste 1: Backend está online?**

**Abra no navegador:**
```
https://brief-grete-assetlife-f50c6bd0.koyeb.app/health
```

**✅ Resposta esperada:**
```json
{"status":"ok"}
```

**❌ Se der erro:**
- 502/503/504: Backend está reiniciando (aguarde 1 minuto)
- Timeout: Backend não está rodando no Koyeb
- Connection refused: URL incorreta

---

### **Teste 2: API Docs carrega?**

**Abra no navegador:**
```
https://brief-grete-assetlife-f50c6bd0.koyeb.app/docs
```

**✅ Resposta esperada:**
- Página do Swagger/FastAPI carrega
- Mostra lista de endpoints (/auth/login, /companies, etc.)

**❌ Se não carregar:**
- Backend não está rodando corretamente
- Verifique logs no Koyeb

---

### **Teste 3: Banco de dados está conectado?**

Faça login na API **diretamente** (sem passar pelo frontend).

**Abra o Console do navegador (F12 → Console) e cole:**

```javascript
fetch('https://brief-grete-assetlife-f50c6bd0.koyeb.app/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@example.com',  // ⚠️ SUBSTITUA pelo seu email real
    senha: 'sua_senha_aqui'       // ⚠️ SUBSTITUA pela sua senha real
  })
})
.then(async response => {
  console.log('Status:', response.status);
  const data = await response.json();
  console.log('Resposta:', data);
  return data;
})
.catch(error => {
  console.error('Erro:', error);
});
```

**✅ Respostas possíveis:**

**SUCESSO (Status 200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
→ **Backend está funcionando! O problema está no frontend.**

**CREDENCIAIS INVÁLIDAS (Status 401):**
```json
{
  "detail": "Credenciais inválidas"
}
```
→ **Email/senha errados OU SECRET_KEY não configurada no Koyeb**

**ERRO DE CORS (Console mostra erro de CORS):**
```
Access to fetch at '...' from origin 'null' has been blocked by CORS policy
```
→ **FRONTEND_ORIGIN não está configurado corretamente no Koyeb**

**ERRO 500:**
```json
{
  "detail": "Internal Server Error"
}
```
→ **Problema no backend (provavelmente DATABASE_URL errada)**
→ Veja os logs no Koyeb

**TIMEOUT:**
```
TypeError: Failed to fetch
```
→ Backend não respondeu (pode estar em cold start - aguarde 30s e tente de novo)

---

### **Teste 4: Frontend está chamando a URL correta?**

**No frontend (https://assets-life-bp3b.vercel.app):**

1. Abra **DevTools** (F12)
2. Vá na aba **Network**
3. Marque "Preserve log"
4. Tente fazer login no frontend
5. Veja a requisição `/auth/login`

**✅ Verifique:**

**URL chamada deve ser:**
```
https://brief-grete-assetlife-f50c6bd0.koyeb.app/auth/login
```

**❌ Se estiver chamando outra URL:**
- `http://localhost:8000` → Frontend em DEV mode (não é a versão de produção)
- `https://assets-life.onrender.com` → Vercel não fez re-deploy
- Outra URL → Configuração incorreta

**Solução:** Force re-deploy na Vercel

---

### **Teste 5: CORS está configurado?**

No **Console do navegador (F12 → Console)**, depois de tentar fazer login, veja se há erros de CORS:

**❌ Erro de CORS:**
```
Access to XMLHttpRequest at 'https://brief-grete-assetlife-f50c6bd0.koyeb.app/auth/login'
from origin 'https://assets-life-bp3b.vercel.app' has been blocked by CORS policy
```

**Solução:**
- Verifique `FRONTEND_ORIGIN` no Koyeb
- Deve ser exatamente: `https://assets-life-bp3b.vercel.app` (sem "/" no final)
- Re-deploy do Koyeb após corrigir

---

## 📊 Tabela de Diagnóstico

| Teste | Resultado | Status | Ação |
|-------|-----------|--------|------|
| 1. /health | ✅ {"status":"ok"} | Backend OK | - |
| 1. /health | ❌ 502/503/504 | Backend reiniciando | Aguarde 1 min |
| 1. /health | ❌ Timeout | Backend offline | Verifique Koyeb |
| 2. /docs | ✅ Carregou | API OK | - |
| 2. /docs | ❌ Não carregou | Backend com problema | Veja logs Koyeb |
| 3. Login direto | ✅ Retornou token | Backend OK | Problema no frontend |
| 3. Login direto | ❌ 401 Credenciais inválidas | Auth com problema | Veja abaixo |
| 3. Login direto | ❌ Erro CORS | CORS incorreto | Corrigir FRONTEND_ORIGIN |
| 3. Login direto | ❌ 500 | Erro no backend | Veja logs, verifique DATABASE_URL |
| 4. URL no Network | ✅ brief-grete... | Frontend OK | - |
| 4. URL no Network | ❌ Outra URL | Frontend não atualizado | Re-deploy Vercel |

---

## 🔧 Soluções por Sintoma

### **Sintoma: "Credenciais inválidas" (mas tenho certeza que estão corretas)**

**Causas possíveis:**
1. `SECRET_KEY` não foi configurada no Koyeb
2. Usuário não existe no banco
3. Senha do banco de dados incorreta em `DATABASE_URL`

**Verificar:**
```bash
# Teste se o banco está acessível
# Use a documentação da API: /docs
# Tente criar um novo usuário primeiro
```

**Solução:**
1. Confirme que `SECRET_KEY` está no Koyeb exatamente como: `ODPtmvFsLYRU8zKJuVvZboUB1KlRudOzhTtpJCWwFPY`
2. Confirme que `DATABASE_URL` está correta (copie e cole do arquivo)
3. Verifique logs do Koyeb para erros de conexão com banco

---

### **Sintoma: CORS error**

**Causa:**
- `FRONTEND_ORIGIN` não configurado ou incorreto no Koyeb

**Solução:**
1. No Koyeb, configure: `FRONTEND_ORIGIN=https://assets-life-bp3b.vercel.app`
2. **SEM "/" no final**
3. **COM "https://"**
4. Aguarde re-deploy do Koyeb (2-3 min)

---

### **Sintoma: Timeout / "Failed to fetch"**

**Causas:**
1. Backend em cold start (primeira requisição após inatividade)
2. Backend offline
3. URL incorreta

**Solução:**
1. Aguarde 30-60 segundos (cold start do Koyeb)
2. Teste `/health` para ver se backend responde
3. Verifique logs do Koyeb

---

### **Sintoma: Frontend chama URL errada**

**Causa:**
- Vercel não fez re-deploy com `.env.production` atualizado

**Solução:**
1. Force re-deploy na Vercel
2. Aguarde 1-2 minutos
3. Limpe cache do navegador (Ctrl+Shift+R)
4. Se ainda persistir, adicione `VITE_API_URL` nas variáveis da Vercel

---

## 🆘 Logs do Koyeb

Se tudo acima falhar, veja os logs do backend:

1. Acesse: https://app.koyeb.com
2. Selecione seu app
3. Vá em **Logs**
4. Procure por erros em vermelho

**Erros comuns:**
- `could not connect to server` → DATABASE_URL incorreta
- `No module named 'app'` → Problema no build
- `Address already in use` → Porta incorreta
- `secret key not found` → SECRET_KEY não configurada

---

## 📝 Template de Reporte

Se ainda tiver problemas, me envie estas informações:

```
1. Teste /health:
   Resultado: [cole aqui]

2. Teste /docs:
   Resultado: [cole aqui]

3. Teste login direto (console):
   Status: [cole aqui]
   Resposta: [cole aqui]

4. URL chamada no Network:
   URL: [cole aqui]

5. Erros no Console do navegador:
   [cole aqui]

6. Variáveis configuradas no Koyeb:
   [ ] DATABASE_URL
   [ ] SECRET_KEY
   [ ] FRONTEND_ORIGIN
   [ ] FRONTEND_BASE_URL
   [ ] ALLOW_DDL
   [ ] PORT

7. Re-deploy feito na Vercel?
   [ ] Sim
   [ ] Não

8. Logs do Koyeb (últimas linhas):
   [cole aqui se houver erros]
```

---

**Com essas informações, posso identificar exatamente onde está o problema!** 🔍
