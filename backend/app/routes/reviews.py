from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import date

from ..dependencies import get_db, get_current_user, get_allowed_company_ids
from ..models import (
    RevisaoPeriodo as RevisaoPeriodoModel,
    Usuario as UsuarioModel
)

router = APIRouter(
    prefix="/revisoes",
    tags=["Revisoes"],
    responses={404: {"description": "Not found"}},
)

class RevisaoPeriodoResponse(BaseModel):
    id: int
    codigo: str
    descricao: str
    empresa_id: int
    empresa_nome: Optional[str] = None
    ug_id: Optional[int] = None
    status: str
    data_abertura: date
    data_fechamento_prevista: date
    
    class Config:
        orm_mode = True

@router.get("/periodos", response_model=List[RevisaoPeriodoResponse])
def listar_periodos(
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    """
    Lista todos os períodos de revisão das empresas que o usuário tem acesso.
    """
    # 1. Obter IDs das empresas permitidas para o usuário
    allowed_companies = get_allowed_company_ids(db, current_user)
    
    if not allowed_companies:
        return []
    
    # 2. Buscar períodos vinculados a essas empresas
    # Ordenado por ID decrescente (mais recentes primeiro)
    from ..models import Company as CompanyModel
    
    results = (
        db.query(RevisaoPeriodoModel, CompanyModel.name.label("empresa_nome"))
        .join(CompanyModel, RevisaoPeriodoModel.empresa_id == CompanyModel.id)
        .filter(RevisaoPeriodoModel.empresa_id.in_(allowed_companies))
        .order_by(RevisaoPeriodoModel.id.desc())
        .all()
    )
    
    # Mapear para o schema de resposta
    response = []
    for periodo, emp_nome in results:
        p_dict = {
            "id": periodo.id,
            "codigo": periodo.codigo,
            "descricao": periodo.descricao,
            "empresa_id": periodo.empresa_id,
            "empresa_nome": emp_nome,
            "ug_id": periodo.ug_id,
            "status": periodo.status,
            "data_abertura": periodo.data_abertura,
            "data_fechamento_prevista": periodo.data_fechamento_prevista
        }
        response.append(RevisaoPeriodoResponse(**p_dict))
            
    return response
