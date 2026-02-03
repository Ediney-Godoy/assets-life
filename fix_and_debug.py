
import sys
import os
from sqlalchemy import func

# Setup path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.database import SessionLocal
from app.models import (
    RevisaoPeriodo as RevisaoPeriodoModel, 
    RevisaoItem as RevisaoItemModel, 
    Company as CompanyModel, 
    Usuario as UsuarioModel,
    GrupoUsuario as GrupoUsuarioModel,
    GrupoEmpresa as GrupoEmpresaModel
)

db = SessionLocal()

print("--- Fixing Periods ---")
# ... (skip delete/rename if already done)
# But I'll keep the visibility check code and expand it.

# Check User 'Julio' (ID 9) Permissions
print("\n--- Debugging User Permissions for ID 9 ---")
u9 = db.query(UsuarioModel).filter(UsuarioModel.id == 9).first()
if u9:
    print(f"User: {u9.nome_completo} (ID: {u9.id})")
    print(f"Direct CompanyID: {u9.empresa_id}")
    
    # Check Groups
    user_groups = db.query(GrupoUsuarioModel).filter(GrupoUsuarioModel.usuario_id == u9.id).all()
    group_ids = [g.grupo_id for g in user_groups]
    print(f"Linked Group IDs: {group_ids}")
    
    # Check Companies in those Groups
    if group_ids:
        group_companies = db.query(GrupoEmpresaModel).filter(GrupoEmpresaModel.grupo_id.in_(group_ids)).all()
        allowed_companies = sorted({gc.empresa_id for gc in group_companies})
        print(f"Allowed Companies via Groups: {allowed_companies}")
        
        if 1 not in allowed_companies:
            print("WARNING: Company 1 is NOT in allowed companies via groups!")
            if u9.empresa_id == 1:
                print("   User has Direct Company 1, but Groups override it (or don't include it).")
                print("   The logic in get_allowed_company_ids uses Groups IF present, and only falls back if NO companies are found via groups.")
                if len(allowed_companies) > 0:
                     print("   Since allowed_companies is NOT empty, Direct Company is IGNORED.")
    else:
        print("No groups linked. Using Direct Company.")
        allowed_companies = [u9.empresa_id] if u9.empresa_id else []
        print(f"Allowed Companies: {allowed_companies}")

    # 5. Simulate Dashboard Query
    print("\n--- Simulating Dashboard Query for User 9, Period 1 ---")
    q = db.query(
        RevisaoItemModel,
        RevisaoPeriodoModel.status.label('periodo_status'),
        UsuarioModel.nome_completo.label('revisor_nome')
    ).join(
        RevisaoPeriodoModel, RevisaoItemModel.periodo_id == RevisaoPeriodoModel.id
    ).outerjoin(
        UsuarioModel, RevisaoItemModel.criado_por == UsuarioModel.id
    )

    # Apply filters as per backend
    q = q.filter(RevisaoPeriodoModel.empresa_id.in_(allowed_companies))
    q = q.filter(RevisaoItemModel.periodo_id == 1)

    results = q.all()
    print(f"Query returned {len(results)} items.")



