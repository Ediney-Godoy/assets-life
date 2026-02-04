
import sys
import os
from pathlib import Path
import sqlalchemy as sa

# Add backend directory to sys.path
backend_path = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_path))

try:
    from app.database import engine
except ImportError:
    # Try adding parent of backend to path if running from root
    sys.path.append(str(backend_path.parent))
    from backend.app.database import engine

def revert_latest():
    print("Reverting latest closed items for testing...")
    
    with engine.connect() as conn:
        # Revert Cronograma
        # Find latest closed cronograma
        sql_find_c = sa.text("SELECT id FROM cronogramas WHERE status = 'Concluído' ORDER BY id DESC LIMIT 1")
        cid = conn.execute(sql_find_c).scalar()
        
        if cid:
            print(f"Reopening Cronograma ID {cid}...")
            conn.execute(sa.text("UPDATE cronogramas SET status = 'Em Andamento' WHERE id = :id"), {"id": cid})
            print("Cronograma reopened.")
        else:
            print("No closed Cronograma found.")

        # Revert Review Period
        # Find latest closed period
        sql_find_p = sa.text("SELECT id FROM revisoes_periodos WHERE status = 'Fechado' ORDER BY id DESC LIMIT 1")
        pid = conn.execute(sql_find_p).scalar()
        
        if pid:
            print(f"Reopening Review Period ID {pid}...")
            conn.execute(sa.text("UPDATE revisoes_periodos SET status = 'Em Andamento', data_fechamento = NULL WHERE id = :id"), {"id": pid})
            print("Review Period reopened.")
        else:
            print("No closed Review Period found.")
            
        conn.commit()

if __name__ == "__main__":
    revert_latest()
