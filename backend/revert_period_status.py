import os
from sqlalchemy import create_engine, text

# Use the correct Supabase URL from .env
DATABASE_URL = "postgresql+psycopg2://postgres.igjnpthqofsfesmssvxi:.2YRXsLjJ%25bM8ss@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require"

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as connection:
        # Check Revisao Periodo
        result = connection.execute(text("SELECT id, codigo, status FROM revisoes_periodos WHERE codigo = 'RV2025-01'"))
        row = result.fetchone()
        
        if row:
            print(f"Periodo: {row.codigo} (ID: {row.id}), Status: {row.status}")
            
            # Revert Periodo if needed
            if row.status in ['Encerrado', 'Concluído', 'Fechado']:
                print("Reverting period status to 'Em Andamento'...")
                connection.execute(text("UPDATE revisoes_periodos SET status = 'Em Andamento' WHERE id = :id"), {"id": row.id})
                connection.commit()
                print("Period status updated successfully.")
            else:
                print("Period status is already suitable (not closed).")

            # Check and Revert Cronogramas
            cron_result = connection.execute(text("SELECT id, status, descricao FROM cronogramas WHERE periodo_id = :pid"), {"pid": row.id})
            crons = cron_result.fetchall()
            
            for c in crons:
                print(f"Cronograma ID: {c.id}, Status: {c.status}, Desc: {c.descricao}")
                if c.status in ['Concluído', 'Encerrado', 'Fechado']:
                    print(f"Reverting Cronograma {c.id} to 'Em Andamento'...")
                    connection.execute(text("UPDATE cronogramas SET status = 'Em Andamento' WHERE id = :id"), {"id": c.id})
                    connection.commit()
                    print(f"Cronograma {c.id} reverted.")
        else:
            print("Periodo RV2025-01 not found.")
            
except Exception as e:
    print(f"Error: {e}")
