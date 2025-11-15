# 📝 Guia de Commit - Antes do Deploy

## ✅ O que COMMITAR:

### **Arquivos de Configuração de Deploy:**
```bash
git add DEPLOY.md
git add DEPLOY_QUICK.md
git add backend/koyeb.toml
git add backend/fly.toml
git add backend/scripts/generate_secret_key.py
```

### **Ajustes no Código:**
```bash
git add .gitignore
git add backend/Dockerfile
git add backend/app/main.py  # CORS atualizado para produção
```

### **Migrações do Banco (importantes!):**
```bash
git add backend/alembic/versions/*.py
```

---

## ❌ O que NÃO commitar:

### **Arquivos Sensíveis:**
- ❌ `.env` (contém senha do Supabase!)
- ❌ `env-example.txt` (pode conter dados sensíveis)

### **Arquivos Gerados:**
- ❌ `front-end/node_modules/` (já está no .gitignore)
- ❌ Qualquer arquivo de cache

---

## 🚀 Comandos para Commit:

```bash
# 1. Remover .env do Git (se já estava rastreado)
git rm --cached .env 2>/dev/null || true

# 2. Adicionar arquivos importantes
git add .gitignore
git add DEPLOY.md DEPLOY_QUICK.md
git add backend/koyeb.toml backend/fly.toml
git add backend/scripts/generate_secret_key.py
git add backend/Dockerfile
git add backend/app/main.py
git add backend/alembic/versions/*.py

# 3. Commit
git commit -m "feat: adiciona configuração de deploy (Koyeb/Vercel) e ajusta CORS para produção

- Adiciona guias de deploy (DEPLOY.md e DEPLOY_QUICK.md)
- Configura Koyeb e Fly.io para backend
- Atualiza CORS para aceitar domínios de produção
- Ajusta migrações Alembic para banco existente
- Adiciona script para gerar SECRET_KEY
- Atualiza Dockerfile para usar porta do ambiente"

# 4. Push
git push origin main
```

---

## ⚠️ IMPORTANTE:

1. **NUNCA commite o `.env`** - ele contém a senha do Supabase!
2. O `.env` agora está no `.gitignore`, então não será commitado acidentalmente
3. As variáveis de ambiente devem ser configuradas diretamente no Koyeb/Vercel

---

## ✅ Após o Commit:

1. O Vercel vai fazer deploy automático do frontend
2. Você pode fazer deploy do backend no Koyeb usando o código atualizado
3. Tudo estará sincronizado!

