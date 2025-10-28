from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from sqlalchemy.orm import Session
import sqlalchemy as sa
from datetime import date

from .database import SessionLocal, engine
from .models import Base as SA_Base, Company as CompanyModel
from .models import Employee as EmployeeModel, Vinculo as VinculoEnum, Status as StatusEnum
from .models import ManagementUnit as UGModel
from .models import Usuario as UsuarioModel
import bcrypt
from .models import RevisaoPeriodo as RevisaoPeriodoModel
from .models import RevisaoItem as RevisaoItemModel
from .models import RevisaoDelegacao as RevisaoDelegacaoModel
from .models import CentroCusto as CentroCustoModel
from fastapi import UploadFile, File
from datetime import datetime

app = FastAPI(title="Asset Life API", version="0.2.0")

origins = [
    "http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176",
    "http://localhost:5180", "http://localhost:5181",
    "http://127.0.0.1:5180", "http://127.0.0.1:5181",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# DB session dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.on_event("startup")
def on_startup():
    # Ensure tables exist for development environments
    try:
        SA_Base.metadata.create_all(bind=engine)
    except Exception as e:
        print("DB init error:", e)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/")
def root():
    return {"message": "Asset Life API"}

# Schemas
class Company(BaseModel):
    id: int
    name: str
    cnpj: str
    branch_type: str
    street: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    cep: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    division: Optional[str] = None
    state_registration: Optional[str] = None
    status: str

    class Config:
        from_attributes = True  # pydantic v2 orm_mode

class CompanyCreate(BaseModel):
    name: str
    cnpj: str
    branch_type: str
    street: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    cep: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    division: Optional[str] = None
    state_registration: Optional[str] = None
    status: str

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    cnpj: Optional[str] = None
    branch_type: Optional[str] = None
    street: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    cep: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    division: Optional[str] = None
    state_registration: Optional[str] = None
    status: Optional[str] = None

# Companies CRUD (DB)
@app.get("/companies", response_model=List[Company])
def list_companies(db: Session = Depends(get_db)):
    return db.query(CompanyModel).all()

@app.get("/companies/{company_id}", response_model=Company)
def get_company(company_id: int, db: Session = Depends(get_db)):
    c = db.query(CompanyModel).filter(CompanyModel.id == company_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Company not found")
    return c

@app.post("/companies", response_model=Company)
def create_company(payload: CompanyCreate, db: Session = Depends(get_db)):
    c = CompanyModel(**payload.dict())
    db.add(c)
    db.commit()
    db.refresh(c)
    return c

@app.put("/companies/{company_id}", response_model=Company)
def update_company(company_id: int, payload: CompanyUpdate, db: Session = Depends(get_db)):
    c = db.query(CompanyModel).filter(CompanyModel.id == company_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Company not found")
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return c

@app.delete("/companies/{company_id}")
def delete_company(company_id: int, db: Session = Depends(get_db)):
    c = db.query(CompanyModel).filter(CompanyModel.id == company_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Company not found")
    db.delete(c)
    db.commit()
    return {"deleted": True}

# Schemas de Colaboradores
class Colaborador(BaseModel):
    id: int
    full_name: str
    cpf: str
    matricula: Optional[str] = None
    cargo_funcao: Optional[str] = None
    empresa_id: int
    ug_id: Optional[int] = None
    centro_custo_id: Optional[int] = None
    tipo_vinculo: VinculoEnum
    data_admissao: date
    data_desligamento: Optional[date] = None
    telefone: Optional[str] = None
    email_corporativo: Optional[EmailStr] = None
    endereco: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    status: StatusEnum
    observacoes: Optional[str] = None

    class Config:
        from_attributes = True

class ColaboradorCreate(BaseModel):
    full_name: str
    cpf: str
    matricula: Optional[str] = None
    cargo_funcao: Optional[str] = None
    empresa_id: int
    ug_id: Optional[int] = None
    centro_custo_id: Optional[int] = None
    tipo_vinculo: VinculoEnum
    data_admissao: date
    data_desligamento: Optional[date] = None
    telefone: Optional[str] = None
    email_corporativo: Optional[EmailStr] = None
    endereco: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    status: StatusEnum = StatusEnum.ativo
    observacoes: Optional[str] = None

class ColaboradorUpdate(BaseModel):
    full_name: Optional[str] = None
    cpf: Optional[str] = None
    matricula: Optional[str] = None
    cargo_funcao: Optional[str] = None
    empresa_id: Optional[int] = None
    ug_id: Optional[int] = None
    centro_custo_id: Optional[int] = None
    tipo_vinculo: Optional[VinculoEnum] = None
    data_admissao: Optional[date] = None
    data_desligamento: Optional[date] = None
    telefone: Optional[str] = None
    email_corporativo: Optional[EmailStr] = None
    endereco: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    status: Optional[StatusEnum] = None
    observacoes: Optional[str] = None

# CRUD de Colaboradores
@app.get("/colaboradores", response_model=List[Colaborador])
def list_colaboradores(db: Session = Depends(get_db)):
    return db.query(EmployeeModel).all()

@app.get("/colaboradores/{colab_id}", response_model=Colaborador)
def get_colaborador(colab_id: int, db: Session = Depends(get_db)):
    c = db.query(EmployeeModel).filter(EmployeeModel.id == colab_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Colaborador não encontrado")
    return c

@app.post("/colaboradores", response_model=Colaborador)
def create_colaborador(payload: ColaboradorCreate, db: Session = Depends(get_db)):
    c = EmployeeModel(**payload.dict())
    # validar empresa existente
    if not db.query(CompanyModel).filter(CompanyModel.id == c.empresa_id).first():
        raise HTTPException(status_code=400, detail="Empresa inválida")
    db.add(c)
    db.commit()
    db.refresh(c)
    return c

@app.put("/colaboradores/{colab_id}", response_model=Colaborador)
def update_colaborador(colab_id: int, payload: ColaboradorUpdate, db: Session = Depends(get_db)):
    c = db.query(EmployeeModel).filter(EmployeeModel.id == colab_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Colaborador não encontrado")
    # se empresa_id foi enviado, valida
    data = payload.dict(exclude_unset=True)
    if "empresa_id" in data and data["empresa_id"] is not None:
        if not db.query(CompanyModel).filter(CompanyModel.id == data["empresa_id"]).first():
            raise HTTPException(status_code=400, detail="Empresa inválida")
    for k, v in data.items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return c

@app.delete("/colaboradores/{colab_id}")
def delete_colaborador(colab_id: int, db: Session = Depends(get_db)):
    c = db.query(EmployeeModel).filter(EmployeeModel.id == colab_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Colaborador não encontrado")
    db.delete(c)
    db.commit()
    return {"deleted": True}

# -----------------------------
# Unidades Gerenciais (UG) - Schemas e CRUD
# -----------------------------
class UG(BaseModel):
    id: int
    codigo: str
    nome: str
    tipo_unidade: str
    nivel_hierarquico: str
    empresa_id: int
    responsavel_id: Optional[int] = None
    ug_superior_id: Optional[int] = None
    status: str

    class Config:
        from_attributes = True

class UGCreate(BaseModel):
    nome: str
    tipo_unidade: str
    nivel_hierarquico: str
    empresa_id: int
    responsavel_id: Optional[int] = None
    ug_superior_id: Optional[int] = None
    status: str = "Ativo"

class UGUpdate(BaseModel):
    nome: Optional[str] = None
    tipo_unidade: Optional[str] = None
    nivel_hierarquico: Optional[str] = None
    empresa_id: Optional[int] = None
    responsavel_id: Optional[int] = None
    ug_superior_id: Optional[int] = None
    status: Optional[str] = None

# Geração automática do código hierárquico
from sqlalchemy import func

def generate_codigo(db: Session, parent_id: Optional[int]) -> str:
    # raiz (sem pai): usa numeração sequencial no nível raiz
    if parent_id is None:
        count = db.query(func.count(UGModel.id)).filter(UGModel.ug_superior_id == None).scalar() or 0
        return f"{count + 1}"
    # com pai: prefixo é o código do pai e sufixo é sequencial dos filhos
    parent = db.query(UGModel).filter(UGModel.id == parent_id).first()
    if not parent:
        raise HTTPException(status_code=400, detail="UG superior inválida")
    siblings_count = db.query(func.count(UGModel.id)).filter(UGModel.ug_superior_id == parent_id).scalar() or 0
    return f"{parent.codigo}.{siblings_count + 1}"

# Validações de regras de negócio
VALID_LEVELS = {"CEO", "Diretoria", "Gerência Geral", "Gerência", "Coordenação", "Operacional"}
VALID_TYPES = {"Administrativa", "Produtiva", "Apoio", "Auxiliares"}

@app.get("/unidades_gerenciais", response_model=List[UG])
def list_ugs(db: Session = Depends(get_db)):
    return db.query(UGModel).order_by(UGModel.codigo).all()

@app.get("/unidades_gerenciais/{ug_id}", response_model=UG)
def get_ug(ug_id: int, db: Session = Depends(get_db)):
    c = db.query(UGModel).filter(UGModel.id == ug_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="UG não encontrada")
    return c

@app.post("/unidades_gerenciais", response_model=UG)
def create_ug(payload: UGCreate, db: Session = Depends(get_db)):
    data = payload.dict()

    # validações de negócio
    if not data.get("nome"):
        raise HTTPException(status_code=400, detail="Nome é obrigatório")
    if data.get("nivel_hierarquico") not in VALID_LEVELS:
        raise HTTPException(status_code=400, detail="Nível hierárquico inválido")
    if data.get("tipo_unidade") not in VALID_TYPES:
        raise HTTPException(status_code=400, detail="Tipo de unidade inválido")

    # CEO não pode ter UG superior
    if data["nivel_hierarquico"] == "CEO" and data.get("ug_superior_id"):
        raise HTTPException(status_code=400, detail="UG superior não é permitido para nível CEO")
    # outros níveis devem ter pai
    if data["nivel_hierarquico"] != "CEO" and not data.get("ug_superior_id"):
        raise HTTPException(status_code=400, detail="UG superior é obrigatório exceto para CEO")

    # valida empresa existente
    if not db.query(CompanyModel).filter(CompanyModel.id == data["empresa_id"]).first():
        raise HTTPException(status_code=400, detail="Empresa inválida")
    # valida responsável se enviado
    if data.get("responsavel_id") and not db.query(EmployeeModel).filter(EmployeeModel.id == data["responsavel_id"]).first():
        raise HTTPException(status_code=400, detail="Responsável inválido")

    codigo = generate_codigo(db, data.get("ug_superior_id"))
    c = UGModel(codigo=codigo, **data)
    db.add(c)
    db.commit()
    db.refresh(c)
    return c

@app.put("/unidades_gerenciais/{ug_id}", response_model=UG)
def update_ug(ug_id: int, payload: UGUpdate, db: Session = Depends(get_db)):
    c = db.query(UGModel).filter(UGModel.id == ug_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="UG não encontrada")

    data = payload.dict(exclude_unset=True)

    # validações básicas se enviados
    if "nivel_hierarquico" in data and data["nivel_hierarquico"] not in VALID_LEVELS:
        raise HTTPException(status_code=400, detail="Nível hierárquico inválido")
    if "tipo_unidade" in data and data["tipo_unidade"] not in VALID_TYPES:
        raise HTTPException(status_code=400, detail="Tipo de unidade inválido")

    # regra de UG superior vs nível
    if data.get("nivel_hierarquico") == "CEO" and (data.get("ug_superior_id") or c.ug_superior_id):
        raise HTTPException(status_code=400, detail="UG superior não é permitido para nível CEO")

    if "empresa_id" in data and data["empresa_id"] is not None:
        if not db.query(CompanyModel).filter(CompanyModel.id == data["empresa_id"]).first():
            raise HTTPException(status_code=400, detail="Empresa inválida")

    if "responsavel_id" in data and data["responsavel_id"] is not None:
        if not db.query(EmployeeModel).filter(EmployeeModel.id == data["responsavel_id"]).first():
            raise HTTPException(status_code=400, detail="Responsável inválido")

    # não recalculamos código automaticamente em update para evitar quebra
    for k, v in data.items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return c

@app.delete("/unidades_gerenciais/{ug_id}")
def delete_ug(ug_id: int, db: Session = Depends(get_db)):
    c = db.query(UGModel).filter(UGModel.id == ug_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="UG não encontrada")
    db.delete(c)
    db.commit()
    return {"deleted": True}

# -----------------------------
# Centros de Custos - Schemas e Endpoints
# -----------------------------
class CentroCusto(BaseModel):
    id: int
    codigo: str
    nome: str
    empresa_id: int
    ug_id: int
    responsavel_id: Optional[int] = None
    observacoes: Optional[str] = None
    data_criacao: Optional[datetime] = None
    criado_por: Optional[int] = None
    status: str
    class Config:
        from_attributes = True

class CentroCustoCreate(BaseModel):
    nome: str
    empresa_id: int
    ug_id: int
    responsavel_id: Optional[int] = None
    observacoes: Optional[str] = None
    criado_por: Optional[int] = None
    status: str = "Ativo"

@app.get("/centros_custos", response_model=List[CentroCusto])
def list_centros_custos(
    empresa_id: Optional[int] = None,
    ug_id: Optional[int] = None,
    nome: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(CentroCustoModel)
    if empresa_id:
        q = q.filter(CentroCustoModel.empresa_id == empresa_id)
    if ug_id:
        q = q.filter(CentroCustoModel.ug_id == ug_id)
    if status:
        q = q.filter(CentroCustoModel.status == status)
    if nome:
        q = q.filter(sa.func.lower(CentroCustoModel.nome).like(f"%{nome.lower()}%"))
    return q.order_by(CentroCustoModel.codigo).all()

@app.get("/centros_custos/{cc_id}", response_model=CentroCusto)
def get_centro_custo(cc_id: int, db: Session = Depends(get_db)):
    c = db.query(CentroCustoModel).filter(CentroCustoModel.id == cc_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Centro de Custos não encontrado")
    return c

@app.post("/centros_custos", response_model=CentroCusto)
def create_centro_custo(payload: CentroCustoCreate, db: Session = Depends(get_db)):
    data = payload.dict()

    # valida empresa e UG
    empresa = db.query(CompanyModel).filter(CompanyModel.id == data["empresa_id"]).first()
    if not empresa:
        raise HTTPException(status_code=400, detail="Empresa inválida")

    ug = db.query(UGModel).filter(UGModel.id == data["ug_id"]).first()
    if not ug:
        raise HTTPException(status_code=400, detail="UG inválida")

    if ug.empresa_id != empresa.id:
        raise HTTPException(status_code=400, detail="UG não pertence à empresa informada")

    # valida responsável se informado
    if data.get("responsavel_id"):
        if not db.query(EmployeeModel).filter(EmployeeModel.id == data["responsavel_id"]).first():
            raise HTTPException(status_code=400, detail="Responsável inválido")

    # evitar duplicidade de nome dentro da mesma UG
    existing = (
        db.query(CentroCustoModel)
        .filter(sa.func.lower(CentroCustoModel.nome) == data["nome"].lower())
        .filter(CentroCustoModel.ug_id == data["ug_id"])
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Já existe um Centro de Custos com este nome na UG")

    # geração automática de código: <codigo_ug>.<sequencial>
    ultimo = (
        db.query(CentroCustoModel)
        .filter(CentroCustoModel.ug_id == data["ug_id"]) 
        .order_by(CentroCustoModel.id.desc())
        .first()
    )
    sequencial = 1
    if ultimo and ultimo.codigo:
        try:
            sequencial = int(ultimo.codigo.split('.')[-1]) + 1
        except Exception:
            sequencial = 1
    codigo = f"{ug.codigo}.{sequencial:03d}"

    c = CentroCustoModel(
        codigo=codigo,
        nome=data["nome"],
        empresa_id=data["empresa_id"],
        ug_id=data["ug_id"],
        responsavel_id=data.get("responsavel_id"),
        observacoes=data.get("observacoes"),
        criado_por=data.get("criado_por"),
        status=data.get("status", "Ativo"),
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return c

# -----------------------------
# Usuários - Schemas e CRUD
# -----------------------------
class Usuario(BaseModel):
    id: int
    codigo: str
    nome_completo: str
    email: EmailStr
    cpf: str
    nome_usuario: str
    data_nascimento: Optional[date] = None
    empresa_id: Optional[int] = None
    ug_id: Optional[int] = None
    centro_custo_id: Optional[int] = None
    status: str
    class Config:
        from_attributes = True

class UsuarioCreate(BaseModel):
    nome_completo: str
    email: EmailStr
    senha: str
    confirmacao_senha: str
    cpf: str
    nome_usuario: str
    data_nascimento: Optional[date] = None
    empresa_id: Optional[int] = None
    ug_id: Optional[int] = None
    centro_custo_id: Optional[int] = None
    status: str = "Ativo"

class UsuarioUpdate(BaseModel):
    nome_completo: Optional[str] = None
    email: Optional[EmailStr] = None
    senha: Optional[str] = None
    confirmacao_senha: Optional[str] = None
    cpf: Optional[str] = None
    nome_usuario: Optional[str] = None
    data_nascimento: Optional[date] = None
    empresa_id: Optional[int] = None
    ug_id: Optional[int] = None
    centro_custo_id: Optional[int] = None
    status: Optional[str] = None


def _generate_user_codigo(db: Session) -> str:
    last = db.query(UsuarioModel.id).order_by(UsuarioModel.id.desc()).first()
    next_num = (last[0] if last else 0) + 1
    return f"{next_num:06d}"


@app.get("/usuarios", response_model=List[Usuario])
def list_usuarios(db: Session = Depends(get_db)):
    return db.query(UsuarioModel).order_by(UsuarioModel.id).all()


@app.get("/usuarios/{user_id}", response_model=Usuario)
def get_usuario(user_id: int, db: Session = Depends(get_db)):
    u = db.query(UsuarioModel).filter(UsuarioModel.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return u


@app.post("/usuarios", response_model=Usuario)
def create_usuario(payload: UsuarioCreate, db: Session = Depends(get_db)):
    if payload.senha != payload.confirmacao_senha:
        raise HTTPException(status_code=400, detail="Confirmação de senha não confere")
    # checa duplicidades
    if db.query(UsuarioModel).filter(UsuarioModel.email == payload.email).first():
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")
    if db.query(UsuarioModel).filter(UsuarioModel.cpf == payload.cpf).first():
        raise HTTPException(status_code=400, detail="CPF já cadastrado")
    if db.query(UsuarioModel).filter(UsuarioModel.nome_usuario == payload.nome_usuario).first():
        raise HTTPException(status_code=400, detail="Nome de usuário já cadastrado")
    # valida FKs se enviados
    if payload.empresa_id is not None:
        if not db.query(CompanyModel).filter(CompanyModel.id == payload.empresa_id).first():
            raise HTTPException(status_code=400, detail="Empresa inválida")
    if payload.ug_id is not None:
        if not db.query(UGModel).filter(UGModel.id == payload.ug_id).first():
            raise HTTPException(status_code=400, detail="UG inválida")

    senha_hash = bcrypt.hashpw(payload.senha.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    codigo = _generate_user_codigo(db)
    u = UsuarioModel(
        codigo=codigo,
        nome_completo=payload.nome_completo,
        email=payload.email,
        senha_hash=senha_hash,
        cpf=payload.cpf,
        nome_usuario=payload.nome_usuario,
        data_nascimento=payload.data_nascimento,
        empresa_id=payload.empresa_id,
        ug_id=payload.ug_id,
        centro_custo_id=payload.centro_custo_id,
        status=payload.status,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@app.put("/usuarios/{user_id}", response_model=Usuario)
def update_usuario(user_id: int, payload: UsuarioUpdate, db: Session = Depends(get_db)):
    u = db.query(UsuarioModel).filter(UsuarioModel.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    data = payload.dict(exclude_unset=True)

    # valida duplicidades se alterando
    if "email" in data:
        exists = db.query(UsuarioModel).filter(UsuarioModel.email == data["email"], UsuarioModel.id != user_id).first()
        if exists:
            raise HTTPException(status_code=400, detail="E-mail já cadastrado")
    if "cpf" in data:
        exists = db.query(UsuarioModel).filter(UsuarioModel.cpf == data["cpf"], UsuarioModel.id != user_id).first()
        if exists:
            raise HTTPException(status_code=400, detail="CPF já cadastrado")
    if "nome_usuario" in data:
        exists = db.query(UsuarioModel).filter(UsuarioModel.nome_usuario == data["nome_usuario"], UsuarioModel.id != user_id).first()
        if exists:
            raise HTTPException(status_code=400, detail="Nome de usuário já cadastrado")

    # valida FKs
    if "empresa_id" in data and data["empresa_id"] is not None:
        if not db.query(CompanyModel).filter(CompanyModel.id == data["empresa_id"]).first():
            raise HTTPException(status_code=400, detail="Empresa inválida")
    if "ug_id" in data and data["ug_id"] is not None:
        if not db.query(UGModel).filter(UGModel.id == data["ug_id"]).first():
            raise HTTPException(status_code=400, detail="UG inválida")

    # tratar senha
    if data.get("senha") or data.get("confirmacao_senha"):
        if data.get("senha") != data.get("confirmacao_senha"):
            raise HTTPException(status_code=400, detail="Confirmação de senha não confere")
        u.senha_hash = bcrypt.hashpw(data["senha"].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        # remove campos transitórios
        data.pop("senha", None)
        data.pop("confirmacao_senha", None)

    for k, v in data.items():
        setattr(u, k, v)

    db.commit()
    db.refresh(u)
    return u


@app.delete("/usuarios/{user_id}")
def delete_usuario(user_id: int, db: Session = Depends(get_db)):
    u = db.query(UsuarioModel).filter(UsuarioModel.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    db.delete(u)
    db.commit()
    return {"deleted": True}

class RevisaoPeriodo(BaseModel):
    id: int
    codigo: str
    descricao: str
    data_abertura: date
    data_fechamento_prevista: date
    data_fechamento: Optional[date] = None
    empresa_id: int
    ug_id: Optional[int] = None
    responsavel_id: int
    status: str
    observacoes: Optional[str] = None
    criado_em: datetime
    class Config:
        from_attributes = True

class RevisaoPeriodoCreate(BaseModel):
    descricao: str
    data_abertura: date
    data_fechamento_prevista: date
    empresa_id: int
    ug_id: Optional[int] = None
    responsavel_id: int
    status: str = "Aberto"
    observacoes: Optional[str] = None

class RevisaoPeriodoUpdate(BaseModel):
    descricao: Optional[str] = None
    data_abertura: Optional[date] = None
    data_fechamento_prevista: Optional[date] = None
    data_fechamento: Optional[date] = None
    empresa_id: Optional[int] = None
    ug_id: Optional[int] = None
    responsavel_id: Optional[int] = None
    status: Optional[str] = None
    observacoes: Optional[str] = None

class RevisaoItemOut(BaseModel):
    id: int
    periodo_id: int
    numero_imobilizado: str
    sub_numero: str
    descricao: str
    data_inicio_depreciacao: date
    data_fim_depreciacao: Optional[date] = None
    valor_aquisicao: float
    depreciacao_acumulada: float
    valor_contabil: float
    centro_custo: str
    classe: str
    conta_contabil: str
    descricao_conta_contabil: str
    vida_util_anos: int
    vida_util_periodos: int
    auxiliar2: Optional[str] = None
    auxiliar3: Optional[str] = None
    status: str
    criado_em: datetime
    class Config:
        from_attributes = True

ALLOWED_STATUS = {"Aberto", "Em Andamento", "Fechado"}

def _generate_revisao_codigo(db: Session, ano: int) -> str:
    prefix = f"RV{ano}-"
    # conta existentes do ano
    count = (
        db.query(RevisaoPeriodoModel)
        .filter(RevisaoPeriodoModel.codigo.like(f"{prefix}%"))
        .count()
    )
    return f"{prefix}{count + 1:02d}"

@app.get("/revisoes/periodos", response_model=List[RevisaoPeriodo])
def list_revisoes(db: Session = Depends(get_db)):
    return db.query(RevisaoPeriodoModel).order_by(RevisaoPeriodoModel.id.desc()).all()

@app.post("/revisoes/periodos", response_model=RevisaoPeriodo)
def create_revisao(payload: RevisaoPeriodoCreate, db: Session = Depends(get_db)):
    if payload.status not in ALLOWED_STATUS:
        raise HTTPException(status_code=400, detail="Status inválido")
    # valida responsável
    if not db.query(UsuarioModel).filter(UsuarioModel.id == payload.responsavel_id).first():
        raise HTTPException(status_code=400, detail="Responsável inválido")
    # valida empresa
    if not db.query(CompanyModel).filter(CompanyModel.id == payload.empresa_id).first():
        raise HTTPException(status_code=400, detail="Empresa inválida")
    # valida UG se fornecida
    if payload.ug_id is not None:
        if not db.query(UGModel).filter(UGModel.id == payload.ug_id).first():
            raise HTTPException(status_code=400, detail="UG inválida")
    ano = payload.data_abertura.year
    codigo = _generate_revisao_codigo(db, ano)
    r = RevisaoPeriodoModel(
        codigo=codigo,
        descricao=payload.descricao,
        data_abertura=payload.data_abertura,
        data_fechamento_prevista=payload.data_fechamento_prevista,
        empresa_id=payload.empresa_id,
        ug_id=payload.ug_id,
        responsavel_id=payload.responsavel_id,
        status=payload.status,
        observacoes=payload.observacoes,
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return r

@app.put("/revisoes/periodos/{rev_id}", response_model=RevisaoPeriodo)
def update_revisao(rev_id: int, payload: RevisaoPeriodoUpdate, db: Session = Depends(get_db)):
    r = db.query(RevisaoPeriodoModel).filter(RevisaoPeriodoModel.id == rev_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Período não encontrado")
    data = payload.dict(exclude_unset=True)
    if "status" in data and data["status"] not in ALLOWED_STATUS:
        raise HTTPException(status_code=400, detail="Status inválido")
    if "responsavel_id" in data and data["responsavel_id"] is not None:
        if not db.query(UsuarioModel).filter(UsuarioModel.id == data["responsavel_id"]).first():
            raise HTTPException(status_code=400, detail="Responsável inválido")
    if "empresa_id" in data and data["empresa_id"] is not None:
        if not db.query(CompanyModel).filter(CompanyModel.id == data["empresa_id"]).first():
            raise HTTPException(status_code=400, detail="Empresa inválida")
    if "ug_id" in data and data["ug_id"] is not None:
        if not db.query(UGModel).filter(UGModel.id == data["ug_id"]).first():
            raise HTTPException(status_code=400, detail="UG inválida")
    for k, v in data.items():
        setattr(r, k, v)
    db.commit()
    db.refresh(r)
    return r

@app.delete("/revisoes/periodos/{rev_id}")
def delete_revisao(rev_id: int, db: Session = Depends(get_db)):
    r = db.query(RevisaoPeriodoModel).filter(RevisaoPeriodoModel.id == rev_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Período não encontrado")
    db.delete(r)
    db.commit()
    return {"deleted": True}

@app.post("/revisoes/fechar/{rev_id}", response_model=RevisaoPeriodo)
def fechar_revisao(rev_id: int, db: Session = Depends(get_db)):
    r = db.query(RevisaoPeriodoModel).filter(RevisaoPeriodoModel.id == rev_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Período não encontrado")
    r.status = "Fechado"
    r.data_fechamento = date.today()
    db.commit()
    db.refresh(r)
    return r

@app.post("/revisoes/upload_base/{rev_id}")
def upload_base(rev_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    r = db.query(RevisaoPeriodoModel).filter(RevisaoPeriodoModel.id == rev_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Período não encontrado")
    if r.status == "Fechado":
        raise HTTPException(status_code=400, detail="Período está fechado")

    filename = (file.filename or "").lower()
    if not (filename.endswith(".csv") or filename.endswith(".xlsx")):
        raise HTTPException(status_code=400, detail="Formato inválido. Envie .csv ou .xlsx")

    required = {
        "numero_imobilizado",
        "sub_numero",
        "data_inicio_depreciacao",
        "descricao",
        "valor_aquisicao",
        "depreciacao_acumulada",
        "valor_contabil",
        "centro_custo",
        "classe",
        "conta_contabil",
        "descricao_conta_contabil",
        "vida_util_anos",
        "vida_util_periodos",
    }
    optional = {"data_fim_depreciacao", "auxiliar2", "auxiliar3"}

    def norm_key(k: str) -> str:
        import re, unicodedata
        def clean(s: str) -> str:
            s = (s or "").strip().lower()
            s = unicodedata.normalize('NFD', s)
            s = ''.join(ch for ch in s if unicodedata.category(ch) != 'Mn')  # remove acentos
            s = s.replace('º', 'o').replace('ª', 'a')
            s = re.sub(r'[^a-z0-9]+', '_', s)  # troca não alfanum por _
            s = re.sub(r'_+', '_', s).strip('_')
            return s
        nk = clean(k)
        synonyms = {
            'no_imobilizado': 'numero_imobilizado',
            'n_imobilizado': 'numero_imobilizado',
            'numero_do_imobilizado': 'numero_imobilizado',
            'numero_imobilizado': 'numero_imobilizado',
            'sub_no': 'sub_numero',
            'sub_numero': 'sub_numero',
            'data_inicio_da_depreciacao': 'data_inicio_depreciacao',
            'data_inicio_de_depreciacao': 'data_inicio_depreciacao',
            'data_inicio_depreciacao': 'data_inicio_depreciacao',
            'descricao': 'descricao',
            'valor_aquisicao': 'valor_aquisicao',
            'depreciacao_acum': 'depreciacao_acumulada',
            'depreciacao_acumulada': 'depreciacao_acumulada',
            'valor_contabil': 'valor_contabil',
            'centro_custos': 'centro_custo',
            'centro_de_custos': 'centro_custo',
            'centro_custo': 'centro_custo',
            'classe': 'classe',
            'conta_contabil': 'conta_contabil',
            'desc_conta_contabil': 'descricao_conta_contabil',
            'descricao_conta_contabil': 'descricao_conta_contabil',
            'vida_util_anos': 'vida_util_anos',
            'vida_util_periodos': 'vida_util_periodos',
            'data_fim_depreciacao': 'data_fim_depreciacao',
        }
        return synonyms.get(nk, nk)

    from decimal import Decimal
    import csv, io
    from datetime import datetime as dt
    import calendar

    def parse_date(s: str) -> date:
        s = (s or "").strip()
        if not s:
            return None
        for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%m/%d/%Y"):
            try:
                return dt.strptime(s, fmt).date()
            except Exception:
                pass
        raise ValueError(f"Data inválida: {s}")

    def add_months(d: date, months: int) -> date:
        y = d.year + (d.month - 1 + months) // 12
        m = (d.month - 1 + months) % 12 + 1
        last_day = calendar.monthrange(y, m)[1]
        day = min(d.day, last_day)
        return date(y, m, day)

    imported = 0
    rejected = 0
    errors_log = []

    try:
        content = file.file.read()
        rows = []
        headers = []
        if filename.endswith(".csv"):
            text = content.decode("utf-8", errors="replace")
            try:
                dialect = csv.Sniffer().sniff(text.splitlines()[0])
            except Exception:
                dialect = csv.excel
            reader = csv.DictReader(io.StringIO(text), dialect=dialect)
            headers = [norm_key(h) for h in reader.fieldnames or []]
            for row in reader:
                rows.append({norm_key(k): v for k, v in row.items()})
        else:
            try:
                from openpyxl import load_workbook
            except Exception:
                raise HTTPException(status_code=500, detail="Dependência 'openpyxl' não instalada para XLSX")
            wb = load_workbook(io.BytesIO(content), read_only=True)
            ws = wb.active
            header_row = next(ws.iter_rows(min_row=1, max_row=1, values_only=True))
            headers = [norm_key(str(h)) for h in header_row]
            for r in ws.iter_rows(min_row=2, values_only=True):
                row = {}
                for idx, h in enumerate(headers):
                    row[h] = r[idx] if idx < len(r) else None
                rows.append(row)

        missing = [h for h in sorted(required) if h not in headers]
        if missing:
            raise HTTPException(status_code=400, detail=f"Cabeçalhos ausentes: {', '.join(missing)}")

        # Limpa itens anteriores (opcional). Comentado por segurança.
        # db.query(RevisaoItemModel).filter(RevisaoItemModel.periodo_id == rev_id).delete()

        for idx, row in enumerate(rows, start=2):  # start=2 considera header na linha 1
            try:
                numero_imobilizado = str(row.get("numero_imobilizado", "")).strip()
                sub_numero = str(row.get("sub_numero", "")).strip()
                descricao = str(row.get("descricao", "")).strip()
                if not (numero_imobilizado and sub_numero and descricao):
                    raise ValueError("Campos chave vazios")

                data_inicio = row.get("data_inicio_depreciacao")
                data_inicio = parse_date(str(data_inicio)) if not isinstance(data_inicio, date) else data_inicio

                vida_util_anos = int(str(row.get("vida_util_anos", "")).strip())
                vida_util_periodos = int(str(row.get("vida_util_periodos", "")).strip())

                def parse_decimal(x):
                    x = (str(x).replace(".", "").replace(",", ".") if x is not None else "0")
                    return Decimal(x or "0")

                valor_aquisicao = parse_decimal(row.get("valor_aquisicao"))
                depreciacao_acumulada = parse_decimal(row.get("depreciacao_acumulada"))
                valor_contabil = parse_decimal(row.get("valor_contabil"))

                centro_custo = str(row.get("centro_custo", "")).strip()
                classe = str(row.get("classe", "")).strip()
                conta_contabil = str(row.get("conta_contabil", "")).strip()
                descricao_cc = str(row.get("descricao_conta_contabil", "")).strip()

                data_fim = row.get("data_fim_depreciacao")
                data_fim = parse_date(str(data_fim)) if (data_fim and not isinstance(data_fim, date)) else data_fim
                if not data_fim and data_inicio and vida_util_periodos:
                    data_fim = add_months(data_inicio, vida_util_periodos)

                item = RevisaoItemModel(
                    periodo_id=rev_id,
                    numero_imobilizado=numero_imobilizado,
                    sub_numero=sub_numero,
                    descricao=descricao,
                    data_inicio_depreciacao=data_inicio,
                    data_fim_depreciacao=data_fim,
                    valor_aquisicao=valor_aquisicao,
                    depreciacao_acumulada=depreciacao_acumulada,
                    valor_contabil=valor_contabil,
                    centro_custo=centro_custo,
                    classe=classe,
                    conta_contabil=conta_contabil,
                    descricao_conta_contabil=descricao_cc,
                    vida_util_anos=vida_util_anos,
                    vida_util_periodos=vida_util_periodos,
                    auxiliar2=str(row.get("auxiliar2", "")) or None,
                    auxiliar3=str(row.get("auxiliar3", "")) or None,
                    status="Pendente",
                )
                db.add(item)
                imported += 1
            except Exception as ex:
                rejected += 1
                errors_log.append(f"Linha {idx}: {ex}")

        db.commit()
        return {
            "periodo_id": rev_id,
            "importados": imported,
            "rejeitados": rejected,
            "erros": errors_log,
        }
    finally:
        try:
            file.file.close()
        except Exception:
            pass
@app.get("/revisoes/itens/{rev_id}", response_model=List[RevisaoItemOut])
def list_revisao_itens(rev_id: int, db: Session = Depends(get_db)):
    periodo = db.query(RevisaoPeriodoModel).filter(RevisaoPeriodoModel.id == rev_id).first()
    if not periodo:
        raise HTTPException(status_code=404, detail="Período de revisão não encontrado")

    items = (
        db.query(RevisaoItemModel)
        .filter(RevisaoItemModel.periodo_id == rev_id)
        .order_by(RevisaoItemModel.id.desc())
        .all()
    )

    # conversão Numeric -> float
    result = []
    for i in items:
        result.append(
            RevisaoItemOut(
                id=i.id,
                periodo_id=i.periodo_id,
                numero_imobilizado=i.numero_imobilizado,
                sub_numero=i.sub_numero,
                descricao=i.descricao,
                data_inicio_depreciacao=i.data_inicio_depreciacao,
                data_fim_depreciacao=i.data_fim_depreciacao,
                valor_aquisicao=float(i.valor_aquisicao) if i.valor_aquisicao is not None else 0.0,
                depreciacao_acumulada=float(i.depreciacao_acumulada) if i.depreciacao_acumulada is not None else 0.0,
                valor_contabil=float(i.valor_contabil) if i.valor_contabil is not None else 0.0,
                centro_custo=i.centro_custo,
                classe=i.classe,
                conta_contabil=i.conta_contabil,
                descricao_conta_contabil=i.descricao_conta_contabil,
                vida_util_anos=i.vida_util_anos,
                vida_util_periodos=i.vida_util_periodos,
                auxiliar2=i.auxiliar2,
                auxiliar3=i.auxiliar3,
                status=i.status,
                criado_em=i.criado_em,
            )
        )
    return result

# -----------------------------
# Delegações de Revisão
# -----------------------------
class DelegacaoOut(BaseModel):
    id: int
    periodo_id: int
    ativo_id: int
    revisor_id: int
    atribuido_por: int
    data_atribuicao: datetime
    status: str
    numero_imobilizado: Optional[str] = None
    descricao: Optional[str] = None
    revisor_nome: Optional[str] = None

class DelegacaoCreate(BaseModel):
    periodo_id: int
    ativo_id: int
    revisor_id: int
    atribuido_por: int

@app.get("/revisoes/delegacoes/{rev_id}", response_model=List[DelegacaoOut])
def list_revisao_delegacoes(rev_id: int, db: Session = Depends(get_db)):
    periodo = db.query(RevisaoPeriodoModel).filter(RevisaoPeriodoModel.id == rev_id).first()
    if not periodo:
        raise HTTPException(status_code=404, detail="Período de revisão não encontrado")

    delegs = db.query(RevisaoDelegacaoModel).filter(RevisaoDelegacaoModel.periodo_id == rev_id).all()
    result: List[DelegacaoOut] = []
    for d in delegs:
        item = db.query(RevisaoItemModel).filter(RevisaoItemModel.id == d.ativo_id).first()
        revisor = db.query(UsuarioModel).filter(UsuarioModel.id == d.revisor_id).first()
        result.append(
            DelegacaoOut(
                id=d.id,
                periodo_id=d.periodo_id,
                ativo_id=d.ativo_id,
                revisor_id=d.revisor_id,
                atribuido_por=d.atribuido_por,
                data_atribuicao=d.data_atribuicao,
                status=d.status,
                numero_imobilizado=item.numero_imobilizado if item else None,
                descricao=item.descricao if item else None,
                revisor_nome=revisor.nome_completo if revisor else None,
            )
        )
    return result

@app.post("/revisoes/delegacoes", response_model=DelegacaoOut)
def create_revisao_delegacao(payload: DelegacaoCreate, db: Session = Depends(get_db)):
    periodo = db.query(RevisaoPeriodoModel).filter(RevisaoPeriodoModel.id == payload.periodo_id).first()
    if not periodo:
        raise HTTPException(status_code=404, detail="Período de revisão não encontrado")

    item = db.query(RevisaoItemModel).filter(RevisaoItemModel.id == payload.ativo_id).first()
    if not item or item.periodo_id != payload.periodo_id:
        raise HTTPException(status_code=400, detail="Ativo inválido para o período")

    revisor = db.query(UsuarioModel).filter(UsuarioModel.id == payload.revisor_id).first()
    if not revisor:
        raise HTTPException(status_code=400, detail="Revisor inválido")

    # Regra de negócio: delegar o grupo inteiro (ativo principal e incorporações)
    group_items = (
        db.query(RevisaoItemModel)
        .filter(
            RevisaoItemModel.periodo_id == payload.periodo_id,
            RevisaoItemModel.numero_imobilizado == item.numero_imobilizado,
        )
        .all()
    )
    group_ids = [gi.id for gi in group_items]

    # Delegações ativas já existentes para o grupo
    existing_group_delegs = (
        db.query(RevisaoDelegacaoModel)
        .filter(
            RevisaoDelegacaoModel.periodo_id == payload.periodo_id,
            RevisaoDelegacaoModel.ativo_id.in_(group_ids),
            RevisaoDelegacaoModel.status == 'Ativo',
        )
        .all()
    )

    # Se já houver delegações com revisor diferente, impedir separação
    existing_revisors = {d.revisor_id for d in existing_group_delegs}
    if len(existing_revisors) > 0 and existing_revisors != {payload.revisor_id}:
        raise HTTPException(
            status_code=400,
            detail="Regra: ativo principal e incorporações devem ser revisados pelo mesmo revisor"
        )

    # Impedir duplicidade para o item solicitado
    if any(d.ativo_id == payload.ativo_id for d in existing_group_delegs):
        raise HTTPException(status_code=400, detail="Ativo já delegado")

    # Criar delegações para todo o grupo que ainda não possui
    created_for_requested = None
    for gi in group_items:
        if any(d.ativo_id == gi.id for d in existing_group_delegs):
            continue
        d = RevisaoDelegacaoModel(
            periodo_id=payload.periodo_id,
            ativo_id=gi.id,
            revisor_id=payload.revisor_id,
            atribuido_por=payload.atribuido_por,
            status='Ativo'
        )
        db.add(d)
        db.flush()  # obter id sem commit final
        if gi.id == payload.ativo_id:
            created_for_requested = d

    db.commit()
    if created_for_requested:
        d = created_for_requested
    else:
        # por segurança, recuperar delegação do item solicitado
        d = db.query(RevisaoDelegacaoModel).filter(
            RevisaoDelegacaoModel.periodo_id == payload.periodo_id,
            RevisaoDelegacaoModel.ativo_id == payload.ativo_id,
            RevisaoDelegacaoModel.status == 'Ativo'
        ).first()

    return DelegacaoOut(
        id=d.id,
        periodo_id=d.periodo_id,
        ativo_id=d.ativo_id,
        revisor_id=d.revisor_id,
        atribuido_por=d.atribuido_por,
        data_atribuicao=d.data_atribuicao,
        status=d.status,
        numero_imobilizado=item.numero_imobilizado,
        descricao=item.descricao,
        revisor_nome=revisor.nome_completo,
    )

@app.delete("/revisoes/delegacoes/{delegacao_id}")
def delete_revisao_delegacao(delegacao_id: int, db: Session = Depends(get_db)):
    d = db.query(RevisaoDelegacaoModel).filter(RevisaoDelegacaoModel.id == delegacao_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Delegação não encontrada")
    db.delete(d)
    db.commit()
    return {"deleted": True}