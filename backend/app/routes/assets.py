from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import date
from decimal import Decimal
import sqlalchemy as sa

from ..database import SessionLocal
from ..models import Asset, Company, ManagementUnit, CentroCusto, ClasseContabil, Usuario as UsuarioModel, RevisaoItem as RevisaoItemModel, RevisaoPeriodo as RevisaoPeriodoModel
from ..dependencies import get_db, get_current_user, get_allowed_company_ids

router = APIRouter(prefix="/assets", tags=["Assets"])

# Pydantic models
class AssetBase(BaseModel):
    numero: str
    sub_numero: str = "0"
    descricao: str
    data_aquisicao: date
    valor_aquisicao: Decimal
    empresa_id: int
    ug_id: Optional[int] = None
    centro_custo_id: Optional[int] = None
    classe_id: Optional[int] = None
    vida_util_anos: Optional[int] = None
    taxa_depreciacao: Optional[Decimal] = None
    status: str = "Ativo"

class AssetCreate(AssetBase):
    pass

class AssetUpdate(BaseModel):
    numero: Optional[str] = None
    sub_numero: Optional[str] = None
    descricao: Optional[str] = None
    data_aquisicao: Optional[date] = None
    valor_aquisicao: Optional[Decimal] = None
    ug_id: Optional[int] = None
    centro_custo_id: Optional[int] = None
    classe_id: Optional[int] = None
    vida_util_anos: Optional[int] = None
    taxa_depreciacao: Optional[Decimal] = None
    status: Optional[str] = None

class AssetResponse(AssetBase):
    id: int
    
    # Nested fields for display if needed, but for now flat is fine or we can add optional objects
    # For the table, we might want names
    empresa_name: Optional[str] = None
    ug_name: Optional[str] = None
    centro_custo_name: Optional[str] = None
    classe_name: Optional[str] = None

    class Config:
        orm_mode = True

class LinhaDoTempoMarco(BaseModel):
    tipo: str
    data: date

class LinhaDoTempoItem(BaseModel):
    ano: int
    fase: str
    incremento: str
    origem: str
    periodo_id: Optional[int] = None
    periodo_codigo: Optional[str] = None
    revisao_item_id: Optional[int] = None
    data_evento: Optional[date] = None
    data_abertura_periodo: Optional[date] = None
    data_inicio_nova_vida_util: Optional[date] = None
    data_fim_revisada: Optional[date] = None
    vida_util_revisada_meses: Optional[int] = None
    motivo: Optional[str] = None

class LinhaDoTempoAssetInfo(BaseModel):
    id: int
    empresa_id: int
    numero: str
    sub_numero: str
    data_incorporacao: date
    descricao: Optional[str] = None

class LinhaDoTempoEmpresaInfo(BaseModel):
    id: int
    data_adocao_ifrs: Optional[date] = None

class LinhaDoTempoFimDepreciacaoInfo(BaseModel):
    data: date
    periodo_id: Optional[int] = None
    periodo_codigo: Optional[str] = None
    data_abertura_periodo: Optional[date] = None
    origem: Optional[str] = None

class LinhaDoTempoResponse(BaseModel):
    asset: LinhaDoTempoAssetInfo
    empresa: LinhaDoTempoEmpresaInfo
    marcos: List[LinhaDoTempoMarco]
    linha_do_tempo: List[LinhaDoTempoItem]
    fim_depreciacao: Optional[LinhaDoTempoFimDepreciacaoInfo] = None

def _normalize_incremento(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    s = str(value).strip().lower()
    if not s:
        return None
    if s in {"manter", "mantido", "mantida"}:
        return "Manter"
    if "acr" in s:
        return "Acréscimo"
    if "decr" in s or "dec" in s:
        return "Decréscimo"
    return None

def _get_fim_depreciacao_ultimo_periodo_aberto(db: Session, empresa_id: int, numero: str, sub_numero: str):
    row = (
        db.query(
            RevisaoPeriodoModel.id.label("periodo_id"),
            RevisaoPeriodoModel.codigo.label("periodo_codigo"),
            RevisaoPeriodoModel.data_abertura.label("data_abertura"),
            RevisaoItemModel.data_fim_revisada.label("data_fim_revisada"),
            RevisaoItemModel.data_fim_depreciacao.label("data_fim_depreciacao"),
        )
        .join(RevisaoPeriodoModel, RevisaoPeriodoModel.id == RevisaoItemModel.periodo_id)
        .filter(
            RevisaoPeriodoModel.empresa_id == int(empresa_id),
            RevisaoPeriodoModel.status == "Aberto",
            RevisaoItemModel.numero_imobilizado == numero,
            RevisaoItemModel.sub_numero == sub_numero,
        )
        .order_by(
            sa.desc(RevisaoPeriodoModel.data_abertura),
            sa.desc(RevisaoPeriodoModel.id),
            sa.desc(RevisaoItemModel.id),
        )
        .first()
    )
    if not row:
        return None

    data_fim = row.data_fim_revisada or row.data_fim_depreciacao
    if not data_fim:
        return None

    origem = "revisada" if row.data_fim_revisada else "original"
    return LinhaDoTempoFimDepreciacaoInfo(
        data=data_fim,
        periodo_id=int(row.periodo_id) if row.periodo_id is not None else None,
        periodo_codigo=row.periodo_codigo,
        data_abertura_periodo=row.data_abertura,
        origem=origem,
    )

@router.get("/", response_model=List[AssetResponse])
def list_assets(
    empresa_id: Optional[int] = None,
    ug_id: Optional[int] = None,
    centro_custo_id: Optional[int] = None,
    classe_id: Optional[int] = None,
    numero: Optional[str] = None,
    sub_numero: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    query = db.query(Asset)
    
    if empresa_id:
        query = query.filter(Asset.empresa_id == empresa_id)
    if ug_id:
        query = query.filter(Asset.ug_id == ug_id)
    if centro_custo_id:
        query = query.filter(Asset.centro_custo_id == centro_custo_id)
    if classe_id:
        query = query.filter(Asset.classe_id == classe_id)
    if numero:
        query = query.filter(Asset.numero == numero)
    if sub_numero:
        query = query.filter(Asset.sub_numero == sub_numero)
    if status:
        query = query.filter(Asset.status == status)
        
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Asset.descricao.ilike(search_filter)) | 
            (Asset.numero.ilike(search_filter))
        )
        
    assets = query.offset(skip).limit(limit).all()
    
    # Enrich response with names manually or via ORM if relationships are eager loaded
    # Since we defined simple relationships, we can access them.
    # We'll map to response manually to handle potential None values safely if pydantic doesn't
    
    results = []
    for asset in assets:
        # Pydantic orm_mode handles direct attribute access, but for enriched fields we might need property or manual
        # Let's trust orm_mode for the base fields, and maybe the frontend can resolve IDs to names using the reference lists it already has.
        # However, for convenience, let's try to populate the names if they exist.
        
        # Helper to safely get name
        def get_name(obj, attr="nome"):
            return getattr(obj, attr) if obj else None
            
        # For ClasseContabil it is 'descricao'
        
        asset_dict = {
            "id": asset.id,
            "numero": asset.numero,
            "sub_numero": asset.sub_numero,
            "descricao": asset.descricao,
            "data_aquisicao": asset.data_aquisicao,
            "valor_aquisicao": asset.valor_aquisicao,
            "empresa_id": asset.empresa_id,
            "ug_id": asset.ug_id,
            "centro_custo_id": asset.centro_custo_id,
            "classe_id": asset.classe_id,
            "vida_util_anos": asset.vida_util_anos,
            "taxa_depreciacao": asset.taxa_depreciacao,
            "status": asset.status,
            "empresa_name": get_name(asset.company, "name"),
            "ug_name": get_name(asset.ug, "nome"),
            "centro_custo_name": get_name(asset.centro_custo, "nome"),
            "classe_name": getattr(asset.classe, "descricao", None) if asset.classe else None
        }
        results.append(asset_dict)
        
    return results

@router.get("/linha-do-tempo-rvu", response_model=LinhaDoTempoResponse)
def linha_do_tempo_rvu_por_numero(
    empresa_id: int,
    numero: str,
    sub_numero: str = "0",
    ano_inicio: Optional[int] = None,
    ano_fim: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user),
):
    allowed = set(get_allowed_company_ids(db, current_user))
    if int(empresa_id) not in allowed:
        raise HTTPException(status_code=403, detail="Acesso negado")

    empresa = db.query(Company).filter(Company.id == int(empresa_id)).first()
    data_adocao_ifrs = getattr(empresa, "data_adocao_ifrs", None) if empresa else None

    base_item = (
        db.query(
            RevisaoItemModel.data_inicio_depreciacao.label("data_inicio_depreciacao"),
            RevisaoItemModel.descricao.label("descricao"),
        )
        .join(RevisaoPeriodoModel, RevisaoPeriodoModel.id == RevisaoItemModel.periodo_id)
        .filter(
            RevisaoPeriodoModel.empresa_id == int(empresa_id),
            RevisaoItemModel.numero_imobilizado == numero,
            RevisaoItemModel.sub_numero == sub_numero,
        )
        .order_by(
            sa.asc(RevisaoItemModel.data_inicio_depreciacao),
            sa.asc(RevisaoItemModel.id),
        )
        .first()
    )

    if not base_item or not base_item.data_inicio_depreciacao:
        raise HTTPException(status_code=404, detail="Ativo não encontrado")

    rows = (
        db.query(
            RevisaoItemModel.id.label("revisao_item_id"),
            RevisaoItemModel.periodo_id.label("periodo_id"),
            RevisaoPeriodoModel.codigo.label("periodo_codigo"),
            RevisaoItemModel.auxiliar2.label("incremento"),
            RevisaoItemModel.auxiliar3.label("motivo"),
            RevisaoItemModel.data_fim_revisada.label("data_fim_revisada"),
            RevisaoItemModel.vida_util_revisada.label("vida_util_revisada_meses"),
            RevisaoPeriodoModel.data_inicio_nova_vida_util.label("data_inicio_nova_vida_util"),
            RevisaoPeriodoModel.data_abertura.label("data_abertura"),
        )
        .join(RevisaoPeriodoModel, RevisaoPeriodoModel.id == RevisaoItemModel.periodo_id)
        .filter(
            RevisaoPeriodoModel.empresa_id == int(empresa_id),
            RevisaoItemModel.numero_imobilizado == numero,
            RevisaoItemModel.sub_numero == sub_numero,
        )
        .order_by(
            sa.desc(RevisaoPeriodoModel.data_inicio_nova_vida_util.isnot(None)),
            sa.desc(RevisaoPeriodoModel.data_inicio_nova_vida_util),
            sa.desc(RevisaoPeriodoModel.data_abertura),
            sa.desc(RevisaoItemModel.id),
        )
        .all()
    )

    eventos_por_ano: dict[int, dict] = {}
    for r in rows:
        data_evento = r.data_abertura or r.data_inicio_nova_vida_util
        if not data_evento:
            continue
        ano = int(data_evento.year)
        if ano not in eventos_por_ano:
            eventos_por_ano[ano] = {
                "periodo_id": int(r.periodo_id) if r.periodo_id is not None else None,
                "periodo_codigo": r.periodo_codigo,
                "revisao_item_id": int(r.revisao_item_id) if r.revisao_item_id is not None else None,
                "data_evento": data_evento,
                "data_abertura_periodo": r.data_abertura,
                "data_inicio_nova_vida_util": r.data_inicio_nova_vida_util,
                "incremento": _normalize_incremento(r.incremento),
                "data_fim_revisada": r.data_fim_revisada,
                "vida_util_revisada_meses": int(r.vida_util_revisada_meses) if r.vida_util_revisada_meses is not None else None,
                "motivo": r.motivo,
            }

    start_year = int(base_item.data_inicio_depreciacao.year)
    end_year = int(date.today().year)
    if ano_inicio is not None:
        start_year = max(start_year, int(ano_inicio))
    if ano_fim is not None:
        end_year = min(end_year, int(ano_fim))
    if start_year > end_year:
        start_year, end_year = end_year, start_year

    marcos: List[LinhaDoTempoMarco] = [
        LinhaDoTempoMarco(tipo="incorporacao", data=base_item.data_inicio_depreciacao),
    ]
    if data_adocao_ifrs:
        marcos.append(LinhaDoTempoMarco(tipo="adocao_ifrs", data=data_adocao_ifrs))

    fim_depreciacao = _get_fim_depreciacao_ultimo_periodo_aberto(db, int(empresa_id), numero, sub_numero)

    linha: List[LinhaDoTempoItem] = []
    for y in range(start_year, end_year + 1):
        fase = "pos_ifrs"
        if data_adocao_ifrs and date(y, 12, 31) < data_adocao_ifrs:
            fase = "pre_ifrs"

        ev = eventos_por_ano.get(y)
        if ev:
            incremento = ev.get("incremento") or "Manter"
            linha.append(
                LinhaDoTempoItem(
                    ano=y,
                    fase=fase,
                    incremento=incremento,
                    origem="revisoes_itens",
                    periodo_id=ev.get("periodo_id"),
                    periodo_codigo=ev.get("periodo_codigo"),
                    revisao_item_id=ev.get("revisao_item_id"),
                    data_evento=ev.get("data_evento"),
                    data_abertura_periodo=ev.get("data_abertura_periodo"),
                    data_inicio_nova_vida_util=ev.get("data_inicio_nova_vida_util"),
                    data_fim_revisada=ev.get("data_fim_revisada"),
                    vida_util_revisada_meses=ev.get("vida_util_revisada_meses"),
                    motivo=ev.get("motivo"),
                )
            )
        else:
            linha.append(
                LinhaDoTempoItem(
                    ano=y,
                    fase=fase,
                    incremento="Manter",
                    origem="assumido",
                )
            )

    return LinhaDoTempoResponse(
        asset=LinhaDoTempoAssetInfo(
            id=0,
            empresa_id=int(empresa_id),
            numero=numero,
            sub_numero=sub_numero,
            data_incorporacao=base_item.data_inicio_depreciacao,
            descricao=base_item.descricao,
        ),
        empresa=LinhaDoTempoEmpresaInfo(
            id=int(empresa_id),
            data_adocao_ifrs=data_adocao_ifrs,
        ),
        marcos=marcos,
        linha_do_tempo=linha,
        fim_depreciacao=fim_depreciacao,
    )

@router.get("/{asset_id}/linha-do-tempo-rvu", response_model=LinhaDoTempoResponse)
def linha_do_tempo_rvu(
    asset_id: int,
    ano_inicio: Optional[int] = None,
    ano_fim: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user),
):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    allowed = set(get_allowed_company_ids(db, current_user))
    if asset.empresa_id not in allowed:
        raise HTTPException(status_code=403, detail="Acesso negado")

    empresa = db.query(Company).filter(Company.id == asset.empresa_id).first()
    data_adocao_ifrs = getattr(empresa, "data_adocao_ifrs", None) if empresa else None

    rows = (
        db.query(
            RevisaoItemModel.id.label("revisao_item_id"),
            RevisaoItemModel.periodo_id.label("periodo_id"),
            RevisaoPeriodoModel.codigo.label("periodo_codigo"),
            RevisaoItemModel.auxiliar2.label("incremento"),
            RevisaoItemModel.auxiliar3.label("motivo"),
            RevisaoItemModel.data_fim_revisada.label("data_fim_revisada"),
            RevisaoItemModel.vida_util_revisada.label("vida_util_revisada_meses"),
            RevisaoPeriodoModel.data_inicio_nova_vida_util.label("data_inicio_nova_vida_util"),
            RevisaoPeriodoModel.data_abertura.label("data_abertura"),
        )
        .join(RevisaoPeriodoModel, RevisaoPeriodoModel.id == RevisaoItemModel.periodo_id)
        .filter(
            RevisaoPeriodoModel.empresa_id == asset.empresa_id,
            RevisaoItemModel.numero_imobilizado == asset.numero,
            RevisaoItemModel.sub_numero == asset.sub_numero,
        )
        .order_by(
            sa.desc(RevisaoPeriodoModel.data_inicio_nova_vida_util.isnot(None)),
            sa.desc(RevisaoPeriodoModel.data_inicio_nova_vida_util),
            sa.desc(RevisaoPeriodoModel.data_abertura),
            sa.desc(RevisaoItemModel.id),
        )
        .all()
    )

    eventos_por_ano: dict[int, dict] = {}
    for r in rows:
        data_evento = r.data_abertura or r.data_inicio_nova_vida_util
        if not data_evento:
            continue
        ano = int(data_evento.year)
        if ano not in eventos_por_ano:
            eventos_por_ano[ano] = {
                "periodo_id": int(r.periodo_id) if r.periodo_id is not None else None,
                "periodo_codigo": r.periodo_codigo,
                "revisao_item_id": int(r.revisao_item_id) if r.revisao_item_id is not None else None,
                "data_evento": data_evento,
                "data_abertura_periodo": r.data_abertura,
                "data_inicio_nova_vida_util": r.data_inicio_nova_vida_util,
                "incremento": _normalize_incremento(r.incremento),
                "data_fim_revisada": r.data_fim_revisada,
                "vida_util_revisada_meses": int(r.vida_util_revisada_meses) if r.vida_util_revisada_meses is not None else None,
                "motivo": r.motivo,
            }

    start_year = int(asset.data_aquisicao.year)
    end_year = int(date.today().year)
    if ano_inicio is not None:
        start_year = max(start_year, int(ano_inicio))
    if ano_fim is not None:
        end_year = min(end_year, int(ano_fim))
    if start_year > end_year:
        start_year, end_year = end_year, start_year

    marcos: List[LinhaDoTempoMarco] = [
        LinhaDoTempoMarco(tipo="incorporacao", data=asset.data_aquisicao),
    ]
    if data_adocao_ifrs:
        marcos.append(LinhaDoTempoMarco(tipo="adocao_ifrs", data=data_adocao_ifrs))

    fim_depreciacao = _get_fim_depreciacao_ultimo_periodo_aberto(db, asset.empresa_id, asset.numero, asset.sub_numero)

    linha: List[LinhaDoTempoItem] = []
    for y in range(start_year, end_year + 1):
        fase = "pos_ifrs"
        if data_adocao_ifrs and date(y, 12, 31) < data_adocao_ifrs:
            fase = "pre_ifrs"

        ev = eventos_por_ano.get(y)
        if ev:
            incremento = ev.get("incremento") or "Manter"
            linha.append(
                LinhaDoTempoItem(
                    ano=y,
                    fase=fase,
                    incremento=incremento,
                    origem="revisoes_itens",
                    periodo_id=ev.get("periodo_id"),
                    periodo_codigo=ev.get("periodo_codigo"),
                    revisao_item_id=ev.get("revisao_item_id"),
                    data_evento=ev.get("data_evento"),
                    data_abertura_periodo=ev.get("data_abertura_periodo"),
                    data_inicio_nova_vida_util=ev.get("data_inicio_nova_vida_util"),
                    data_fim_revisada=ev.get("data_fim_revisada"),
                    vida_util_revisada_meses=ev.get("vida_util_revisada_meses"),
                    motivo=ev.get("motivo"),
                )
            )
        else:
            linha.append(
                LinhaDoTempoItem(
                    ano=y,
                    fase=fase,
                    incremento="Manter",
                    origem="assumido",
                )
            )

    return LinhaDoTempoResponse(
        asset=LinhaDoTempoAssetInfo(
            id=asset.id,
            empresa_id=asset.empresa_id,
            numero=asset.numero,
            sub_numero=asset.sub_numero,
            data_incorporacao=asset.data_aquisicao,
            descricao=asset.descricao,
        ),
        empresa=LinhaDoTempoEmpresaInfo(
            id=asset.empresa_id,
            data_adocao_ifrs=data_adocao_ifrs,
        ),
        marcos=marcos,
        linha_do_tempo=linha,
        fim_depreciacao=fim_depreciacao,
    )

@router.post("/", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
def create_asset(
    asset: AssetCreate,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    # Check for duplicates (numero + sub_numero + empresa)
    existing = db.query(Asset).filter(
        Asset.numero == asset.numero,
        Asset.sub_numero == asset.sub_numero,
        Asset.empresa_id == asset.empresa_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Asset number already exists for this company")
        
    db_asset = Asset(**asset.dict())
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    return db_asset

@router.get("/{asset_id}", response_model=AssetResponse)
def get_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset

@router.put("/{asset_id}", response_model=AssetResponse)
def update_asset(
    asset_id: int,
    asset_update: AssetUpdate,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    db_asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    update_data = asset_update.dict(exclude_unset=True)
    
    # Check for duplicates if identifying fields are changing
    new_numero = update_data.get("numero", db_asset.numero)
    new_sub_numero = update_data.get("sub_numero", db_asset.sub_numero)
    
    if new_numero != db_asset.numero or new_sub_numero != db_asset.sub_numero:
        existing = db.query(Asset).filter(
            Asset.numero == new_numero,
            Asset.sub_numero == new_sub_numero,
            Asset.empresa_id == db_asset.empresa_id,
            Asset.id != asset_id  # Exclude self
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail="Asset number already exists for this company")
    
    for key, value in update_data.items():
        setattr(db_asset, key, value)
        
    db.commit()
    db.refresh(db_asset)
    return db_asset

@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    db_asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    db.delete(db_asset)
    db.commit()
    return None
