FROM python:3.12-slim

# Configurações básicas
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

WORKDIR /app

# Instala dependências
RUN pip install --no-cache-dir --upgrade pip
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copia código do backend (contexto: raiz do projeto)
# Isso copia backend/app/ para /app/app/, backend/alembic/ para /app/alembic/, etc.
COPY backend/ /app/

# Verifica se o módulo pode ser importado (falha o build se não conseguir)
RUN python -c "import app.main; print('✓ Module app.main import successful')"

# Porta padrão (pode ser sobrescrita pelo ambiente)
ENV PORT=8000
EXPOSE 8000

# Comando de inicialização (módulo app dentro de /app)
# Garante que estamos no diretório correto e usa a porta do ambiente se disponível
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}

