from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
import sqlalchemy as sa
from datetime import date, datetime
from jose import jwt, JWTError
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from ..database import SessionLocal, engine
from ..config import ALLOW_DDL
from ..models import (
    Company as CompanyModel,
    Employee as EmployeeModel,
    RevisaoItem as RevisaoItemModel,
    RevisaoPeriodo as RevisaoPeriodoModel,
    ManagementUnit as UGModel,
    Usuario as UsuarioModel,
    GrupoUsuario as GrupoUsuarioModel,
    GrupoEmpresa as GrupoEmpresaModel,
)

router = APIRouter(prefix="/supervisao/rvu", tags=["Supervisão RVU"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Segurança simples via Bearer JWT (consistente com relatorios_rvu)
security = HTTPBearer()
import os
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-prod")
ALGORITHM = "HS256"

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

def get_allowed_company_ids(db: Session, current_user: UsuarioModel) -> list[int]:
    links = db.query(GrupoUsuarioModel).filter(GrupoUsuarioModel.usuario_id == current_user.id).all()
    grupo_ids = [l.grupo_id for l in links]
    emp_links = db.query(GrupoEmpresaModel).filter(GrupoEmpresaModel.grupo_id.in_(grupo_ids)).all()
    empresas_ids = sorted({e.empresa_id for e in emp_links})
    if not empresas_ids and getattr(current_user, 'empresa_id', None) is not None:
        empresas_ids = [current_user.empresa_id]
    return empresas_ids


def ensure_tables():
    """Cria tabelas auxiliares de comentários, histórico e auditoria de RVU se não existirem.
    Em desenvolvimento, evita necessidade de migração imediata.
    """
    # Em ambientes sem permissão de DDL, não executar criação/alteração de tabelas
    if not ALLOW_DDL:
        return
    with engine.connect() as conn:
        # Comentários do supervisor
        conn.execute(sa.text(
            """
            CREATE TABLE IF NOT EXISTS revisoes_comentarios (
              id SERIAL PRIMARY KEY,
              ativo_id INTEGER NOT NULL,
              supervisor_id INTEGER NOT NULL,
              revisor_id INTEGER NOT NULL,
              comentario TEXT NOT NULL,
              data_comentario TIMESTAMP DEFAULT NOW() NOT NULL,
              status VARCHAR(20) DEFAULT 'Pendente' NOT NULL,
              tipo VARCHAR(20) DEFAULT 'normal',
              resposta TEXT,
              data_resposta TIMESTAMP,
              respondido_por INTEGER
            );
            """
        ))
        # garantir colunas extras se tabela já existir
        for alt in [
            "ALTER TABLE revisoes_comentarios ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'normal'",
            "ALTER TABLE revisoes_comentarios ADD COLUMN IF NOT EXISTS resposta TEXT",
            "ALTER TABLE revisoes_comentarios ADD COLUMN IF NOT EXISTS data_resposta TIMESTAMP",
            "ALTER TABLE revisoes_comentarios ADD COLUMN IF NOT EXISTS respondido_por INTEGER",
        ]:
            try:
                conn.execute(sa.text(alt))
            except Exception:
                pass
        # Histórico de ações (reversão/aprovação)
        conn.execute(sa.text(
            """
            CREATE TABLE IF NOT EXISTS revisoes_historico (
              id SERIAL PRIMARY KEY,
              ativo_id INTEGER NOT NULL,
              revisor_id INTEGER,
              supervisor_id INTEGER,
              vida_util_anterior INTEGER,
              vida_util_revisada INTEGER,
              motivo_reversao TEXT,
              data_reversao TIMESTAMP,
              acao VARCHAR(20) NOT NULL,
              data_evento TIMESTAMP DEFAULT NOW() NOT NULL,
              status VARCHAR(20)
            );
            """
        ))
        # Auditoria específica de RVU
        conn.execute(sa.text(
            """
            CREATE TABLE IF NOT EXISTS auditoria_rvu (
              id SERIAL PRIMARY KEY,
              usuario_id INTEGER,
              acao VARCHAR(100) NOT NULL,
              entidade VARCHAR(100) NOT NULL,
              entidade_id INTEGER,
              detalhes TEXT,
              data_evento TIMESTAMP DEFAULT NOW() NOT NULL
            );
            """
        ))


# Evita executar DDL automaticamente no import do módulo; rotas chamam sob demanda
# e respeitam a flag ALLOW_DDL.


def _filters_query(db: Session, params: dict, allowed_company_ids: list[int] | None = None):
    q = db.query(RevisaoItemModel)
    # Sempre junta com período quando houver restrição por empresa/UG ou lista de permitidas
    if params.get('empresa_id') or params.get('ug_id') or (allowed_company_ids and len(allowed_company_ids) > 0):
        q = q.join(RevisaoPeriodoModel, RevisaoPeriodoModel.id == RevisaoItemModel.periodo_id)
        # Empresas permitidas do usuário
        if allowed_company_ids:
            q = q.filter(RevisaoPeriodoModel.empresa_id.in_(allowed_company_ids))
        # Empresa/UG explícitas da consulta
        if params.get('empresa_id'):
            q = q.filter(RevisaoPeriodoModel.empresa_id == int(params['empresa_id']))
        if params.get('ug_id'):
            q = q.filter(RevisaoPeriodoModel.ug_id == int(params['ug_id']))
    # Revisor (via criado_por best-effort)
    if params.get('revisor_id'):
        q = q.filter(RevisaoItemModel.criado_por == int(params['revisor_id']))
    # Período por data de início de depreciação
    if params.get('periodo_inicio'):
        q = q.filter(RevisaoItemModel.data_inicio_depreciacao >= params['periodo_inicio'])
    if params.get('periodo_fim'):
        q = q.filter(RevisaoItemModel.data_inicio_depreciacao <= params['periodo_fim'])
    # Status
    if params.get('status') and params['status'] != 'Todos':
        q = q.filter(RevisaoItemModel.status == params['status'])
    return q


class ComentarioCreate(BaseModel):
    ativo_id: int
    supervisor_id: int
    revisor_id: int
    comentario: str
    periodo_id: Optional[int] = None


class ReverterCreate(BaseModel):
    ativo_id: int
    revisor_id: Optional[int] = None
    supervisor_id: int
    motivo_reversao: str
    periodo_id: Optional[int] = None


class AprovarCreate(BaseModel):
    ativo_id: int
    supervisor_id: int
    motivo: Optional[str] = None
    periodo_id: Optional[int] = None


@router.get('/listar')
def listar(
    empresa_id: Optional[int] = None,
    ug_id: Optional[int] = None,
    periodo_id: Optional[int] = None,
    revisor_id: Optional[int] = None,
    status: Optional[str] = None,
    periodo_inicio: Optional[date] = None,
    periodo_fim: Optional[date] = None,
    current_user: UsuarioModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    allowed = get_allowed_company_ids(db, current_user)
    if empresa_id is not None and allowed and empresa_id not in allowed:
        raise HTTPException(status_code=403, detail='Acesso negado à empresa informada')
    params = {
        'empresa_id': empresa_id,
        'ug_id': ug_id,
        'revisor_id': revisor_id,
        'status': status or 'Todos',
        'periodo_inicio': periodo_inicio,
        'periodo_fim': periodo_fim,
    }
    q = _filters_query(db, params, allowed)
    if periodo_id:
        q = q.filter(RevisaoItemModel.periodo_id == int(periodo_id))
    items = q.order_by(RevisaoItemModel.id.desc()).all()
    data = []
    for it in items:
        # período e status
        periodo_status = None
        if it.periodo_id:
            per = db.query(RevisaoPeriodoModel).filter(RevisaoPeriodoModel.id == it.periodo_id).first()
            periodo_status = getattr(per, 'status', None)
        # vida útil atual
        atual_total = (it.vida_util_periodos or 0)
        if atual_total == 0 and (it.vida_util_anos or 0) > 0:
            atual_total = (it.vida_util_anos or 0) * 12
        # Vida útil revisada: quando não houver revisão, manter como None para exibição
        revisada_total = it.vida_util_revisada if getattr(it, 'vida_util_revisada', None) is not None else None
        # Revisor
        revisor_nome = None
        if it.criado_por:
            u = db.query(UsuarioModel).filter(UsuarioModel.id == it.criado_por).first()
            revisor_nome = getattr(u, 'nome_completo', None) if u else None
        # último comentário (se existir)
        last_comment = None
        try:
            row = db.execute(sa.text("SELECT comentario, data_comentario FROM revisoes_comentarios WHERE ativo_id = :id ORDER BY data_comentario DESC LIMIT 1"), { 'id': it.id }).mappings().first()
            if row:
                last_comment = row['comentario']
        except Exception:
            # Em caso de erro (ex.: tabela inexistente), limpa transação para evitar "current transaction is aborted"
            try:
                db.rollback()
            except Exception:
                pass
            last_comment = None

        data.append({
            'id': it.id,
            'numero_imobilizado': getattr(it, 'numero_imobilizado', None),
            'descricao': getattr(it, 'descricao', None),
            'classe_contabil': getattr(it, 'classe', None),
            'valor_contabil': float(getattr(it, 'valor_contabil', 0) or 0),
            'vida_util_atual': atual_total,
            'vida_util_revisada': revisada_total,
            'delta_vida_util': (0 if revisada_total is None else (revisada_total - atual_total)),
            'revisor': revisor_nome,
            'condicao_fisica': getattr(it, 'condicao_fisica', None),
            'justificativa': getattr(it, 'justificativa', None),
            'data_revisao': getattr(it, 'criado_em', None),
            'status': getattr(it, 'status', None),
            'periodo_id': getattr(it, 'periodo_id', None),
            'periodo_status': periodo_status,
            'ultimo_comentario': last_comment,
        })
    return data


@router.post('/comentar')
def comentar(payload: ComentarioCreate, current_user: UsuarioModel = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_tables()
    it = db.query(RevisaoItemModel).filter(RevisaoItemModel.id == payload.ativo_id).first()
    if not it:
        raise HTTPException(status_code=404, detail='Item de revisão não encontrado')
    # autorização por empresa
    allowed = get_allowed_company_ids(db, current_user)
    per_check = db.query(RevisaoPeriodoModel).filter(RevisaoPeriodoModel.id == (payload.periodo_id or it.periodo_id)).first() if (payload.periodo_id or it.periodo_id) else None
    if allowed and per_check and getattr(per_check, 'empresa_id', None) not in allowed:
        raise HTTPException(status_code=403, detail='Acesso negado ao item desta empresa')
    # período status
    per = None
    if payload.periodo_id or it.periodo_id:
        per = db.query(RevisaoPeriodoModel).filter(RevisaoPeriodoModel.id == (payload.periodo_id or it.periodo_id)).first()
    closed = (getattr(per, 'status', None) == 'Encerrado')
    # registra comentário
    db.execute(sa.text(
        """
        INSERT INTO revisoes_comentarios (ativo_id, supervisor_id, revisor_id, comentario, status, tipo)
        VALUES (:ativo_id, :supervisor_id, :revisor_id, :comentario, 'Pendente', :tipo)
        """
    ), {
        'ativo_id': payload.ativo_id,
        'supervisor_id': payload.supervisor_id,
        'revisor_id': payload.revisor_id,
        'comentario': payload.comentario,
        'tipo': 'acompanhamento' if closed else 'normal',
    })
    db.commit()
    # notificação por e-mail (placeholder - auditoria)
    db.execute(sa.text(
        """
        INSERT INTO auditoria_rvu (usuario_id, acao, entidade, entidade_id, detalhes)
        VALUES (:usuario_id, 'notify', 'revisao_item', :entidade_id, :detalhes)
        """
    ), {
        'usuario_id': payload.supervisor_id,
        'entidade_id': payload.ativo_id,
        'detalhes': f"Comentario enviado ao revisor {payload.revisor_id}"
    })
    db.commit()
    return { 'ok': True }


@router.post('/reverter')
def reverter(payload: ReverterCreate, current_user: UsuarioModel = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_tables()
    it = db.query(RevisaoItemModel).filter(RevisaoItemModel.id == payload.ativo_id).first()
    if not it:
        raise HTTPException(status_code=404, detail='Item de revisão não encontrado')
    # autorização por empresa
    allowed = get_allowed_company_ids(db, current_user)
    per_check = db.query(RevisaoPeriodoModel).filter(RevisaoPeriodoModel.id == (payload.periodo_id or it.periodo_id)).first() if (payload.periodo_id or it.periodo_id) else None
    if allowed and per_check and getattr(per_check, 'empresa_id', None) not in allowed:
        raise HTTPException(status_code=403, detail='Acesso negado ao item desta empresa')
    # período status
    per = None
    if payload.periodo_id or it.periodo_id:
        per = db.query(RevisaoPeriodoModel).filter(RevisaoPeriodoModel.id == (payload.periodo_id or it.periodo_id)).first()
    if getattr(per, 'status', None) == 'Encerrado':
        raise HTTPException(status_code=400, detail='Período encerrado: reversões bloqueadas')
    # vida útil anterior e revisada
    atual_total = (it.vida_util_periodos or 0)
    if atual_total == 0 and (it.vida_util_anos or 0) > 0:
        atual_total = (it.vida_util_anos or 0) * 12
    revisada_total = it.vida_util_revisada or 0
    # registra histórico
    db.execute(sa.text(
        """
        INSERT INTO revisoes_historico (ativo_id, revisor_id, supervisor_id, vida_util_anterior, vida_util_revisada, motivo_reversao, data_reversao, acao, status)
        VALUES (:ativo_id, :revisor_id, :supervisor_id, :vida_util_anterior, :vida_util_revisada, :motivo_reversao, NOW(), 'revertido', 'revertido')
        """
    ), {
        'ativo_id': payload.ativo_id,
        'revisor_id': payload.revisor_id,
        'supervisor_id': payload.supervisor_id,
        'vida_util_anterior': int(atual_total or 0),
        'vida_util_revisada': int(revisada_total or 0),
        'motivo_reversao': payload.motivo_reversao,
    })
    # restaura vida útil anterior e marca status como Revertido
    it.vida_util_revisada = None
    it.data_fim_revisada = None
    it.status = 'Revertido'
    db.commit()
    # auditoria
    db.execute(sa.text(
        """
        INSERT INTO auditoria_rvu (usuario_id, acao, entidade, entidade_id, detalhes)
        VALUES (:usuario_id, 'reverter', 'revisao_item', :entidade_id, :detalhes)
        """
    ), {
        'usuario_id': payload.supervisor_id,
        'entidade_id': payload.ativo_id,
        'detalhes': f"Reversao realizada. Motivo: {payload.motivo_reversao}"
    })
    db.commit()
    return { 'ok': True }


@router.post('/aprovar')
def aprovar(payload: AprovarCreate, current_user: UsuarioModel = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_tables()
    it = db.query(RevisaoItemModel).filter(RevisaoItemModel.id == payload.ativo_id).first()
    if not it:
        raise HTTPException(status_code=404, detail='Item de revisão não encontrado')
    # autorização por empresa
    allowed = get_allowed_company_ids(db, current_user)
    per_check = db.query(RevisaoPeriodoModel).filter(RevisaoPeriodoModel.id == (payload.periodo_id or it.periodo_id)).first() if (payload.periodo_id or it.periodo_id) else None
    if allowed and per_check and getattr(per_check, 'empresa_id', None) not in allowed:
        raise HTTPException(status_code=403, detail='Acesso negado ao item desta empresa')
    # período status
    per = None
    if payload.periodo_id or it.periodo_id:
        per = db.query(RevisaoPeriodoModel).filter(RevisaoPeriodoModel.id == (payload.periodo_id or it.periodo_id)).first()
    if getattr(per, 'status', None) == 'Encerrado':
        raise HTTPException(status_code=400, detail='Período encerrado: aprovações bloqueadas')
    # marca como aprovado
    it.status = 'Aprovado'
    db.commit()
    # histórico
    revisada_total = int(it.vida_util_revisada or 0)
    db.execute(sa.text(
        """
        INSERT INTO revisoes_historico (ativo_id, supervisor_id, vida_util_revisada, acao, status, motivo_reversao)
        VALUES (:ativo_id, :supervisor_id, :vida_util_revisada, 'aprovado', 'aprovado', :motivo)
        """
    ), {
        'ativo_id': payload.ativo_id,
        'supervisor_id': payload.supervisor_id,
        'vida_util_revisada': revisada_total,
        'motivo': payload.motivo or ''
    })
    # auditoria
    db.execute(sa.text(
        """
        INSERT INTO auditoria_rvu (usuario_id, acao, entidade, entidade_id, detalhes)
        VALUES (:usuario_id, 'aprovar', 'revisao_item', :entidade_id, :detalhes)
        """
    ), {
        'usuario_id': payload.supervisor_id,
        'entidade_id': payload.ativo_id,
        'detalhes': f"Aprovacao registrada. {payload.motivo or ''}"
    })
    db.commit()
    return { 'ok': True }


@router.get('/historico')
def historico(
    ativo_id: Optional[int] = None,
    revisor_id: Optional[int] = None,
    supervisor_id: Optional[int] = None,
    q: Optional[str] = None,
    current_user: UsuarioModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ensure_tables()
    allowed = get_allowed_company_ids(db, current_user)
    # Se não houver empresas permitidas, retorne vazio
    if allowed and len(allowed) == 0:
        return []
    base = "SELECT id, ativo_id, revisor_id, supervisor_id, vida_util_anterior, vida_util_revisada, motivo_reversao, data_reversao, acao, status, data_evento FROM revisoes_historico"
    clauses = []
    params = {}
    if ativo_id:
        clauses.append("ativo_id = :ativo_id")
        params['ativo_id'] = ativo_id
    if revisor_id:
        clauses.append("revisor_id = :revisor_id")
        params['revisor_id'] = revisor_id
    if supervisor_id:
        clauses.append("supervisor_id = :supervisor_id")
        params['supervisor_id'] = supervisor_id
    if q:
        clauses.append("(motivo_reversao ILIKE :q)")
        params['q'] = f"%{q}%"
    # Restringe por empresas permitidas do usuário sem montar listas enormes de ativos
    # Usa EXISTS com join em revisoes_itens e revisoes_periodos para garantir escopo por empresa
    if not ativo_id and allowed:
        try:
            allowed_list = ",".join(str(cid) for cid in allowed)
            clauses.append(
                "EXISTS (SELECT 1 FROM revisoes_itens ri JOIN revisoes_periodos rp ON rp.id = ri.periodo_id "
                "WHERE ri.id = revisoes_historico.ativo_id AND rp.empresa_id IN (" + allowed_list + "))"
            )
        except Exception:
            # Em caso de erro ao montar a cláusula, retorne vazio para evitar 500
            return []
    sql = base + (" WHERE " + " AND ".join(clauses) if clauses else "") + " ORDER BY data_evento DESC"
    try:
        rows = db.execute(sa.text(sql), params).mappings().all()
        return [dict(r) for r in rows]
    except Exception:
        # Em ambientes sem privilégio de DDL ou sem tabelas auxiliares, retorne vazio
        return []


@router.get('/comentarios')
def listar_comentarios(ativo_id: int, current_user: UsuarioModel = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_tables()
    # Verifica empresa do item
    allowed = get_allowed_company_ids(db, current_user)
    it = db.query(RevisaoItemModel).filter(RevisaoItemModel.id == ativo_id).first()
    per = db.query(RevisaoPeriodoModel).filter(RevisaoPeriodoModel.id == getattr(it, 'periodo_id', None)).first() if it else None
    if allowed and per and getattr(per, 'empresa_id', None) not in allowed:
        raise HTTPException(status_code=403, detail='Acesso negado aos comentários deste item')
    sql = sa.text("SELECT id, ativo_id, supervisor_id, revisor_id, comentario, data_comentario, status, tipo, resposta, data_resposta, respondido_por FROM revisoes_comentarios WHERE ativo_id = :id ORDER BY data_comentario DESC")
    try:
        rows = db.execute(sql, { 'id': ativo_id }).mappings().all()
        return [dict(r) for r in rows]
    except Exception:
        # Sem tabela de comentários disponível
        return []


class ComentarioResponder(BaseModel):
    comentario_id: int
    revisor_id: int
    resposta: str
    periodo_id: Optional[int] = None


@router.post('/comentarios/responder')
def responder_comentario(payload: ComentarioResponder, current_user: UsuarioModel = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_tables()
    row = db.execute(sa.text("SELECT ativo_id FROM revisoes_comentarios WHERE id = :id"), { 'id': payload.comentario_id }).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail='Comentário não encontrado')
    it = db.query(RevisaoItemModel).filter(RevisaoItemModel.id == row['ativo_id']).first()
    per = db.query(RevisaoPeriodoModel).filter(RevisaoPeriodoModel.id == (payload.periodo_id or getattr(it, 'periodo_id', None))).first() if it else None
    # Autorização por empresa
    allowed = get_allowed_company_ids(db, current_user)
    if allowed and per and getattr(per, 'empresa_id', None) not in allowed:
        raise HTTPException(status_code=403, detail='Acesso negado aos comentários deste item')
    if getattr(per, 'status', None) == 'Encerrado':
        raise HTTPException(status_code=400, detail='Período encerrado: respostas bloqueadas')
    db.execute(sa.text(
        """
        UPDATE revisoes_comentarios
        SET resposta = :resposta, data_resposta = NOW(), respondido_por = :revisor_id, status = 'Respondido'
        WHERE id = :id
        """
    ), { 'resposta': payload.resposta, 'revisor_id': payload.revisor_id, 'id': payload.comentario_id })
    db.commit()
    # auditoria
    db.execute(sa.text(
        """
        INSERT INTO auditoria_rvu (usuario_id, acao, entidade, entidade_id, detalhes)
        VALUES (:usuario_id, 'responder_comentario', 'revisoes_comentarios', :entidade_id, :detalhes)
        """
    ), {
        'usuario_id': payload.revisor_id,
        'entidade_id': payload.comentario_id,
        'detalhes': 'Resposta registrada e supervisor notificado.'
    })
    db.commit()
    return { 'ok': True }