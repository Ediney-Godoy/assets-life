
import sys
import os
from sqlalchemy import text

# Setup path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.database import SessionLocal
from app.models import RevisaoPeriodo as RevisaoPeriodoModel

db = SessionLocal()

try:
    # Get period 1
    period = db.query(RevisaoPeriodoModel).filter(RevisaoPeriodoModel.id == 1).first()
    if period:
        print(f"Current: Code='{period.codigo}', Desc='{period.descricao}'")
        
        # Update to user requirements
        period.codigo = "RV-2025-01"
        period.descricao = "Empresa de Teste 001 Ltda. - Belo Horizonte"
        
        db.commit()
        print(f"Updated: Code='{period.codigo}', Desc='{period.descricao}'")
    else:
        print("Period ID 1 not found.")
        
except Exception as e:
    print(f"Error: {e}")
    db.rollback()
finally:
    db.close()
