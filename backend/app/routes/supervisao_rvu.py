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
    empresas_ids = {e.empresa_id for e in emp_links}
    if getattr(current_user, 'empresa_id', None) is not None:
        empresas_ids.add(current_user.empresa_id)
    return sorted(empresas_ids)


_tables_ensured = False

def ensure_tables():
    """Cria tabelas auxiliares de comentários, histórico e auditoria de RVU se não existirem.
    Em desenvolvimento, evita necessidade de migração imediata.
    Executa apenas uma vez por ciclo de vida da aplicação para evitar overhead e locks.
    """
    global _tables_ensured
    if _tables_ensured:
        return

    # Tenta criar tabelas mesmo se ALLOW_DDL for falso, pois são essenciais para o funcionamento
    # e a falta delas causa erro 500 na aprovação.
    # O comando IF NOT EXISTS garante que não haverá erro se já existirem.
    try:
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
            conn.commit()
    except Exception as e:
        print(f"Aviso: Falha ao garantir tabelas (revisoes_comentarios): {e}")

    try:
        with engine.connect() as conn:
            # garantir colunas extras se tabela já existir
            for alt in [
                "ALTER TABLE revisoes_comentarios ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'normal'",
                "ALTER TABLE revisoes_comentarios ADD COLUMN IF NOT EXISTS resposta TEXT",
                "ALTER TABLE revisoes_comentarios ADD COLUMN IF NOT EXISTS data_resposta TIMESTAMP",
                "ALTER TABLE revisoes_comentarios ADD COLUMN IF NOT EXISTS respondido_por INTEGER",
            ]:
                try:
                    conn.execute(sa.text(alt))
                    conn.commit()
                except Exception:
                    pass
    except Exception:
        pass

    try:
        with engine.connect() as conn:
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
            conn.commit()
    except Exception as e:
        print(f"Aviso: Falha ao garantir tabelas (revisoes_historico): {e}")

    try:
        with engine.connect() as conn:
            # garantir colunas extras em revisoes_historico se tabela já existir
            for alt in [
                "ALTER TABLE revisoes_historico ADD COLUMN IF NOT EXISTS revisor_id INTEGER",
                "ALTER TABLE revisoes_historico ADD COLUMN IF NOT EXISTS supervisor_id INTEGER",
                "ALTER TABLE revisoes_historico ADD COLUMN IF NOT EXISTS vida_util_anterior INTEGER",
                "ALTER TABLE revisoes_historico ADD COLUMN IF NOT EXISTS vida_util_revisada INTEGER",
                "ALTER TABLE revisoes_historico ADD COLUMN IF NOT EXISTS motivo_reversao TEXT",
                "ALTER TABLE revisoes_historico ADD COLUMN IF NOT EXISTS data_reversao TIMESTAMP",
                "ALTER TABLE revisoes_historico ADD COLUMN IF NOT EXISTS acao VARCHAR(20)",
                "ALTER TABLE revisoes_historico ADD COLUMN IF NOT EXISTS status VARCHAR(20)",
            ]:
                try:
                    conn.execute(sa.text(alt))
                    conn.commit()
                except Exception:
                    pass
    except Exception:
        pass

    try:
        with engine.connect() as conn:
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
            conn.commit()
    except Exception as e:
        print(f"Aviso: Falha ao garantir tabelas (auditoria_rvu): {e}")

    _tables_ensured = True


# Evita executar DDL automaticamente no import do módulo; rotas chamam sob demanda
# e respeitam a flag ALLOW_DDL.


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


class AprovarMassaCreate(BaseModel):
    ativos_ids: List[int]
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
    
    # Query otimizada com joins para evitar N+1
    # O revisor exibido deve ser o Responsável pela revisão cadastrado no Período (RevisaoPeriodoModel.responsavel_id)
    q = db.query(
        RevisaoItemModel,
        RevisaoPeriodoModel.status.label('periodo_status'),
        UsuarioModel.nome_completo.label('revisor_nome')
    ).join(
        RevisaoPeriodoModel, RevisaoItemModel.periodo_id == RevisaoPeriodoModel.id
    ).outerjoin(
        UsuarioModel, RevisaoPeriodoModel.responsavel_id == UsuarioModel.id
    )

    # Filtros (incorporando lógica de _filters_query)
    # Empresas permitidas
    if allowed:
        q = q.filter(RevisaoPeriodoModel.empresa_id.in_(allowed))
    
    # Filtros explícitos
    if empresa_id:
        q = q.filter(RevisaoPeriodoModel.empresa_id == int(empresa_id))
    if ug_id:
        q = q.filter(RevisaoPeriodoModel.ug_id == int(ug_id))
    if revisor_id:
        q = q.filter(RevisaoPeriodoModel.responsavel_id == int(revisor_id))
    if periodo_id:
        q = q.filter(RevisaoItemModel.periodo_id == int(periodo_id))
    
    # Filtro por data de início de depreciação
    if periodo_inicio:
        q = q.filter(RevisaoItemModel.data_inicio_depreciacao >= periodo_inicio)
    if periodo_fim:
        q = q.filter(RevisaoItemModel.data_inicio_depreciacao <= periodo_fim)
        
    # Status
    if status and status != 'Todos':
        q = q.filter(RevisaoItemModel.status == status)

    # Ordenação e execução
    results = q.order_by(RevisaoItemModel.id.desc()).all()
    
    # --- DEBUG LOG START ---
    try:
        debug_groups = {}
        for row in results:
            it = row[0]
            key = str(it.numero_imobilizado or '')
            if key not in debug_groups:
                debug_groups[key] = []
            debug_groups[key].append(it)
        
        debug_fully_depreciated = 0
        for key, group in debug_groups.items():
            # Check if main item exists (sub=0)
            main_item = next((x for x in group if float(str(x.sub_numero or 0)) == 0), None)
            if main_item:
                total_val = sum(float(x.valor_contabil or 0) for x in group)
                if abs(total_val) < 0.01:
                    debug_fully_depreciated += 1
        print(f"DEBUG /supervisao/rvu/listar: Returning {len(results)} items. Server-side calc fully depreciated: {debug_fully_depreciated}")
    except Exception as e:
        print(f"DEBUG /supervisao/rvu/listar error in debug calc: {e}")
    # --- DEBUG LOG END ---
    
    # Carregamento em lote dos comentários
    comments_map = {}
    item_ids = [row[0].id for row in results]
    if item_ids:
        try:
            # Busca todos os comentários dos itens listados
            # Ordena por data ASC para que o último processado seja o mais recente
            stmt = sa.text("""
                SELECT ativo_id, comentario 
                FROM revisoes_comentarios 
                WHERE ativo_id IN :ids 
                ORDER BY data_comentario ASC
            """)
            # Necessário bindar a lista como tupla para o IN funcionar corretamente no execute
            # SQLAlchemy moderno suporta lista com expanding=True, mas approach manual é seguro:
            # Vamos iterar ou usar tuple(item_ids). 
            # Obs: :ids no text() com execute() direto pode exigir tratamento específico dependendo do driver.
            # Approach seguro: iterar no python se driver der problema, mas para performance:
            rs = db.execute(stmt.bindparams(sa.bindparam('ids', expanding=True)), {'ids': item_ids})
            for row in rs.mappings():
                comments_map[row['ativo_id']] = row['comentario']
        except Exception:
            # Tabela pode não existir ou erro de driver
            pass

    data = []

    for row in results:
        it, periodo_status, revisor_nome = row
        
        # vida útil atual
        atual_total = (it.vida_util_periodos or 0)
        if atual_total == 0 and (it.vida_util_anos or 0) > 0:
            atual_total = (it.vida_util_anos or 0) * 12
            
        # Vida útil revisada
        revisada_total = it.vida_util_revisada if getattr(it, 'vida_util_revisada', None) is not None else None
        
        data.append({
            'id': it.id,
            'numero_imobilizado': getattr(it, 'numero_imobilizado', None),
            'sub_numero': getattr(it, 'sub_numero', None),
            'descricao': getattr(it, 'descricao', None),
            'classe_contabil': getattr(it, 'classe', None),
            'valor_contabil': float(getattr(it, 'valor_contabil', 0) or 0),
            'vida_util_atual': atual_total,
            'vida_util_revisada': revisada_total,
            'delta_vida_util': (0 if revisada_total is None else (revisada_total - atual_total)),
            'revisor': revisor_nome,
            'revisor_id': getattr(it, 'criado_por', None),
            'condicao_fisica': getattr(it, 'condicao_fisica', None),
            'justificativa': getattr(it, 'justificativa', None),
            'data_revisao': getattr(it, 'criado_em', None),
            'status': getattr(it, 'status', None),
            'periodo_id': getattr(it, 'periodo_id', None),
            'periodo_status': periodo_status,
            'ultimo_comentario': comments_map.get(it.id),
            'data_inicio_depreciacao': getattr(it, 'data_inicio_depreciacao', None),
            'data_fim_depreciacao': getattr(it, 'data_fim_depreciacao', None),
            'data_fim_revisada': getattr(it, 'data_fim_revisada', None),
            'alterado': getattr(it, 'alterado', False),
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
    try:
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
        # Use current_user.id instead of payload.supervisor_id to ensure validity
        safe_supervisor_id = current_user.id
        
        # Determine revisor_id (who performed the review or is responsible)
        revisor_id = getattr(it, 'criado_por', None)
        if not revisor_id and per:
            revisor_id = getattr(per, 'responsavel_id', None)
        
        # Determine previous useful life (vida_util_periodos is usually total months)
        vida_anterior = (it.vida_util_periodos or 0)
        if vida_anterior == 0 and (it.vida_util_anos or 0) > 0:
            vida_anterior = (it.vida_util_anos or 0) * 12

        db.execute(sa.text(
            """
            INSERT INTO revisoes_historico (ativo_id, supervisor_id, revisor_id, vida_util_anterior, vida_util_revisada, acao, status, motivo_reversao)
            VALUES (:ativo_id, :supervisor_id, :revisor_id, :vida_util_anterior, :vida_util_revisada, 'aprovado', 'aprovado', :motivo)
            """
        ), {
            'ativo_id': payload.ativo_id,
            'supervisor_id': safe_supervisor_id,
            'revisor_id': revisor_id,
            'vida_util_anterior': vida_anterior,
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
            'usuario_id': safe_supervisor_id,
            'entidade_id': payload.ativo_id,
            'detalhes': f"Aprovacao registrada. {payload.motivo or ''}"
        })
        db.commit()
        return { 'ok': True }
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERRO /supervisao/rvu/aprovar: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@router.post('/aprovar-massa')
def aprovar_massa(payload: AprovarMassaCreate, current_user: UsuarioModel = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_tables()
    
    if not payload.ativos_ids:
        raise HTTPException(status_code=400, detail="Nenhum item selecionado")

    # Fetch items
    items = db.query(RevisaoItemModel).filter(RevisaoItemModel.id.in_(payload.ativos_ids)).all()
    if not items:
        return {'ok': True, 'count': 0, 'errors': []}

    allowed = get_allowed_company_ids(db, current_user)
    
    # Pre-fetch periods to minimize queries
    period_ids = {it.periodo_id for it in items if it.periodo_id}
    periods = db.query(RevisaoPeriodoModel).filter(RevisaoPeriodoModel.id.in_(period_ids)).all()
    periods_map = {p.id: p for p in periods}
    
    success_count = 0
    errors = []

    safe_supervisor_id = current_user.id

    for it in items:
        try:
            # Check company permission
            per = periods_map.get(it.periodo_id)
            if allowed and per and per.empresa_id not in allowed:
                errors.append(f"Item {it.numero_imobilizado}: Acesso negado à empresa")
                continue

            # Check period status
            if per and per.status == 'Encerrado':
                errors.append(f"Item {it.numero_imobilizado}: Período encerrado")
                continue
            
            # Skip if already approved (optional, but good practice)
            if it.status == 'Aprovado':
                # Already approved, maybe just count it or skip?
                # Let's count it as success or just skip updates
                success_count += 1
                continue

            # Update status
            it.status = 'Aprovado'
            
            # History
            revisada_total = int(it.vida_util_revisada or 0)
            revisor_id = getattr(it, 'criado_por', None)
            if not revisor_id and per:
                revisor_id = getattr(per, 'responsavel_id', None)
            
            # Determine previous useful life
            vida_anterior = (it.vida_util_periodos or 0)
            if vida_anterior == 0 and (it.vida_util_anos or 0) > 0:
                vida_anterior = (it.vida_util_anos or 0) * 12

            # Insert history
            db.execute(sa.text(
                """
                INSERT INTO revisoes_historico (ativo_id, supervisor_id, revisor_id, vida_util_anterior, vida_util_revisada, acao, status, motivo_reversao)
                VALUES (:ativo_id, :supervisor_id, :revisor_id, :vida_util_anterior, :vida_util_revisada, 'aprovado', 'aprovado', :motivo)
                """
            ), {
                'ativo_id': it.id,
                'supervisor_id': safe_supervisor_id,
                'revisor_id': revisor_id,
                'vida_util_anterior': vida_anterior,
                'vida_util_revisada': revisada_total,
                'motivo': payload.motivo or ''
            })
            
            # Insert audit
            db.execute(sa.text(
                """
                INSERT INTO auditoria_rvu (usuario_id, acao, entidade, entidade_id, detalhes)
                VALUES (:usuario_id, 'aprovar', 'revisao_item', :entidade_id, :detalhes)
                """
            ), {
                'usuario_id': safe_supervisor_id,
                'entidade_id': it.id,
                'detalhes': f"Aprovacao em massa. {payload.motivo or ''}"
            })

            success_count += 1
        except Exception as e:
            errors.append(f"Item {it.numero_imobilizado}: {str(e)}")
            continue
    
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao salvar aprovações em massa: {str(e)}")

    return {
        'ok': True,
        'count': success_count,
        'errors': errors
    }


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
    if allowed and len(allowed) == 0:
        return []
    
    base = """
    SELECT 
        rh.id, rh.ativo_id, rh.revisor_id, rh.supervisor_id, rh.vida_util_anterior, rh.vida_util_revisada, 
        rh.motivo_reversao, rh.data_reversao, rh.acao, rh.status, rh.data_evento,
        COALESCE(ri.numero_imobilizado, '') as numero_imobilizado, 
        COALESCE(ri.descricao, '') as descricao,
        COALESCE(u.nome_completo, u2.nome_completo, 'Desconhecido') as usuario_nome
    FROM revisoes_historico rh
    JOIN revisoes_itens ri ON rh.ativo_id = ri.id
    LEFT JOIN usuarios u ON rh.supervisor_id = u.id
    LEFT JOIN usuarios u2 ON rh.revisor_id = u2.id
    """
    
    clauses = []
    params = {}
    
    if ativo_id:
        clauses.append("rh.ativo_id = :ativo_id")
        params['ativo_id'] = ativo_id
    if revisor_id:
        clauses.append("rh.revisor_id = :revisor_id")
        params['revisor_id'] = revisor_id
    if supervisor_id:
        clauses.append("rh.supervisor_id = :supervisor_id")
        params['supervisor_id'] = supervisor_id
    if q:
        clauses.append("(rh.motivo_reversao ILIKE :q OR ri.descricao ILIKE :q OR ri.numero_imobilizado ILIKE :q)")
        params['q'] = f"%{q}%"
        
    if not ativo_id and allowed:
        try:
            allowed_list = ",".join(str(cid) for cid in allowed)
            clauses.append(
                "EXISTS (SELECT 1 FROM revisoes_periodos rp WHERE rp.id = ri.periodo_id AND rp.empresa_id IN (" + allowed_list + "))"
            )
        except Exception:
            return []
            
    sql = base + (" WHERE " + " AND ".join(clauses) if clauses else "") + " ORDER BY rh.data_evento DESC"
    
    try:
        rows = db.execute(sa.text(sql), params).mappings().all()
        return [dict(r) for r in rows]
    except Exception as e:
        print(f"Error in historico: {e}")
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