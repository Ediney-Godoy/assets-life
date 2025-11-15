# 🔧 Alterar Autor dos Últimos 3 Commits

## ✅ Opção 1: Usando `git rebase` (Recomendado)

```bash
# Iniciar rebase interativo dos últimos 3 commits
git rebase -i HEAD~3

# No editor que abrir, mude "pick" para "edit" nos 3 commits
# Salve e feche

# Para cada commit, execute:
git commit --amend --author="Ediney-Godoy <ediney.dev@gmail.com>" --no-edit
git rebase --continue

# Repita para os outros 2 commits
```

---

## ✅ Opção 2: Usando `git filter-branch` (Mais Rápido)

```bash
git filter-branch -f --env-filter '
if [ "$GIT_COMMITTER_DATE" != "" ]; then
  export GIT_AUTHOR_NAME="Ediney-Godoy"
  export GIT_AUTHOR_EMAIL="ediney.dev@gmail.com"
  export GIT_COMMITTER_NAME="Ediney-Godoy"
  export GIT_COMMITTER_EMAIL="ediney.dev@gmail.com"
fi
' HEAD~3..HEAD
```

---

## ✅ Opção 3: Script Automático (Mais Fácil)

Execute este comando que faz tudo automaticamente:

```bash
# Para os últimos 3 commits
for i in {0..2}; do
  git rebase -i HEAD~3
  # No editor, mude o commit correspondente para "edit"
  git commit --amend --author="Ediney-Godoy <ediney.dev@gmail.com>" --no-edit
  git rebase --continue
done
```

---

## ✅ Opção 4: Usando `git rebase` com `--exec` (Mais Moderno)

```bash
# Altera autor dos últimos 3 commits de uma vez
GIT_SEQUENCE_EDITOR="sed -i 's/^pick/edit/'" git rebase -i HEAD~3
git commit --amend --author="Ediney-Godoy <ediney.dev@gmail.com>" --no-edit
git rebase --continue
# Repita para os outros 2 commits
```

---

## 🚀 Solução Mais Simples (Recomendada):

```bash
# 1. Ver os últimos 3 commits
git log --oneline -3

# 2. Usar filter-branch (altera todos de uma vez)
git filter-branch -f --env-filter '
export GIT_AUTHOR_NAME="Ediney-Godoy"
export GIT_AUTHOR_EMAIL="ediney.dev@gmail.com"
export GIT_COMMITTER_NAME="Ediney-Godoy"
export GIT_COMMITTER_EMAIL="ediney.dev@gmail.com"
' HEAD~3..HEAD

# 3. Verificar se funcionou
git log --format="%h %an <%ae>" -3

# 4. Fazer force push
git push --force origin main
```

---

## ⚠️ IMPORTANTE:

- **Force push é necessário** se os commits já foram enviados ao GitHub
- **Force push sobrescreve o histórico** - certifique-se de que ninguém mais está trabalhando na branch
- **Faça backup** antes: `git branch backup-before-rebase`

---

## 📝 Passo a Passo Completo:

1. **Ver commits atuais:**
   ```bash
   git log --oneline -3
   ```

2. **Alterar autor dos últimos 3:**
   ```bash
   git filter-branch -f --env-filter '
   export GIT_AUTHOR_NAME="Ediney-Godoy"
   export GIT_AUTHOR_EMAIL="ediney.dev@gmail.com"
   export GIT_COMMITTER_NAME="Ediney-Godoy"
   export GIT_COMMITTER_EMAIL="ediney.dev@gmail.com"
   ' HEAD~3..HEAD
   ```

3. **Verificar:**
   ```bash
   git log --format="%h - %an <%ae>" -3
   ```

4. **Fazer push:**
   ```bash
   git push --force origin main
   ```

