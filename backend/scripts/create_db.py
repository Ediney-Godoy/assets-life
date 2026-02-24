import os
import sys
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "assetlife")

def main():
    try:
        import psycopg2
    except ImportError:
        print("psycopg2 not installed. Please install it in your venv.")
        sys.exit(1)

    dsn_server = f"dbname=postgres user={DB_USER} password={DB_PASSWORD} host={DB_HOST} port={DB_PORT}"
    try:
        conn = psycopg2.connect(dsn_server)
        conn.autocommit = True
    except Exception as e:
        print(f"Failed to connect to server: {e}")
        sys.exit(1)

    cur = conn.cursor()
    try:
        cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (DB_NAME,))
        exists = cur.fetchone() is not None
        if exists:
            print(f"Database '{DB_NAME}' already exists.")
        else:
            cur.execute(f"CREATE DATABASE {DB_NAME} ENCODING 'UTF8'")
            print(f"Database '{DB_NAME}' created.")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    main()