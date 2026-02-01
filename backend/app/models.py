from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    cnpj = Column(String(32), nullable=False, index=True)
    branch_type = Column(String(32), nullable=False)  # Matriz | Filial
    street = Column(String(255), nullable=True)
    district = Column(String(255), nullable=True)
    city = Column(String(255), nullable=True)
    state = Column(String(32), nullable=True)
    cep = Column(String(32), nullable=True)
    phone = Column(String(64), nullable=True)
    email = Column(String(255), nullable=True)
    division = Column(String(255), nullable=True)
    state_registration = Column(String(64), nullable=True)
    status = Column(String(32), nullable=False)  # Ativo | Inativo

from sqlalchemy import Date, Text, ForeignKey, Enum as SAEnum, DateTime, func, Numeric, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy import UniqueConstraint
import enum

class Vinculo(str, enum.Enum):
    proprio = "proprio"
    terceiro = "terceiro"
    temporario = "temporario"

class Status(str, enum.Enum):
    ativo = "ativo"
    inativo = "inativo"

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    cpf = Column(String(14), nullable=False, index=True)
    matricula = Column(String(64), nullable=True)
    cargo_funcao = Column(String(255), nullable=True)

    empresa_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    company = relationship("Company", backref="employees")

    ug_id = Column(Integer, nullable=True)
    centro_custo_id = Column(Integer, nullable=True)

    tipo_vinculo = Column(SAEnum(Vinculo, name="vinculo_enum"), nullable=False)

    data_admissao = Column(Date, nullable=False)
    data_desligamento = Column(Date, nullable=True)

    telefone = Column(String(32), nullable=True)
    email_corporativo = Column(String(255), nullable=True)

    endereco = Column(String(255), nullable=True)
    cidade = Column(String(255), nullable=True)
    estado = Column(String(32), nullable=True)

    status = Column(SAEnum(Status, name="status_enum"), nullable=False, default=Status.ativo)
    observacoes = Column(Text, nullable=True)

# -----------------------------
# Unidades Gerenciais (UG)
# -----------------------------
class ManagementUnit(Base):
    __tablename__ = "unidades_gerenciais"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(64), nullable=False, unique=True, index=True)
    nome = Column(String(255), nullable=False)

    tipo_unidade = Column(String(32), nullable=False)  # Administrativa, Produtiva, Apoio, Auxiliares
    nivel_hierarquico = Column(String(64), nullable=False)  # CEO, Diretoria, Gerência Geral, Gerência, Coordenação, Operacional

    empresa_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    company = relationship("Company", backref="management_units")

    responsavel_id = Column(Integer, ForeignKey("employees.id"), nullable=True, index=True)
    responsavel = relationship("Employee", backref="responsavel_ugs", foreign_keys=[responsavel_id])

    ug_superior_id = Column(Integer, ForeignKey("unidades_gerenciais.id"), nullable=True, index=True)
    superior = relationship("ManagementUnit", remote_side=[id], backref="subunidades")

    status = Column(String(32), nullable=False, default="Ativo")

    data_criacao = Column(DateTime, server_default=func.now(), nullable=False)
    data_atualizacao = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(20), nullable=False, unique=True, index=True)
    nome_completo = Column(String(150), nullable=False)
    email = Column(String(120), nullable=False, unique=True, index=True)
    senha_hash = Column(Text, nullable=False)
    cpf = Column(String(14), nullable=False, unique=True, index=True)
    nome_usuario = Column(String(60), nullable=False, unique=True, index=True)
    data_nascimento = Column(Date, nullable=True)

    empresa_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    company = relationship("Company", backref="usuarios")

    ug_id = Column(Integer, ForeignKey("unidades_gerenciais.id"), nullable=True)
    ug = relationship("ManagementUnit", backref="usuarios")

    centro_custo_id = Column(Integer, nullable=True)

    status = Column(String(10), nullable=False, default="Ativo")

    data_criacao = Column(DateTime, server_default=func.now(), nullable=False)
    data_atualizacao = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

class RevisaoPeriodo(Base):
    __tablename__ = "revisoes_periodos"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(20), nullable=False, unique=True, index=True)
    descricao = Column(Text, nullable=False)
    data_abertura = Column(Date, nullable=False)
    data_fechamento_prevista = Column(Date, nullable=False)
    data_fechamento = Column(Date, nullable=True)
    # Nova vida útil prospectiva: data base a partir da qual nova vida útil passa a valer
    data_inicio_nova_vida_util = Column(Date, nullable=True)

    # Novo: vínculo com Empresa
    empresa_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    company = relationship("Company", backref="revisoes_periodos")

    # Novo: vínculo opcional com Unidade Gerencial (UG)
    ug_id = Column(Integer, ForeignKey("unidades_gerenciais.id"), nullable=True, index=True)
    ug = relationship("ManagementUnit", backref="revisoes_periodos")

    responsavel_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    responsavel = relationship("Usuario", backref="revisoes", foreign_keys=[responsavel_id])

    status = Column(String(20), nullable=False, default="Aberto")
    observacoes = Column(Text, nullable=True)

    criado_em = Column(DateTime, server_default=func.now(), nullable=False)

# -----------------------------
# Itens da Revisão (base importada)
# -----------------------------
class RevisaoItem(Base):
    __tablename__ = "revisoes_itens"

    id = Column(Integer, primary_key=True, index=True)
    periodo_id = Column(Integer, ForeignKey("revisoes_periodos.id"), nullable=False, index=True)

    numero_imobilizado = Column(String(50), nullable=False)
    sub_numero = Column(String(10), nullable=False)
    descricao = Column(Text, nullable=False)

    data_inicio_depreciacao = Column(Date, nullable=False)
    data_fim_depreciacao = Column(Date, nullable=True)

    valor_aquisicao = Column(Numeric(18, 2), nullable=False)
    depreciacao_acumulada = Column(Numeric(18, 2), nullable=False)
    valor_contabil = Column(Numeric(18, 2), nullable=False)

    centro_custo = Column(String(100), nullable=False)
    classe = Column(String(100), nullable=False)
    descricao_classe = Column(Text, nullable=True)
    conta_contabil = Column(String(50), nullable=False)
    descricao_conta_contabil = Column(Text, nullable=False)

    vida_util_anos = Column(Integer, nullable=False)
    vida_util_periodos = Column(Integer, nullable=False)

    auxiliar2 = Column(Text, nullable=True)
    auxiliar3 = Column(Text, nullable=True)

    status = Column(String(20), nullable=False, default="Pendente")
    criado_em = Column(DateTime, server_default=func.now(), nullable=False)
    # Campos para revisão de vidas úteis
    vida_util_revisada = Column(Integer, nullable=True)
    data_fim_revisada = Column(Date, nullable=True)
    condicao_fisica = Column(String(20), nullable=True)  # Bom, Regular, Ruim
    justificativa = Column(Text, nullable=True)
    alterado = Column(Boolean, nullable=False, default=False)
    criado_por = Column(Integer, ForeignKey("usuarios.id"), nullable=True, index=True)


class RevisaoDelegacao(Base):
    __tablename__ = "revisoes_delegacoes"

    id = Column(Integer, primary_key=True, index=True)
    periodo_id = Column(Integer, ForeignKey("revisoes_periodos.id"), nullable=False, index=True)
    ativo_id = Column(Integer, ForeignKey("revisoes_itens.id"), nullable=False, index=True)
    revisor_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)

    data_atribuicao = Column(DateTime, server_default=func.now(), nullable=False)
    atribuido_por = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    status = Column(String(20), nullable=False, default="Ativo")

    periodo = relationship("RevisaoPeriodo", backref="delegacoes")
    ativo = relationship("RevisaoItem", backref="delegacoes")
    revisor = relationship("Usuario", foreign_keys=[revisor_id], backref="delegacoes_recebidas")
    atribuidor = relationship("Usuario", foreign_keys=[atribuido_por], backref="delegacoes_atribuidas")

class Cronograma(Base):
    __tablename__ = "cronogramas"

    id = Column(Integer, primary_key=True, index=True)
    periodo_id = Column(Integer, ForeignKey("revisoes_periodos.id"), nullable=False, index=True)
    empresa_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    responsavel_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    descricao = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="Aberto")
    progresso_percentual = Column(Integer, nullable=False, default=0)
    criado_em = Column(DateTime, server_default=func.now(), nullable=False)

    periodo = relationship("RevisaoPeriodo", backref="cronogramas")
    empresa = relationship("Company", backref="cronogramas")
    responsavel = relationship("Usuario", backref="cronogramas")

class CronogramaTarefa(Base):
    __tablename__ = "cronogramas_tarefas"

    id = Column(Integer, primary_key=True, index=True)
    cronograma_id = Column(Integer, ForeignKey("cronogramas.id"), nullable=False, index=True)
    tipo = Column(String(20), nullable=False, default="Tarefa")
    nome = Column(String(150), nullable=False)
    descricao = Column(Text, nullable=True)
    data_inicio = Column(Date, nullable=True)
    data_fim = Column(Date, nullable=True)
    responsavel_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True, index=True)
    status = Column(String(20), nullable=False, default="Pendente")
    progresso_percentual = Column(Integer, nullable=False, default=0)
    dependente_tarefa_id = Column(Integer, ForeignKey("cronogramas_tarefas.id"), nullable=True, index=True)
    criado_em = Column(DateTime, server_default=func.now(), nullable=False)

    cronograma = relationship("Cronograma", backref="tarefas")
    responsavel = relationship("Usuario")

# Evidências de tarefas do cronograma
from sqlalchemy import LargeBinary

class CronogramaTarefaEvidencia(Base):
    __tablename__ = "cronogramas_tarefas_evidencias"

    id = Column(Integer, primary_key=True, index=True)
    tarefa_id = Column(Integer, ForeignKey("cronogramas_tarefas.id"), nullable=False, index=True)
    nome_arquivo = Column(String(255), nullable=False)
    content_type = Column(String(100), nullable=False)
    tamanho_bytes = Column(Integer, nullable=False)
    conteudo = Column(LargeBinary, nullable=False)
    criado_em = Column(DateTime, server_default=func.now(), nullable=False)
    uploaded_by = Column(Integer, ForeignKey("usuarios.id"), nullable=True, index=True)

    tarefa = relationship("CronogramaTarefa", backref="evidencias")
    uploader = relationship("Usuario")

# -----------------------------
# Centros de Custos
# -----------------------------
class CentroCusto(Base):
    __tablename__ = "centros_custos"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(50), nullable=False, unique=True, index=True)
    nome = Column(String(150), nullable=False)

    empresa_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    company = relationship("Company", backref="centros_custos")

    ug_id = Column(Integer, ForeignKey("unidades_gerenciais.id"), nullable=False, index=True)
    ug = relationship("ManagementUnit", backref="centros_custos")

    responsavel_id = Column(Integer, ForeignKey("employees.id"), nullable=True, index=True)
    responsavel = relationship("Employee", backref="centros_custos_responsavel", foreign_keys=[responsavel_id])

    observacoes = Column(Text, nullable=True)
    data_criacao = Column(DateTime, server_default=func.now(), nullable=False)

    criado_por = Column(Integer, ForeignKey("usuarios.id"), nullable=True, index=True)
    criado_por_usuario = relationship("Usuario", backref="centros_custos_criados", foreign_keys=[criado_por])

    status = Column(String(20), nullable=False, default="Ativo")

# -----------------------------
# Classes Contábeis
# -----------------------------
class ClasseContabil(Base):
    __tablename__ = "classes_contabeis"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(50), nullable=False, unique=True, index=True)
    descricao = Column(String(255), nullable=False)
    vida_util_anos = Column(Integer, nullable=False)
    taxa_depreciacao = Column(Numeric(5, 2), nullable=False)
    
    empresa_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    company = relationship("Company", backref="classes_contabeis")

    conta_contabil_id = Column(Integer, ForeignKey("contas_contabeis.id"), nullable=True, index=True)
    conta_contabil = relationship("ContaContabil", backref="classes_contabeis")

    status = Column(String(20), nullable=False, default="Ativo")
    criado_em = Column(DateTime, server_default=func.now(), nullable=False)


# -----------------------------
# Contas Contábeis
# -----------------------------
class ContaContabil(Base):
    __tablename__ = "contas_contabeis"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(50), nullable=False, unique=True, index=True)
    descricao = Column(String(255), nullable=False)
    
    empresa_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    company = relationship("Company", backref="contas_contabeis")

    status = Column(String(20), nullable=False, default="Ativo")
    criado_em = Column(DateTime, server_default=func.now(), nullable=False)

# -----------------------------
# Controle de Acessos (Grupos de Permissão)
# -----------------------------
class GrupoPermissao(Base):
    __tablename__ = "grupos_permissao"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(150), nullable=False, unique=True, index=True)
    descricao = Column(Text, nullable=True)
    criado_em = Column(DateTime, server_default=func.now(), nullable=False)
    atualizado_em = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # relationships
    empresas = relationship("GrupoEmpresa", backref="grupo", cascade="all, delete-orphan")
    transacoes = relationship("GrupoTransacao", backref="grupo", cascade="all, delete-orphan")
    usuarios = relationship("GrupoUsuario", backref="grupo", cascade="all, delete-orphan")


class Transacao(Base):
    __tablename__ = "transacoes"

    id = Column(Integer, primary_key=True, index=True)
    nome_tela = Column(String(150), nullable=False)
    rota = Column(String(255), nullable=False, unique=True, index=True)
    descricao = Column(Text, nullable=True)


class GrupoEmpresa(Base):
    __tablename__ = "grupo_empresa"

    id = Column(Integer, primary_key=True, index=True)
    grupo_id = Column(Integer, ForeignKey("grupos_permissao.id"), nullable=False, index=True)
    empresa_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)

    __table_args__ = (
        UniqueConstraint("grupo_id", "empresa_id", name="uq_grupo_empresa"),
    )

    empresa = relationship("Company", backref="grupos_associados")


class GrupoTransacao(Base):
    __tablename__ = "grupo_transacao"

    id = Column(Integer, primary_key=True, index=True)
    grupo_id = Column(Integer, ForeignKey("grupos_permissao.id"), nullable=False, index=True)
    transacao_id = Column(Integer, ForeignKey("transacoes.id"), nullable=False, index=True)

    __table_args__ = (
        UniqueConstraint("grupo_id", "transacao_id", name="uq_grupo_transacao"),
    )

    transacao = relationship("Transacao", backref="grupos")


class GrupoUsuario(Base):
    __tablename__ = "grupo_usuario"

    id = Column(Integer, primary_key=True, index=True)
    grupo_id = Column(Integer, ForeignKey("grupos_permissao.id"), nullable=False, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)

    __table_args__ = (
        UniqueConstraint("grupo_id", "usuario_id", name="uq_grupo_usuario"),
    )

    usuario = relationship("Usuario", backref="grupos")


# -----------------------------
# Logs de Auditoria (ações críticas)
# -----------------------------
class AuditoriaLog(Base):
    __tablename__ = "auditoria_logs"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True, index=True)
    acao = Column(String(100), nullable=False)
    entidade = Column(String(100), nullable=False)
    entidade_id = Column(Integer, nullable=True)
    detalhes = Column(Text, nullable=True)
    data_evento = Column(DateTime, server_default=func.now(), nullable=False)

# -----------------------------
# Tokens de Redefinição de Senha
# -----------------------------
class TokenRedefinicao(Base):
    __tablename__ = "tokens_redefinicao"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    token = Column(String(255), nullable=False, unique=True, index=True)
    expiracao = Column(DateTime, nullable=False)
    usado = Column(Boolean, nullable=False, default=False)

    usuario = relationship("Usuario", backref="tokens_redefinicao")
