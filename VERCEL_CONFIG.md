# 🚀 Configuração da Vercel - Frontend

## 📋 Resumo

O frontend precisa saber a URL do backend para fazer as chamadas de API.

---

## ✅ Opção 1: Re-deploy Automático (Mais Simples)

Como o arquivo `.env.production` foi atualizado e commitado, a Vercel deve fazer re-deploy automaticamente quando detectar o push no GitHub.

### Verificar se o deploy aconteceu:

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto: **assets-life** (ou o nome que você deu)
3. Vá em **Deployments**
4. Verifique se há um deploy **recente** (últimos minutos)
5. Status deve estar: **Ready** ✅

### Se NÃO houver deploy recente:

**Force um novo deploy:**
1. Clique em **Deployments**
2. Encontre o último deploy
3. Clique nos **3 pontinhos** (⋮)
4. Clique em **Redeploy**
5. Confirme **Redeploy**

---

## ✅ Opção 2: Variável de Ambiente (Melhor Prática)

Esta é a forma **recomendada** para produção, pois permite mudar a URL sem fazer novo commit.

### Passos:

1. **Acesse o painel da Vercel:**
   - https://vercel.com/dashboard
   - Selecione seu projeto

2. **Configure a variável:**
   - Vá em: **Settings** → **Environment Variables**
   - Clique em **Add Variable**

3. **Adicione:**
   - **Key:** `VITE_API_URL`
   - **Value:** `https://different-marlie-assetslifev2-bc199b4b.koyeb.app`
   - **Environments:** Marque **Production** ✅ (e Preview/Development se necessário)

4. **Salve e Re-deploy:**
   - Clique em **Save**
   - Vá em **Deployments**
   - Force um **Redeploy** do último deployment

---

## ⚙️ Configurações Importantes da Vercel

### **Root Directory:**
```
front-end
```
(Vercel deve buildar a partir da pasta `front-end`)

### **Build Command:**
```
npm run build
```

### **Output Directory:**
```
dist
```

### **Install Command:**
```
npm install
```

### **Framework Preset:**
```
Vite
```
(ou "Other" se Vite não estiver listado)

---

## 🧪 Como Testar

### 1. Aguarde o deploy completar (1-2 minutos)

### 2. Limpe o cache do navegador:
- **Chrome/Edge:** `Ctrl + Shift + R` (Windows) ou `Cmd + Shift + R` (Mac)
- **Firefox:** `Ctrl + F5` (Windows) ou `Cmd + Shift + R` (Mac)
- Ou abra em **Modo Anônimo/Privado**

### 3. Teste o frontend:
1. Acesse: https://assets-life-bp3b.vercel.app
2. Abra o **Console do navegador** (F12 → Console)
3. Tente fazer login
4. Veja se há erros no console

### 4. Verifique a URL sendo chamada:
No console, você deve ver chamadas para:
```
https://brief-grete-assetlife-f50c6bd0.koyeb.app/auth/login
```

Se estiver chamando outra URL (como `assets-life.onrender.com`), o deploy não foi atualizado.

---

## 🐛 Troubleshooting

### Login ainda não funciona após re-deploy:

**1. Verifique a URL no Network do navegador:**
- Abra DevTools (F12)
- Vá na aba **Network**
- Tente fazer login
- Veja qual URL está sendo chamada
- Deve ser: `https://brief-grete-assetlife-f50c6bd0.koyeb.app/auth/login`

**2. Se a URL estiver ERRADA:**
- O deploy não pegou a mudança
- Force um **Redeploy** na Vercel
- Aguarde 1-2 minutos
- Limpe o cache do navegador

**3. Se a URL estiver CERTA mas retorna erro 401/403:**
- O problema está no backend (variáveis de ambiente do Koyeb)
- Verifique se configurou TODAS as 6 variáveis no Koyeb
- Veja o arquivo `KOYEB_ENV_VARS.md`

**4. Se aparecer erro de CORS:**
- Verifique a variável `FRONTEND_ORIGIN` no Koyeb
- Deve ser exatamente: `https://assets-life-bp3b.vercel.app`
- Sem "/" no final

**5. Erro 502/504/timeout:**
- O backend no Koyeb pode estar reiniciando (cold start)
- Aguarde 30-60 segundos
- Teste o health: https://brief-grete-assetlife-f50c6bd0.koyeb.app/health

---

## 📊 Checklist Completo

### Vercel:
- [ ] Re-deploy foi feito (ou forçado)
- [ ] Deploy está com status **Ready**
- [ ] Variável `VITE_API_URL` configurada (opcional mas recomendado)
- [ ] Root Directory: `front-end`
- [ ] Build Command: `npm run build`

### Koyeb (do arquivo KOYEB_ENV_VARS.md):
- [ ] `DATABASE_URL` configurado
- [ ] `SECRET_KEY` configurado
- [ ] `FRONTEND_ORIGIN` configurado
- [ ] `FRONTEND_BASE_URL` configurado
- [ ] `ALLOW_DDL=false`
- [ ] `PORT=8000`

### Testes:
- [ ] Backend health: https://brief-grete-assetlife-f50c6bd0.koyeb.app/health
- [ ] API Docs: https://brief-grete-assetlife-f50c6bd0.koyeb.app/docs
- [ ] Frontend: https://assets-life-bp3b.vercel.app
- [ ] Cache do navegador limpo
- [ ] Console do navegador sem erros de CORS
- [ ] Network mostra URL correta do Koyeb

---

## 💡 Dica Pro

Para debug rápido, adicione isto temporariamente no código:

```javascript
// No arquivo apiClient.js, adicione um console.log
console.log('API Base URL:', PRIMARY_BASE);
```

Depois faça re-deploy e veja no console do navegador qual URL está sendo usada.

---

## 🆘 Ainda com Problemas?

Me envie:
1. Print da aba **Network** do navegador (ao fazer login)
2. Erros do **Console** do navegador
3. Status do último **Deployment** na Vercel
4. Resultado do teste: https://brief-grete-assetlife-f50c6bd0.koyeb.app/health
