import sqlalchemy as sa
import sys
from pathlib import Path

# Garantir import do pacote app via sys.path adicionando 'backend' (pai de 'app')
BACKEND_ROOT = Path(__file__).resolve().parents[1]
for p in [BACKEND_ROOT, BACKEND_ROOT.parent]:
    sp = str(p)
    if sp not in sys.path:
        sys.path.insert(0, sp)

from app.database import engine

def main():
    print(f"dialect: {engine.dialect.name}")
    try:
        with engine.connect() as conn:
            client_enc = conn.execute(sa.text("SHOW client_encoding")).scalar()
            server_enc = conn.execute(sa.text("SHOW server_encoding")).scalar()
            print(f"client_encoding: {client_enc}")
            print(f"server_encoding: {server_enc}")
    except Exception as e:
        print("error:", e.__class__.__name__, str(e))

if __name__ == "__main__":
    main()