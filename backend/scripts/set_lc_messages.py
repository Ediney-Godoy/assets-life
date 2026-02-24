import os
import sys
import traceback

import psycopg2


def main():
    dsn = os.getenv("DATABASE_URL")
    if not dsn:
        try:
            # Tenta obter do app.config
            from app.config import DATABASE_URL
            dsn = DATABASE_URL
            print("Usando DATABASE_URL de app.config")
        except Exception:
            print("DATABASE_URL não definido e falha ao importar app.config.")
            sys.exit(1)

    # Normaliza DSN para psycopg2 (troca postgresql+psycopg2 por postgresql)
    if dsn.startswith("postgresql+psycopg2://"):
        dsn = "postgresql://" + dsn.split("postgresql+psycopg2://", 1)[1]

    # Tentar forçar mensagens ASCII durante o handshake
    conn = None
    try:
        conn = psycopg2.connect(dsn, options="-c lc_messages=C")
        cur = conn.cursor()
        cur.execute("SHOW lc_messages;")
        before = cur.fetchone()[0]
        print(f"lc_messages antes: {before}")

        # Requer superusuário
        cur.execute("ALTER SYSTEM SET lc_messages TO 'C';")
        print("ALTER SYSTEM lc_messages=C aplicado.")

        # Reload config (alguns parâmetros exigem restart)
        cur.execute("SELECT pg_reload_conf();")
        reloaded = cur.fetchone()[0]
        print(f"pg_reload_conf(): {reloaded}")

        cur.execute("SHOW lc_messages;")
        after = cur.fetchone()[0]
        print(f"lc_messages depois: {after}")

        cur.close()
        conn.close()
    except Exception as e:
        print("Falha ao ajustar lc_messages:", e)
        traceback.print_exc()
        if conn:
            try:
                conn.close()
            except Exception:
                pass
        sys.exit(2)


if __name__ == "__main__":
    main()