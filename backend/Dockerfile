FROM python:3.12-slim

# Configurações básicas
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

WORKDIR /app

# Instala dependências
RUN pip install --no-cache-dir --upgrade pip
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copia código do backend (contexto: diretório backend)
COPY . /app/

# Porta padrão (pode ser sobrescrita pelo ambiente)
ENV PORT=8000
EXPOSE 8000

# Comando de inicialização (módulo app dentro de /app)
# Usa a porta do ambiente se disponível
CMD sh -c "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"