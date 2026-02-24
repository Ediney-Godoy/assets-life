import os
from pathlib import Path
from dotenv import load_dotenv

# Carregamento robusto de .env
# - Tenta carregar do root do projeto e do diretório backend
# - Não sobrescreve variáveis já presentes no ambiente
def _load_envs():
    try:
        root_env = Path(__file__).resolve().parents[2] / ".env"
        backend_env = Path(__file__).resolve().parents[1] / ".env"
        if root_env.exists():
            load_dotenv(dotenv_path=root_env, override=False)
        if backend_env.exists():
            load_dotenv(dotenv_path=backend_env, override=False)
        # Carrega variáveis do ambiente atual sem sobrescrever
        load_dotenv(override=False)
    except Exception:
        # Em caso de qualquer problema, segue sem travar
        pass

_load_envs()

# Banco de dados: somente PostgreSQL
# 1) Se DATABASE_URL estiver definido, usa diretamente.
# 2) Caso contrário, monta a URL a partir das variáveis DB_*.

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DB_NAME = os.getenv("DB_NAME", "assetlife")
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    DATABASE_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Controle de DDL (CREATE/ALTER). Em ambientes sem privilégio de escrita de schema,
# mantenha como False para evitar falhas durante startup/rotas.
ALLOW_DDL = os.getenv("ALLOW_DDL", "false").strip().lower() in {"1", "true", "yes", "on"}

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").strip().lower() in {"1", "true", "yes", "on"}
SMTP_USE_SSL = os.getenv("SMTP_USE_SSL", "false").strip().lower() in {"1", "true", "yes", "on"}
MAIL_FROM = os.getenv("MAIL_FROM", "no-reply@assetlife.local")
MAIL_SENDER_NAME = os.getenv("MAIL_SENDER_NAME", "Asset Life")

# Auth
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-prod")
ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 60 * 8  # 8 horas
RESET_TOKEN_EXPIRE_MINUTES = 30  # 30 minutos
