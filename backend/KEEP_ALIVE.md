# Prevenção de Hibernação do Servidor 🚀

Este documento descreve as soluções para evitar que o servidor backend entre em hibernação quando hospedado em planos gratuitos (Render, Koyeb, Fly.io, etc.).

## Problema

Planos gratuitos de hospedagem geralmente colocam o servidor em modo "sleep" após 15-30 minutos de inatividade. Quando o servidor hiberna, a primeira requisição após o período de inatividade demora 1-2 minutos para responder (cold start).

## Soluções Implementadas

### 1. 🤖 GitHub Actions (Ping Externo) - RECOMENDADO

**Status:** ⏳ Requer configuração manual (uma única vez)

Uma GitHub Action executa a cada 5 minutos fazendo ping no endpoint `/health` do backend.

**Arquivo:** `.github/workflows/keep-alive.yml`

**Como configurar:**

1. **Configurar a URL do backend:**
   - Vá em: `Settings > Secrets and variables > Actions`
   - Crie um novo secret: `BACKEND_URL`
   - Valor: URL completa do seu backend (ex: `https://seu-app.koyeb.app`)

2. **Habilitar GitHub Actions:**
   - Vá em: `Settings > Actions > General`
   - Em "Actions permissions", selecione "Allow all actions and reusable workflows"
   - Salve as configurações

3. **Executar manualmente (opcional):**
   - Vá em: `Actions > Keep Server Alive > Run workflow`

**Vantagens:**
- ✅ Grátis (GitHub Actions gratuito para repositórios públicos)
- ✅ Tráfego externo real
- ✅ Monitora a saúde do servidor
- ✅ Pode ser executado manualmente
- ✅ Não interfere no código do servidor

**Desvantagens:**
- ⚠️ Pode ter atraso de 10-15 minutos em horários de pico
- ⚠️ Limitado a execuções a cada 5 minutos (mínimo do cron)

**Limitações do GitHub Actions:**
- Repositórios públicos: 2.000 minutos/mês (grátis)
- Repositórios privados: 2.000 minutos/mês (pode precisar de plano pago)

---

### 2. 🌐 Serviços Externos de Monitoring (ALTAMENTE RECOMENDADO)

**Status:** 📋 Configuração manual externa

Use serviços gratuitos de monitoramento que fazem ping automático:

#### Opção A: UptimeRobot (Recomendado)

1. Acesse: https://uptimerobot.com
2. Crie uma conta gratuita
3. Adicione um novo monitor:
   - Monitor Type: `HTTP(s)`
   - Friendly Name: `Assets Life Backend`
   - URL: `https://seu-backend.koyeb.app/health`
   - Monitoring Interval: `5 minutes`
4. Salve

**Vantagens:**
- ✅ 50 monitores gratuitos
- ✅ Intervalo de 5 minutos
- ✅ Alertas por email/SMS/Slack
- ✅ Status page pública opcional
- ✅ Muito confiável e estável

#### Opção B: Cron-job.org

1. Acesse: https://cron-job.org
2. Crie uma conta gratuita
3. Crie um novo cronjob:
   - URL: `https://seu-backend.koyeb.app/health`
   - Execution schedule: `Every 5 minutes`
4. Salve

**Vantagens:**
- ✅ Completamente gratuito
- ✅ Sem limites de monitores
- ✅ Intervalo customizável

#### Opção C: Betterstack (antigo Better Uptime)

1. Acesse: https://betterstack.com/uptime
2. Crie uma conta gratuita
3. Configure o monitor com a URL do seu backend

**Vantagens:**
- ✅ Interface moderna
- ✅ 10 monitores gratuitos
- ✅ Alertas avançados

---

### 3. 🔧 Configurações Específicas por Provedor

#### Render.com

No arquivo `render.yaml` (se usar):
```yaml
services:
  - type: web
    name: assets-life-backend
    env: python
    buildCommand: "pip install -r requirements.txt"
    startCommand: "uvicorn app.main:app --host 0.0.0.0 --port $PORT"
    autoDeploy: true
    healthCheckPath: /health
```

#### Fly.io

Já configurado em `backend/fly.toml`:
```toml
[http_service]
  auto_stop_machines = false   # Evita parar máquinas
  min_machines_running = 1     # Mantém pelo menos 1 rodando
```

#### Koyeb

Configurado em `backend/koyeb.toml`. Ping externo é suficiente.

---

## Endpoint de Health Check

**URL:** `GET /health`

**Resposta de sucesso:**
```json
{
  "status": "ok",
  "db": "ok"
}
```

**Resposta de erro:**
```json
{
  "status": "error",
  "db": "error",
  "detail": "ConnectionError"
}
```

Este endpoint verifica:
- ✅ Se o servidor está respondendo
- ✅ Se a conexão com o banco de dados está OK

---

## Estratégia Recomendada (Redundância)

Para máxima confiabilidade, use **múltiplas camadas**:

1. ✅ **UptimeRobot** ou **Cron-job.org** (configurar uma vez - 5 minutos)
2. ✅ **GitHub Actions** (já configurado, basta adicionar o secret - 2 minutos)

Com essas 2 camadas, a chance de hibernação é praticamente ZERO.

**Tempo total de configuração:** ~7 minutos

---

## Verificação

Para verificar se o keep-alive está funcionando:

1. **Teste manual:**
   ```bash
   curl https://seu-backend.koyeb.app/health
   ```

2. **GitHub Actions:**
   - Vá em `Actions` no GitHub
   - Veja os logs do workflow "Keep Server Alive"

3. **UptimeRobot/Cron-job.org:**
   - Acesse o dashboard do serviço
   - Verifique os últimos pings e status

---

## Custos

✅ **Tudo 100% GRATUITO:**
- GitHub Actions: Grátis para repos públicos (2.000 min/mês)
- UptimeRobot/Cron-job.org: Planos gratuitos permanentes

---

## Solução de Problemas

### Cloudflare com Instabilidade

Se o Cloudflare estiver com problemas globais:
- Os serviços de monitoring podem falhar temporariamente
- Aguarde a resolução do problema do Cloudflare
- O servidor continuará funcionando normalmente após o Cloudflare se estabilizar

### Servidor ainda hiberna

Se o servidor ainda está hibernando mesmo com os pings configurados:
1. Verifique se a URL está correta no GitHub Actions e no serviço de monitoring
2. Confirme que o endpoint `/health` responde: `curl https://sua-url/health`
3. Verifique os logs do GitHub Actions para ver se há erros
4. No UptimeRobot, verifique se o monitor está ativo e "up"

### Login demorando mais de 10 segundos

Se o login demora muito:
1. Verifique se o servidor está realmente ativo (acesse `/health`)
2. Pode ser cold start se o servidor estava dormindo
3. Aguarde alguns minutos após configurar os pings
4. Se persistir, verifique os logs do servidor no Koyeb/Render

---

## Suporte

Se tiver problemas:
1. Verifique se o endpoint `/health` responde manualmente
2. Verifique se o `BACKEND_URL` está correto no GitHub
3. Verifique os logs do GitHub Actions
4. Verifique os logs do servidor no provedor de hospedagem

---

**Última atualização:** 2025-11-18
