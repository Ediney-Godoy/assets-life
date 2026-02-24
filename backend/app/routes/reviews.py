from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Header
from sqlalchemy.orm import Session
from typing import List, Optional, Any
from datetime import date, datetime, timedelta
import shutil
import os
import pandas as pd
import numpy as np
from pydantic import BaseModel
import traceback
import json
import sqlalchemy as sa

from ..database import SessionLocal
from ..models import (
    Usuario as UsuarioModel,
    RevisaoPeriodo as RevisaoPeriodoModel,
    RevisaoItem as RevisaoItemModel,
    RevisaoDelegacao as RevisaoDelegacaoModel,
    Cronograma as CronogramaModel,
    CronogramaTarefa as CronogramaTarefaModel,
    Company as CompanyModel,
    Asset as AssetModel
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
            total_items = db.query(sa.func.count(RevisaoItemModel.id)).filter(RevisaoItemModel.periodo_id == periodo_id).scalar()
            
            delegated_items = db.query(sa.func.count(sa.distinct(RevisaoDelegacaoModel.ativo_id))).filter(
                RevisaoDelegacaoModel.periodo_id == periodo_id,
                RevisaoDelegacaoModel.status == 'Ativo'
            ).scalar()
            
            if delegated_items < total_items:
                 raise HTTPException(status_code=400, detail="Não é possível fechar o período: Existem ativos pendentes de delegação.")

            # Validação 2: Verificar se todos os ativos estão revisados
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

            # Validação 3: Verificar se há revisões pendentes de aprovação (Status 'Revisado')
            unapproved_reviews = db.query(sa.func.count(RevisaoItemModel.id)).filter(
                RevisaoItemModel.periodo_id == periodo_id,
                RevisaoItemModel.status == 'Revisado'
            ).scalar()

            if unapproved_reviews > 0:
                raise HTTPException(status_code=400, detail=f"Não é possível fechar o período: Existem {unapproved_reviews} revisões aguardando aprovação.")

        periodo.status = payload.status
        if payload.status == 'Fechado':
            periodo.data_fechamento = date.today()
            
    db.commit()
    db.refresh(periodo)
    
    # Montar resposta (similar ao list)
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

# --- ROTAS FALTANTES ADICIONADAS ---

class RevisaoItemResponse(BaseModel):
    id: int
    periodo_id: int
    ativo_id: int
    # Campos do ativo para exibição
    ativo_codigo: Optional[str] = None
    ativo_descricao: Optional[str] = None
    ativo_plaqueta: Optional[str] = None
    ug_codigo: Optional[str] = None
    
    vida_util_atual_anos: Optional[float] = None
    vida_util_atual_meses: Optional[float] = None
    vida_util_nova_anos: Optional[float] = None
    vida_util_nova_meses: Optional[float] = None
    data_limite_atual: Optional[date] = None
    data_limite_nova: Optional[date] = None
    status: str
    justificativa: Optional[str] = None
    condicao_fisica: Optional[str] = None
    motivo: Optional[str] = None
    observacoes: Optional[str] = None
    revisor_id: Optional[int] = None
    alterado: Optional[bool] = False
    
    class Config:
        from_attributes = True

@router.get("/itens/{periodo_id}", response_model=List[RevisaoItemResponse])
def listar_itens_revisao(
    periodo_id: int,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    """
    Lista itens de um período de revisão.
    Filtra por delegações se o usuário não for responsável/admin.
    """
    periodo = db.query(RevisaoPeriodoModel).filter(RevisaoPeriodoModel.id == periodo_id).first()
    if not periodo:
        raise HTTPException(status_code=404, detail="Período não encontrado")
        
    allowed_companies = get_allowed_company_ids(db, current_user)
    if periodo.empresa_id not in allowed_companies:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Verifica se usuário é responsável ou superuser
    is_responsible = (periodo.responsavel_id == current_user.id) or current_user.is_superuser
    
    # Query base com join para pegar dados do ativo
    query = (
        db.query(
            RevisaoItemModel,
            AssetModel.codigo.label("ativo_codigo"),
            AssetModel.descricao.label("ativo_descricao"),
            AssetModel.plaqueta.label("ativo_plaqueta")
        )
        .join(AssetModel, RevisaoItemModel.ativo_id == AssetModel.id)
        .filter(RevisaoItemModel.periodo_id == periodo_id)
    )
    
    # Filtro de delegação
    if not is_responsible:
        # 1. Buscar delegações ativas
        delegations = db.query(RevisaoDelegacaoModel.ativo_id).filter(
            RevisaoDelegacaoModel.periodo_id == periodo_id,
            RevisaoDelegacaoModel.usuario_id == current_user.id,
            RevisaoDelegacaoModel.status == 'Ativo'
        ).all()
        delegated_ids = [d[0] for d in delegations]
        
        # 2. Buscar itens revertidos pelo usuário (mesmo sem delegação ativa)
        # Isso garante que itens devolvidos apareçam para quem devolveu
        reverted_items = db.query(RevisaoItemModel.ativo_id).filter(
            RevisaoItemModel.periodo_id == periodo_id,
            RevisaoItemModel.revisor_id == current_user.id,
            RevisaoItemModel.status == 'Revertido'
        ).all()
        reverted_ids = [r[0] for r in reverted_items]
        
        # Combinar IDs (set para remover duplicatas)
        all_allowed_ids = list(set(delegated_ids + reverted_ids))
        
        # Se não tem delegações nem itens revertidos, retorna vazio
        if not all_allowed_ids:
            return []
            
        query = query.filter(RevisaoItemModel.ativo_id.in_(all_allowed_ids))
        
    results = query.all()
    
    response = []
    for item, codigo, descricao, plaqueta in results:
        item_dict = {
            "id": item.id,
            "periodo_id": item.periodo_id,
            "ativo_id": item.ativo_id,
            "ativo_codigo": codigo,
            "ativo_descricao": descricao,
            "ativo_plaqueta": plaqueta,
            "vida_util_atual_anos": item.vida_util_atual_anos,
            "vida_util_atual_meses": item.vida_util_atual_meses,
            "vida_util_nova_anos": item.vida_util_nova_anos,
            "vida_util_nova_meses": item.vida_util_nova_meses,
            "data_limite_atual": item.data_limite_atual,
            "data_limite_nova": item.data_limite_nova,
            "status": item.status,
            "justificativa": item.justificativa,
            "condicao_fisica": item.condicao_fisica,
            "motivo": item.motivo,
            "observacoes": item.observacoes,
            "revisor_id": item.revisor_id,
            "alterado": item.alterado
        }
        response.append(RevisaoItemResponse(**item_dict))
        
    return response

class RevisaoItemUpdate(BaseModel):
    vida_util_nova_anos: Optional[float] = None
    vida_util_nova_meses: Optional[float] = None
    vida_util_restante_anos: Optional[float] = None
    vida_util_restante_meses: Optional[float] = None
    nova_data_fim: Optional[date] = None
    condicao_fisica: Optional[str] = None
    motivo: Optional[str] = None
    justificativa: Optional[str] = None
    observacoes: Optional[str] = None
    status: Optional[str] = None

@router.put("/{periodo_id}/itens/{item_id}", response_model=RevisaoItemResponse)
def update_item_revisao(
    periodo_id: int,
    item_id: int,
    payload: RevisaoItemUpdate,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    """
    Atualiza um item de revisão.
    """
    item = db.query(RevisaoItemModel).filter(
        RevisaoItemModel.id == item_id,
        RevisaoItemModel.periodo_id == periodo_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
        
    # Verificar permissão (similar ao list)
    periodo = db.query(RevisaoPeriodoModel).filter(RevisaoPeriodoModel.id == periodo_id).first()
    allowed_companies = get_allowed_company_ids(db, current_user)
    if periodo.empresa_id not in allowed_companies:
        raise HTTPException(status_code=403, detail="Acesso negado")
        
    is_responsible = (periodo.responsavel_id == current_user.id) or current_user.is_superuser
    
    if not is_responsible:
        # Verificar delegação
        delegation = db.query(RevisaoDelegacaoModel).filter(
            RevisaoDelegacaoModel.periodo_id == periodo_id,
            RevisaoDelegacaoModel.usuario_id == current_user.id,
            RevisaoDelegacaoModel.ativo_id == item.ativo_id,
            RevisaoDelegacaoModel.status == 'Ativo'
        ).first()
        if not delegation:
            raise HTTPException(status_code=403, detail="Item não delegado a este usuário")
            
    # Atualizar campos
    if payload.vida_util_nova_anos is not None:
        item.vida_util_nova_anos = payload.vida_util_nova_anos
    if payload.vida_util_nova_meses is not None:
        item.vida_util_nova_meses = payload.vida_util_nova_meses
    if payload.nova_data_fim is not None:
        item.data_limite_nova = payload.nova_data_fim
    if payload.condicao_fisica is not None:
        item.condicao_fisica = payload.condicao_fisica
    if payload.motivo is not None:
        item.motivo = payload.motivo
    if payload.justificativa is not None:
        item.justificativa = payload.justificativa
    if payload.observacoes is not None:
        item.observacoes = payload.observacoes
    if payload.status is not None:
        item.status = payload.status
        
    # Marcar como alterado e definir revisor
    item.alterado = True
    item.revisor_id = current_user.id
    item.data_revisao = datetime.now()
    
    # Se status for 'Revisado', garantir que foi setado
    if item.status == 'Pendente' and (item.justificativa or item.condicao_fisica):
        item.status = 'Revisado'
        
    db.commit()
    db.refresh(item)
    
    # Retornar response (reusing logic needed, but simplistic here)
    # Fetch asset details
    asset = db.query(AssetModel).filter(AssetModel.id == item.ativo_id).first()
    
    item_dict = {
        "id": item.id,
        "periodo_id": item.periodo_id,
        "ativo_id": item.ativo_id,
        "ativo_codigo": asset.codigo if asset else None,
        "ativo_descricao": asset.descricao if asset else None,
        "ativo_plaqueta": asset.plaqueta if asset else None,
        "vida_util_atual_anos": item.vida_util_atual_anos,
        "vida_util_atual_meses": item.vida_util_atual_meses,
        "vida_util_nova_anos": item.vida_util_nova_anos,
        "vida_util_nova_meses": item.vida_util_nova_meses,
        "data_limite_atual": item.data_limite_atual,
        "data_limite_nova": item.data_limite_nova,
        "status": item.status,
        "justificativa": item.justificativa,
        "condicao_fisica": item.condicao_fisica,
        "motivo": item.motivo,
        "observacoes": item.observacoes,
        "revisor_id": item.revisor_id,
        "alterado": item.alterado
    }
    return RevisaoItemResponse(**item_dict)

class MassRevisionPayload(BaseModel):
    ativos_ids: List[int]
    incremento: Optional[str] = None # 'Manter', 'Aumentar', 'Diminuir'
    nova_vida_util_anos: Optional[float] = None
    nova_vida_util_meses: Optional[float] = None
    nova_data_fim: Optional[date] = None
    condicao_fisica: Optional[str] = None
    motivo: Optional[str] = None
    justificativa: Optional[str] = None
    periodo_id: int

@router.post("/massa")
def apply_mass_revision(
    payload: MassRevisionPayload,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    """
    Aplica revisão em massa para uma lista de ativos.
    """
    periodo = db.query(RevisaoPeriodoModel).filter(RevisaoPeriodoModel.id == payload.periodo_id).first()
    if not periodo:
        raise HTTPException(status_code=404, detail="Período não encontrado")
        
    allowed_companies = get_allowed_company_ids(db, current_user)
    if periodo.empresa_id not in allowed_companies:
        raise HTTPException(status_code=403, detail="Acesso negado")
        
    # Verificar permissões (responsável ou delegado)
    is_responsible = (periodo.responsavel_id == current_user.id) or current_user.is_superuser
    
    # Buscar itens
    items = db.query(RevisaoItemModel).filter(
        RevisaoItemModel.periodo_id == payload.periodo_id,
        RevisaoItemModel.ativo_id.in_(payload.ativos_ids)
    ).all()
    
    count = 0
    for item in items:
        # Check delegation if not responsible
        if not is_responsible:
             delegation = db.query(RevisaoDelegacaoModel).filter(
                RevisaoDelegacaoModel.periodo_id == payload.periodo_id,
                RevisaoDelegacaoModel.usuario_id == current_user.id,
                RevisaoDelegacaoModel.ativo_id == item.ativo_id,
                RevisaoDelegacaoModel.status == 'Ativo'
            ).first()
             if not delegation:
                 continue # Skip unauthorized items
        
        # Apply changes
        if payload.nova_vida_util_anos is not None:
            item.vida_util_nova_anos = payload.nova_vida_util_anos
        if payload.nova_vida_util_meses is not None:
            item.vida_util_nova_meses = payload.nova_vida_util_meses
        if payload.nova_data_fim is not None:
            item.data_limite_nova = payload.nova_data_fim
        if payload.condicao_fisica is not None:
            item.condicao_fisica = payload.condicao_fisica
        if payload.motivo is not None:
            item.motivo = payload.motivo
        if payload.justificativa is not None:
            item.justificativa = payload.justificativa
            
        item.alterado = True
        item.revisor_id = current_user.id
        item.status = 'Revisado'
        item.data_revisao = datetime.now()
        count += 1
        
    db.commit()
    return {"message": f"{count} itens atualizados com sucesso"}

class DelegationResponse(BaseModel):
    id: int
    periodo_id: int
    ativo_id: int
    usuario_id: int
    status: str
    data_atribuicao: datetime
    usuario_nome: Optional[str] = None
    ativo_codigo: Optional[str] = None
    
    class Config:
        from_attributes = True

@router.get("/delegacoes/{periodo_id}", response_model=List[DelegationResponse])
def list_delegations(
    periodo_id: int,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    # Validar período e empresa
    periodo = db.query(RevisaoPeriodoModel).filter(RevisaoPeriodoModel.id == periodo_id).first()
    if not periodo:
        raise HTTPException(status_code=404, detail="Período não encontrado")
    
    allowed_companies = get_allowed_company_ids(db, current_user)
    if periodo.empresa_id not in allowed_companies:
        raise HTTPException(status_code=403, detail="Acesso negado")
        
    # Buscar delegações com joins
    results = (
        db.query(
            RevisaoDelegacaoModel,
            UsuarioModel.nome.label("usuario_nome"),
            AssetModel.codigo.label("ativo_codigo")
        )
        .join(UsuarioModel, RevisaoDelegacaoModel.usuario_id == UsuarioModel.id)
        .join(AssetModel, RevisaoDelegacaoModel.ativo_id == AssetModel.id)
        .filter(RevisaoDelegacaoModel.periodo_id == periodo_id)
        .all()
    )
    
    response = []
    for d, u_nome, a_cod in results:
        d_dict = {
            "id": d.id,
            "periodo_id": d.periodo_id,
            "ativo_id": d.ativo_id,
            "usuario_id": d.usuario_id,
            "status": d.status,
            "data_atribuicao": d.data_atribuicao,
            "usuario_nome": u_nome,
            "ativo_codigo": a_cod
        }
        response.append(DelegationResponse(**d_dict))
        
    return response

class DelegationCreate(BaseModel):
    periodo_id: int
    usuario_id: int
    ativos_ids: List[int]

@router.post("/delegacoes")
def create_delegation(
    payload: DelegationCreate,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    periodo = db.query(RevisaoPeriodoModel).filter(RevisaoPeriodoModel.id == payload.periodo_id).first()
    if not periodo:
        raise HTTPException(status_code=404, detail="Período não encontrado")
        
    # Validar permissão (apenas responsável ou admin pode delegar?)
    # Vamos assumir que sim por segurança
    is_responsible = (periodo.responsavel_id == current_user.id) or current_user.is_superuser
    if not is_responsible:
        raise HTTPException(status_code=403, detail="Apenas o responsável pelo período pode delegar revisões")
        
    count = 0
    for ativo_id in payload.ativos_ids:
        # Verificar se já existe
        existing = db.query(RevisaoDelegacaoModel).filter(
            RevisaoDelegacaoModel.periodo_id == payload.periodo_id,
            RevisaoDelegacaoModel.ativo_id == ativo_id
        ).first()
        
        if existing:
            existing.usuario_id = payload.usuario_id
            existing.status = 'Ativo'
            existing.data_atribuicao = datetime.now()
        else:
            new_del = RevisaoDelegacaoModel(
                periodo_id=payload.periodo_id,
                ativo_id=ativo_id,
                usuario_id=payload.usuario_id,
                status='Ativo',
                data_atribuicao=datetime.now()
            )
            db.add(new_del)
        count += 1
        
    db.commit()
    return {"message": f"{count} delegações criadas/atualizadas"}

@router.delete("/delegacoes/{delegacao_id}")
def delete_delegation(
    delegacao_id: int,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    delegation = db.query(RevisaoDelegacaoModel).filter(RevisaoDelegacaoModel.id == delegacao_id).first()
    if not delegation:
        raise HTTPException(status_code=404, detail="Delegação não encontrada")
        
    # Verificar permissão
    periodo = db.query(RevisaoPeriodoModel).filter(RevisaoPeriodoModel.id == delegation.periodo_id).first()
    is_responsible = (periodo.responsavel_id == current_user.id) or current_user.is_superuser
    if not is_responsible:
        raise HTTPException(status_code=403, detail="Acesso negado")
        
    db.delete(delegation)
    db.commit()
    return {"message": "Delegação removida"}
