
import sys
import os
from sqlalchemy import func

# Setup path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.database import SessionLocal
from app.models import RevisaoPeriodo as RevisaoPeriodoModel, RevisaoItem as RevisaoItemModel, Company as CompanyModel, Usuario as UsuarioModel

db = SessionLocal()

print("--- Inspecting Periods ---")
periods = db.query(RevisaoPeriodoModel).all()
for p in periods:
    item_count = db.query(func.count(RevisaoItemModel.id)).filter(RevisaoItemModel.periodo_id == p.id).scalar()
    company = db.query(CompanyModel).filter(CompanyModel.id == p.empresa_id).first()
    company_name = company.name if company else "Unknown"
    company_city = company.city if company else "Unknown"
    
    print(f"ID: {p.id} | Code: {p.codigo} | Desc: {p.descricao} | Company: {company_name} ({company_city}) | Items: {item_count}")

print("\n--- Inspecting Users ---")
users = db.query(UsuarioModel).all()
for u in users:
    print(f"ID: {u.id} | Name: {u.nome_completo} | CompanyID: {u.empresa_id} | UG_ID: {u.ug_id}")

