from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime, timedelta
import shutil
import os
import pandas as pd
import numpy as np
from pydantic import BaseModel
import traceback
import json

from ..database import SessionLocal
from ..models import (
    Usuario as UsuarioModel,
    RevisaoPeriodo as RevisaoPeriodoModel,
    RevisaoItem as RevisaoItemModel,
    RevisaoDelegacao as RevisaoDelegacaoModel,
    Cronograma as CronogramaModel,
    CronogramaTarefa as CronogramaTarefaModel
)
from ..dependencies import get_db, get_current_user, get_allowed_company_ids

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
    responsavel_id: int
    status: str
    data_abertura: date
    data_fechamento_prevista: date
    
    class Config:
        from_attributes = True

@router.get("/periodos", response_model=List[RevisaoPeriodoResponse])
def listar_periodos(
    x_company_id: Optional[str] = Header(None, alias="X-Company-Id"),
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    """
    Lista todos os períodos de revisão das empresas que o usuário tem acesso.
    Se X-Company-Id for informado, filtra apenas por esta empresa.
    """
    # 1. Obter IDs das empresas permitidas para o usuário
    allowed_companies = get_allowed_company_ids(db, current_user)
    
    if not allowed_companies:
        return []

    # Validar header de empresa se presente
    header_company_id = None
    if x_company_id:
        try:
            header_company_id = int(x_company_id)
            if header_company_id not in allowed_companies:
                 # Se tentar acessar empresa não permitida, retorna 403 ou lista vazia?
                 # Melhor 403 para indicar erro de permissão/contexto
                 raise HTTPException(status_code=403, detail="Acesso negado à empresa selecionada")
        except ValueError:
            pass # Ignorar header inválido
    
    # 2. Buscar períodos vinculados a essas empresas
    # Ordenado por ID decrescente (mais recentes primeiro)
    from ..models import Company as CompanyModel
    
    query = (
        db.query(RevisaoPeriodoModel, CompanyModel.name.label("empresa_nome"))
        .join(CompanyModel, RevisaoPeriodoModel.empresa_id == CompanyModel.id)
    )

    if header_company_id:
        query = query.filter(RevisaoPeriodoModel.empresa_id == header_company_id)
    else:
        query = query.filter(RevisaoPeriodoModel.empresa_id.in_(allowed_companies))
        
    results = query.order_by(RevisaoPeriodoModel.id.desc()).all()
    
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
            "responsavel_id": periodo.responsavel_id,
            "status": periodo.status,
            "data_abertura": periodo.data_abertura,
            "data_fechamento_prevista": periodo.data_fechamento_prevista
        }
        response.append(RevisaoPeriodoResponse(**p_dict))
            
    return response

class RevisaoPeriodoUpdate(BaseModel):
    status: Optional[str] = None
    descricao: Optional[str] = None
    observacoes: Optional[str] = None

@router.put("/periodos/{periodo_id}", response_model=RevisaoPeriodoResponse)
def update_periodo(
    periodo_id: int,
    payload: RevisaoPeriodoUpdate,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    """
    Atualiza um período de revisão.
    """
    # 1. Buscar o período
    periodo = db.query(RevisaoPeriodoModel).filter(RevisaoPeriodoModel.id == periodo_id).first()
    if not periodo:
        raise HTTPException(status_code=404, detail="Período não encontrado")
    
    # 2. Verificar permissão (pertence a empresa permitida)
    allowed_companies = get_allowed_company_ids(db, current_user)
    if periodo.empresa_id not in allowed_companies:
        raise HTTPException(status_code=403, detail="Acesso negado")
        
    # 3. Aplicar atualizações
    if payload.descricao is not None:
        periodo.descricao = payload.descricao
        
    if payload.observacoes is not None:
        periodo.observacoes = payload.observacoes
        
    if payload.status is not None:
        if payload.status == 'Fechado':
            # Validação 1: Verificar se há ativos a delegar
            # (Considerando que ativos sem delegação são "a delegar")
            # Mas a regra diz "existir ativos a delegar". Normalmente isso significa itens no período que não foram delegados a ninguém.
            # Porém, a estrutura atual não parece ter um status explícito de "não delegado" no item, mas sim a ausência de registro na tabela de delegações.
            
            # Count items in period
            import sqlalchemy as sa
            
            total_items = db.query(sa.func.count(RevisaoItemModel.id)).filter(RevisaoItemModel.periodo_id == periodo_id).scalar()
            
            delegated_items = db.query(sa.func.count(sa.distinct(RevisaoDelegacaoModel.ativo_id))).filter(
                RevisaoDelegacaoModel.periodo_id == periodo_id,
                RevisaoDelegacaoModel.status == 'Ativo'
            ).scalar()
            
            if delegated_items < total_items:
                 raise HTTPException(status_code=400, detail="Não é possível fechar o período: Existem ativos pendentes de delegação.")

            # Validação 2: Verificar se todos os ativos estão revisados
            # Critério de revisado: status in ('Revisado', 'Aprovado') OU alterado=True
            # Buscar itens que NÃO atendem ao critério
            pending_reviews = db.query(sa.func.count(RevisaoItemModel.id)).filter(
                RevisaoItemModel.periodo_id == periodo_id,
                sa.not_(
                    sa.or_(
                        RevisaoItemModel.status.in_(['Revisado', 'Aprovado']),
                        RevisaoItemModel.alterado == True
                    )
                )
            ).scalar()
            
            if pending_reviews > 0:
                raise HTTPException(status_code=400, detail=f"Não é possível fechar o período: Existem {pending_reviews} ativos não revisados.")

        periodo.status = payload.status
        if payload.status == 'Fechado':
            periodo.data_fechamento = date.today()
            
    db.commit()
    db.refresh(periodo)
    
    # Montar resposta (similar ao list)
    from ..models import Company as CompanyModel
    emp_nome = db.query(CompanyModel.name).filter(CompanyModel.id == periodo.empresa_id).scalar()
    
    p_dict = {
        "id": periodo.id,
        "codigo": periodo.codigo,
        "descricao": periodo.descricao,
        "empresa_id": periodo.empresa_id,
        "empresa_nome": emp_nome,
        "ug_id": periodo.ug_id,
        "responsavel_id": periodo.responsavel_id,
        "status": periodo.status,
        "data_abertura": periodo.data_abertura,
        "data_fechamento_prevista": periodo.data_fechamento_prevista
    }
    return RevisaoPeriodoResponse(**p_dict)
