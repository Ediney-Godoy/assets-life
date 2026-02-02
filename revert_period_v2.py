import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Use the correct Supabase URL from .env
DATABASE_URL = "postgresql+psycopg2://postgres.igjnpthqofsfesmssvxi:.2YRXsLjJ%25bM8ss@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require"

def revert_period():
    print(f"Connecting to database...")
    try:
        engine = create_engine(DATABASE_URL)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        # Find Period RV2025-01
        print("Searching for period RV2025-01...")
        query = text("SELECT id, codigo, status FROM revisoes_periodos WHERE codigo = 'RV2025-01'")
        period = db.execute(query).fetchone()
        
        if period:
            print(f"Found Period: {period.codigo} (ID: {period.id}), Status: {period.status}")
            
            # Revert Period
            if period.status in ['Encerrado', 'Concluído', 'Fechado']:
                print(f"Reverting Period {period.id} status to 'Em Andamento'...")
                db.execute(text("UPDATE revisoes_periodos SET status = 'Em Andamento', data_fechamento = NULL WHERE id = :id"), {"id": period.id})
                print("Period reverted.")
            else:
                print("Period status is already open/in-progress.")

            # Find Cronogramas
            print(f"Searching for Cronogramas for period {period.id}...")
            c_query = text("SELECT id, status, descricao FROM cronogramas WHERE periodo_id = :pid")
            cronogramas = db.execute(c_query, {"pid": period.id}).fetchall()
            
            for c in cronogramas:
                print(f"Cronograma ID: {c.id}, Status: {c.status}")
                if c.status in ['Concluído', 'Encerrado', 'Fechado']:
                    print(f"Reverting Cronograma {c.id} status to 'Em Andamento'...")
                    db.execute(text("UPDATE cronogramas SET status = 'Em Andamento' WHERE id = :id"), {"id": c.id})
                    print(f"Cronograma {c.id} reverted.")
                else:
                    print(f"Cronograma {c.id} status is already open/in-progress.")
            
            db.commit()
            print("Changes committed successfully.")
            
        else:
            print("Period RV2025-01 not found.")
            
        db.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    revert_period()
