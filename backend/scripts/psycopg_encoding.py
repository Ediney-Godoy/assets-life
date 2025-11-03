import os
from urllib.parse import urlparse
import psycopg2

from app.config import DATABASE_URL

def main():
    print("url:", DATABASE_URL)
    dsn = DATABASE_URL.replace("postgresql+psycopg2", "postgresql")
    # Try passing options to set client_encoding early in connection
    # Try also forcing ASCII messages to avoid decode issues on handshake
    opts = f"-c lc_messages=C -c client_encoding={os.getenv('PG_CLIENT_ENCODING', 'UTF8')}"
    conn = psycopg2.connect(dsn, options=opts, client_encoding=os.getenv('PG_CLIENT_ENCODING', 'UTF8'))
    try:
        cur = conn.cursor()
        cur.execute("SHOW client_encoding")
        print("client_encoding(before):", cur.fetchone()[0])
        enc = os.getenv("PG_CLIENT_ENCODING", "UTF8")
        conn.set_client_encoding(enc)
        cur = conn.cursor()
        cur.execute("SHOW client_encoding")
        print("client_encoding(after):", cur.fetchone()[0])
        cur.execute("SHOW server_encoding")
        print("server_encoding:", cur.fetchone()[0])
    finally:
        conn.close()

if __name__ == "__main__":
    main()