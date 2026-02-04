# Assets Life - Sistema de Gestão de Ativos e Revisão de Vidas Úteis

Assets Life é uma solução completa para gerenciamento de ativos fixos, controle de patrimônio e processos de revisão de vidas úteis (RVU), projetada para atender normas contábeis e necessidades gerenciais.

## 🚀 Atualizações Recentes (v2.1 - Fevereiro 2026)

### Melhorias de Interface e Estabilidade
- **Sidebar Estável**: Implementação do `SidebarProvider` para gerenciar o estado do menu lateral, eliminando reinicializações indesejadas da tela ao colapsar/expandir o menu.
- **Cronograma Visual**: Linhas do tipo "Título" agora possuem destaque visual com alto contraste (fundo cinza, bordas reforçadas) para melhor organização das fases do projeto.

### Regras de Negócio e Validações
- **Encerramento de Cronograma**:
  - Bloqueio de encerramento se houver tarefas pendentes (diferentes de "Concluída").
  - Bloqueio de encerramento caso não exista nenhuma evidência anexada ao cronograma.
- **Encerramento de Período de Revisão**:
  - Bloqueio se existirem ativos pendentes de delegação.
  - Bloqueio se existirem ativos que ainda não foram revisados ou aprovados.

### Gestão Administrativa
- **Visibilidade de Empresas**: Administradores com acesso ao menu de Permissões agora visualizam todas as empresas cadastradas no sistema para configuração de acessos, independentemente de estarem vinculadas ao seu próprio grupo.

---

## 🛠️ Instalação e Configuração

### Pré-requisitos
- Node.js 18+
- Python 3.10+
- PostgreSQL

### Backend (FastAPI)
1. Navegue até a pasta `backend`:
   ```bash
   cd backend
   ```
2. Crie um ambiente virtual e instale as dependências:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Configure as variáveis de ambiente no arquivo `.env`.
4. Execute as migrações do banco de dados:
   ```bash
   alembic upgrade head
   ```
5. Inicie o servidor:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend (React + Vite)
1. Navegue até a pasta `front-end`:
   ```bash
   cd front-end
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

---

## 📦 Funcionalidades Principais

### Gestão de Ativos
- Cadastro completo de ativos com especificações técnicas e contábeis.
- Classificação por Espécies, Centros de Custo e Unidades Gerenciais.

### Processo de Revisão (RVU)
- **Cronogramas**: Planejamento detalhado das etapas de revisão (Kick-off, Vistorias, Laudos).
- **Delegação**: Atribuição de ativos a revisores específicos.
- **Revisão em Massa**: Interface otimizada para atualização rápida de múltiplos ativos.
- **Vidas Úteis**: Ajuste de vida útil remanescente e novas taxas de depreciação.

### Relatórios e Dashboards
- Relatórios detalhados de depreciação e projeções.
- Dashboards gerenciais para acompanhamento do progresso das revisões.

### Segurança e Acesso
- Controle de acesso baseado em grupos e permissões (RBAC).
- Auditoria de ações críticas.

---

## 🔧 Stack Tecnológica

- **Frontend**: React, Tailwind CSS, Lucide Icons, Vite.
- **Backend**: FastAPI, SQLAlchemy, Pydantic.
- **Banco de Dados**: PostgreSQL.
- **Deploy**: Suporte a containers Docker (Dockerfile incluso).
