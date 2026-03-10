from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from ..database import SessionLocal
from ..models import AuditoriaLog as AuditoriaLogModel, Usuario as UsuarioModel
from ..dependencies import get_db, get_current_user

router = APIRouter(
    prefix="/auditoria",
    tags=["Auditoria"],
    responses={404: {"description": "Not found"}},
)

@router.get("/logs")
def list_audit_logs(
    acao: Optional[str] = None,
    entidade: Optional[str] = None,
    usuario_id: Optional[int] = None,
    q: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    current_user: UsuarioModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Listar logs de auditoria do sistema.
    """
    query = db.query(
        AuditoriaLogModel.id,
        AuditoriaLogModel.usuario_id,
        AuditoriaLogModel.acao,
        AuditoriaLogModel.entidade,
        AuditoriaLogModel.entidade_id,
        AuditoriaLogModel.detalhes,
        AuditoriaLogModel.data_evento,
        UsuarioModel.nome_completo.label("usuario_nome")
    ).outerjoin(UsuarioModel, AuditoriaLogModel.usuario_id == UsuarioModel.id)

    if acao:
        query = query.filter(AuditoriaLogModel.acao.ilike(f"%{acao}%"))
    if entidade:
        query = query.filter(AuditoriaLogModel.entidade.ilike(f"%{entidade}%"))
    if usuario_id:
        query = query.filter(AuditoriaLogModel.usuario_id == usuario_id)
    if q:
        # Busca genérica em detalhes, ação ou entidade
        search = f"%{q}%"
        query = query.filter(
            (AuditoriaLogModel.detalhes.ilike(search)) |
            (AuditoriaLogModel.acao.ilike(search)) |
            (AuditoriaLogModel.entidade.ilike(search))
        )

    # Ordenação por data decrescente
    query = query.order_by(desc(AuditoriaLogModel.data_evento))
    
    # Paginação
    total = query.count()
    logs = query.limit(limit).offset(offset).all()

    # Formatar resposta
    result = []
    for log in logs:
        result.append({
            "id": log.id,
            "usuario_id": log.usuario_id,
            "usuario_nome": log.usuario_nome or "Sistema/Desconhecido",
            "acao": log.acao,
            "entidade": log.entidade,
            "entidade_id": log.entidade_id,
            "detalhes": log.detalhes,
            "data_evento": log.data_evento.isoformat() if log.data_evento else None
        })

    return result
