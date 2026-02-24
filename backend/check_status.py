from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

# Load .env from root directory (parent of backend)
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and "sslmode=require" not in DATABASE_URL:
    DATABASE_URL += "?sslmode=require" if "?" not in DATABASE_URL else "&sslmode=require"

print(f"Connecting to: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else '...'}")

engine = create_engine(DATABASE_URL)

with engine.connect() as connection:
    try:
        # Check period status
        result = connection.execute(text("SELECT id, codigo, status FROM revisoes_periodos WHERE codigo = 'RV2025-01'"))
        row = result.fetchone()
        if row:
            print(f"Periodo: {row.codigo} (ID: {row.id}), Status: {row.status}")
        else:
            print("Periodo RV2025-01 not found.")
            
        # Check cronograma status for this period
        if row:
            cron_result = connection.execute(text("SELECT id, status, descricao FROM cronogramas WHERE periodo_id = :pid"), {"pid": row.id})
            crons = cron_result.fetchall()
            for c in crons:
                print(f"Cronograma ID: {c.id}, Status: {c.status}, Desc: {c.descricao}")
                
    except Exception as e:
        print(f"Error: {e}")
