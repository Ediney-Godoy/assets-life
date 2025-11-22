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

# Copia e torna executável o script de inicialização
COPY backend/start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Verifica se o módulo pode ser importado (falha o build se não conseguir)
RUN python -c "import app.main; print('✓ Module app.main import successful')"

# Porta padrão (pode ser sobrescrita pelo ambiente)
ENV PORT=8000
EXPOSE 8000

# Usa o script de inicialização
CMD ["/app/start.sh"]

