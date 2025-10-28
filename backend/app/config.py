import os
from dotenv import load_dotenv

load_dotenv()

# Allow explicit DATABASE_URL override via environment
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DB_NAME = os.getenv("DB_NAME", "assetlife")
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")

    # If Postgres credentials are provided or USE_POSTGRES=1, use Postgres
    # Otherwise, fall back to local SQLite for development to avoid connection issues
    if DB_PASSWORD or os.getenv("USE_POSTGRES") == "1":
        DATABASE_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    else:
        DATABASE_URL = os.getenv("SQLITE_URL", "sqlite:///./assetlife.db")