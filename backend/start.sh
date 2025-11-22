#!/bin/sh
set -e

# Garante que estamos no diretório correto
cd /app

# Verifica se o módulo pode ser importado
python -c "import app.main" || {
    echo "ERROR: Cannot import app.main"
    echo "Current directory: $(pwd)"
    echo "Contents of /app:"
    ls -la /app/ || true
    echo "Contents of /app/app:"
    ls -la /app/app/ || true
    exit 1
}

# Inicia o uvicorn
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}

