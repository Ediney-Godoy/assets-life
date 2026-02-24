from sqlalchemy import create_engine, event, text
import os
from sqlalchemy.orm import sessionmaker

from .config import DATABASE_URL

# Engine exclusivo para PostgreSQL (psycopg2)
pg_client_enc = os.getenv("PG_CLIENT_ENCODING", "UTF8")
pg_options = f"-c client_encoding={pg_client_enc}"
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    connect_args={"options": pg_options}
)

# Ajustes de sessão após conectar (encoding e mensagens)
@event.listens_for(engine, "connect")
def _set_session_encoding(dbapi_connection, connection_record):
    try:
        old_autocommit = dbapi_connection.autocommit
        dbapi_connection.autocommit = True

        cur = dbapi_connection.cursor()
        try:
            cur.execute("SET client_encoding TO 'UTF8'")
        except Exception:
            pass
        try:
            cur.execute("SET lc_messages TO 'C'")
        except Exception:
            pass
        cur.close()

        dbapi_connection.autocommit = old_autocommit
    except Exception:
        pass

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)