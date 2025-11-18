# Prevenção de Hibernação do Servidor 🚀

Este documento descreve as soluções implementadas para evitar que o servidor backend entre em hibernação quando hospedado em planos gratuitos (Render, Koyeb, Fly.io, etc.).

## Problema

Planos gratuitos de hospedagem geralmente colocam o servidor em modo "sleep" após 15-30 minutos de inatividade. Quando o servidor hiberna, a primeira requisição após o período de inatividade demora 1-2 minutos para responder (cold start).

## Soluções Implementadas

### 1. 🔄 Background Worker Interno (Automático)

**Status:** ✅ Ativo por padrão

Um worker interno executa periodicamente para manter o processo do servidor ativo.

**Configuração via variáveis de ambiente:**

```bash
# Habilitar/desabilitar o worker (padrão: habilitado)
KEEP_ALIVE_ENABLED=true

# Intervalo entre pings em segundos (padrão: 300 = 5 minutos)
KEEP_ALIVE_INTERVAL=300
```

**Arquivos relacionados:**
- `backend/app/keep_alive.py` - Implementação do worker
- `backend/app/main.py` - Inicialização automática no startup

**Vantagens:**
- ✅ Não requer configuração externa
- ✅ Funciona automaticamente ao fazer deploy
- ✅ Leve e eficiente (não faz requisições HTTP)

**Desvantagens:**
- ⚠️ Pode não prevenir 100% das hibernações em todos os provedores
- ⚠️ Alguns provedores hibernam por falta de tráfego externo

---

### 2. 🤖 GitHub Actions (Ping Externo)

**Status:** ⏳ Requer configuração manual

Uma GitHub Action executa a cada 5 minutos fazendo ping no endpoint `/health` do backend.

**Arquivo:** `.github/workflows/keep-alive.yml`

**Como configurar:**

1. **Configurar a URL do backend:**
   - Vá em: `Settings > Secrets and variables > Actions`
   - Crie um novo secret: `BACKEND_URL`
   - Valor: URL completa do seu backend (ex: `https://seu-app.onrender.com`)

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

**Desvantagens:**
- ⚠️ Pode ter atraso de 10-15 minutos em horários de pico
- ⚠️ Limitado a execuções a cada 5 minutos (mínimo do cron)

**Limitações do GitHub Actions:**
- Repositórios públicos: 2.000 minutos/mês (grátis)
- Repositórios privados: 2.000 minutos/mês (pode precisar de plano pago)

---

### 3. 🌐 Serviços Externos de Monitoring (Recomendado)

**Status:** 📋 Configuração manual externa

Use serviços gratuitos de monitoramento que fazem ping automático:

#### Opção A: UptimeRobot (Recomendado)

1. Acesse: https://uptimerobot.com
2. Crie uma conta gratuita
3. Adicione um novo monitor:
   - Monitor Type: `HTTP(s)`
   - Friendly Name: `Assets Life Backend`
   - URL: `https://seu-backend.onrender.com/health`
   - Monitoring Interval: `5 minutes`
4. Salve

**Vantagens:**
- ✅ 50 monitores gratuitos
- ✅ Intervalo de 5 minutos
- ✅ Alertas por email/SMS/Slack
- ✅ Status page pública opcional
- ✅ Muito confiável

#### Opção B: Cron-job.org

1. Acesse: https://cron-job.org
2. Crie uma conta gratuita
3. Crie um novo cronjob:
   - URL: `https://seu-backend.onrender.com/health`
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

### 4. 🔧 Configurações Específicas por Provedor

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

Configurado em `backend/koyeb.toml`. O worker interno + ping externo são suficientes.

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

1. ✅ **Worker interno** (já ativo automaticamente)
2. ✅ **UptimeRobot** ou **Cron-job.org** (configurar uma vez)
3. ✅ **GitHub Actions** (já configurado, basta adicionar o secret)

Com essas 3 camadas, a chance de hibernação é praticamente ZERO.

---

## Verificação

Para verificar se o keep-alive está funcionando:

1. **Logs do servidor:**
   ```
   Keep-alive worker habilitado (intervalo: 300s)
   Keep-alive ping executado em 2025-11-18T12:00:00
   ```

2. **Teste manual:**
   ```bash
   curl https://seu-backend.onrender.com/health
   ```

3. **GitHub Actions:**
   - Vá em `Actions` no GitHub
   - Veja os logs do workflow "Keep Server Alive"

---

## Desabilitar Keep-Alive (se necessário)

Se você migrar para um plano pago que não hiberna:

```bash
# Desabilitar o worker interno
KEEP_ALIVE_ENABLED=false
```

E pausar/desabilitar os monitores externos.

---

## Custos

✅ **Tudo 100% GRATUITO:**
- Worker interno: Sem custo
- GitHub Actions: Grátis para repos públicos
- UptimeRobot/Cron-job.org: Planos gratuitos

---

## Suporte

Se tiver problemas:
1. Verifique os logs do servidor
2. Teste o endpoint `/health` manualmente
3. Verifique se o `BACKEND_URL` está correto no GitHub
4. Verifique os logs do GitHub Actions

---

**Última atualização:** 2025-11-18
