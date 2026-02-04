
import sys
import os
from pathlib import Path

# Add backend directory to sys.path
backend_path = Path(__file__).resolve().parent
sys.path.append(str(backend_path))

import sqlalchemy as sa
# Import database module (assuming app package is inside backend)
try:
    from app.database import engine
except ImportError:
    # Try adding parent of backend to path
    sys.path.append(str(backend_path.parent))
    from backend.app.database import engine

def inspect_columns():
    print("Starting inspection...")
    try:
        inspector = sa.inspect(engine)
        columns = inspector.get_columns('cronogramas_tarefas')
        print(f"Columns in cronogramas_tarefas ({len(columns)}):")
        found_tipo = False
        for c in columns:
            print(f"- {c['name']} ({c['type']})")
            if c['name'] == 'tipo':
                found_tipo = True
        
        if found_tipo:
            print("\nColumn 'tipo' FOUND.")
        else:
            print("\nColumn 'tipo' NOT FOUND.")
    except Exception as e:
        print(f"Error inspecting DB: {e}")

if __name__ == "__main__":
    inspect_columns()
