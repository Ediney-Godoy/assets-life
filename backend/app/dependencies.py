from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from .database import SessionLocal
from .models import (
    Usuario as UsuarioModel, 
    Company as CompanyModel,
    GrupoUsuario as GrupoUsuarioModel, 
    GrupoEmpresa as GrupoEmpresaModel, 
    GrupoPermissao as GrupoPermissaoModel,
    Transacao as TransacaoModel, 
    GrupoTransacao as GrupoTransacaoModel
)
from .config import SECRET_KEY, ALGORITHM

security = HTTPBearer()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Token inválido")
    user = db.query(UsuarioModel).filter(UsuarioModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    return user

def is_admin_user(db: Session, current_user: UsuarioModel) -> bool:
    q = (
        db.query(GrupoPermissaoModel.nome)
        .join(GrupoUsuarioModel, GrupoUsuarioModel.grupo_id == GrupoPermissaoModel.id)
        .filter(GrupoUsuarioModel.usuario_id == current_user.id)
    )
    for (nome,) in q.all():
        if nome and "admin" in str(nome).lower():
            return True
    return False

def get_allowed_company_ids(db: Session, current_user: UsuarioModel) -> list[int]:
    if is_admin_user(db, current_user):
        return [row[0] for row in db.query(CompanyModel.id).order_by(CompanyModel.id).all()]

    # grupos do usuário
    links = db.query(GrupoUsuarioModel).filter(GrupoUsuarioModel.usuario_id == current_user.id).all()
    grupo_ids = [l.grupo_id for l in links]
    # empresas vinculadas aos grupos
    emp_links = db.query(GrupoEmpresaModel).filter(GrupoEmpresaModel.grupo_id.in_(grupo_ids)).all()
    empresas_ids = {e.empresa_id for e in emp_links}
    
    # Merge com a empresa direta do usuário, se houver
    if current_user.empresa_id is not None:
        empresas_ids.add(current_user.empresa_id)
        
    return sorted(empresas_ids)

def check_permission(db: Session, user: UsuarioModel, route: str):
    # Check if transaction exists
    transacao = db.query(TransacaoModel).filter(TransacaoModel.rota == route).first()
    if not transacao:
        # If the transaction is not defined in the system, we might want to block by default
        # or allow if it's not meant to be protected. 
        # But for "edit" restriction, we expect it to exist.
        raise HTTPException(status_code=403, detail="Permissão não configurada")
    
    # Get user groups
    user_groups = db.query(GrupoUsuarioModel.grupo_id).filter(GrupoUsuarioModel.usuario_id == user.id).all()
    group_ids = [ug.grupo_id for ug in user_groups]
    
    if not group_ids:
        raise HTTPException(status_code=403, detail="Acesso negado (sem grupo)")
        
    # Check link
    has_perm = db.query(GrupoTransacaoModel).filter(
        GrupoTransacaoModel.grupo_id.in_(group_ids),
        GrupoTransacaoModel.transacao_id == transacao.id
    ).first()
    
    if not has_perm:
        raise HTTPException(status_code=403, detail="Acesso negado")
    return True
