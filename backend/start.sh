#!/bin/sh
set -e

echo "=== Starting application ==="
echo "Current directory: $(pwd)"
echo "PYTHONPATH: $PYTHONPATH"
echo "PORT: ${PORT:-8000}"

# Garante que estamos no diretório correto
cd /app
echo "Changed to: $(pwd)"

# Lista conteúdo para debug
echo "=== Contents of /app ==="
ls -la /app/ | head -20 || true

echo "=== Contents of /app/app ==="
ls -la /app/app/ | head -20 || true

# Verifica se o módulo pode ser importado
echo "=== Testing module import ==="
python -c "import app.main; print('✓ Module app.main import successful')" || {
    echo "ERROR: Cannot import app.main"
    echo "Python path:"
    python -c "import sys; print('\n'.join(sys.path))"
    exit 1
}

# Inicia o uvicorn
echo "=== Starting uvicorn ==="
echo "Command: uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}

