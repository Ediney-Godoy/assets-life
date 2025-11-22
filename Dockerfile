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

# Verifica estrutura e se o módulo pode ser importado
RUN echo "=== Verificando estrutura ===" && \
    ls -la /app/ | head -10 && \
    echo "=== Conteúdo de /app/app ===" && \
    ls -la /app/app/ | head -10 && \
    echo "=== Testando importação app.main ===" && \
    python -c "import app.main; print('✓ Module app.main import successful')" && \
    echo "=== Testando importação main (wrapper) ===" && \
    python -c "import main; print('✓ Module main (wrapper) import successful')" && \
    echo "=== Verificação completa ==="

# Porta padrão (pode ser sobrescrita pelo ambiente)
ENV PORT=8000
EXPOSE 8000

# Comando de inicialização - usa main.py wrapper que importa app.main
# Isso resolve o problema do uvicorn tentar importar "main" diretamente
CMD ["sh", "-c", "cd /app && python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]

