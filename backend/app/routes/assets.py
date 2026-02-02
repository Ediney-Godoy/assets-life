from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import date
from decimal import Decimal

from ..database import SessionLocal
from ..models import Asset, Company, ManagementUnit, CentroCusto, ClasseContabil
from ..main import get_db, get_current_user, UsuarioModel

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

@router.get("/", response_model=List[AssetResponse])
def list_assets(
    empresa_id: Optional[int] = None,
    ug_id: Optional[int] = None,
    centro_custo_id: Optional[int] = None,
    classe_id: Optional[int] = None,
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
