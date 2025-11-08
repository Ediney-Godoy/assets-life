FROM python:3.12-slim

# Configurações básicas
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Instala dependências
RUN pip install --no-cache-dir --upgrade pip
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copia código do backend
COPY backend/ /app/backend/

# Porta padrão
ENV PORT=8000
EXPOSE 8000

# Comando de inicialização
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]