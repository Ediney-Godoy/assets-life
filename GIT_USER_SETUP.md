# 🔧 Configurar Usuário Git para Commit

## Opção 1: Apenas para este repositório (Recomendado)

```bash
# Configurar nome e email apenas para este projeto
git config user.name "Nome do Outro Usuário"
git config user.email "email@exemplo.com"

# Verificar configuração
git config user.name
git config user.email
```

## Opção 2: Globalmente (todos os repositórios)

```bash
# Configurar nome e email globalmente
git config --global user.name "Nome do Outro Usuário"
git config --global user.email "email@exemplo.com"

# Verificar configuração
git config --global user.name
git config --global user.email
```

## Opção 3: Apenas para este commit (sem mudar configuração)

```bash
# Fazer commit com usuário específico sem alterar configuração
git commit --author="Nome <email@exemplo.com>" -m "mensagem do commit"
```

---

## 📝 Exemplo Prático:

Se você quiser usar o usuário "João Silva" com email "joao@empresa.com":

```bash
# Apenas para este repositório
git config user.name "João Silva"
git config user.email "joao@empresa.com"

# Depois fazer o commit normalmente
git commit -m "feat: adiciona configuração de deploy..."
```

---

## ⚠️ Importante:

- A configuração **local** (apenas este repo) tem prioridade sobre a **global**
- Você pode verificar qual está sendo usada com: `git config --list --show-origin`

