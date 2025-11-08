FROM python:3.12-slim

# Configurações básicas
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Instala dependências
RUN pip install --no-cache-dir --upgrade pip
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copia código do backend (contexto: diretório backend)
COPY . /app/

# Porta padrão
ENV PORT=8000
EXPOSE 8000

# Comando de inicialização (módulo app dentro de /app)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]