# 🔧 Corrigir Autor do Último Commit

## ✅ Solução Rápida:

Execute este comando para alterar o autor do último commit:

```bash
git commit --amend --author="Ediney-Godoy <ediney.dev@gmail.com>" --no-edit
```

Isso vai:
- ✅ Alterar o autor do último commit
- ✅ Manter a mensagem do commit
- ✅ Manter todas as mudanças

---

## 📤 Depois, force push (se já foi enviado):

Se você já fez push do commit anterior, precisará fazer force push:

```bash
git push --force origin main
```

⚠️ **ATENÇÃO**: Force push sobrescreve o histórico no GitHub. Certifique-se de que ninguém mais está trabalhando na branch.

---

## 🔍 Verificar antes de fazer push:

```bash
# Ver o autor do último commit
git log -1 --format="Autor: %an <%ae>"

# Ver todos os commits recentes
git log --oneline -5
```

---

## 📝 Passo a Passo Completo:

1. **Alterar autor do último commit:**
   ```bash
   git commit --amend --author="Ediney-Godoy <ediney.dev@gmail.com>" --no-edit
   ```

2. **Verificar se funcionou:**
   ```bash
   git log -1
   ```

3. **Fazer push (force se necessário):**
   ```bash
   git push --force origin main
   ```

---

## ⚠️ Importante:

- Se o commit **ainda não foi enviado** ao GitHub, use apenas `git push`
- Se o commit **já foi enviado**, use `git push --force`
- Force push pode afetar outros desenvolvedores se estiverem trabalhando na mesma branch

