from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
import sqlalchemy as sa
from datetime import date
import io
import json

from ..database import SessionLocal
from ..models import (
    RevisaoItem as RevisaoItemModel,
    RevisaoPeriodo as RevisaoPeriodoModel,
    ClasseContabil as ClasseContabilModel,
    Usuario as UsuarioModel,
    GrupoUsuario as GrupoUsuarioModel,
    GrupoEmpresa as GrupoEmpresaModel,
    AuditoriaLog as AuditoriaLogModel,
)
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import os

router = APIRouter(prefix="/simulador/depreciacao", tags=["Simulador Depreciação"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


security = HTTPBearer()
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
    if getattr(current_user, "empresa_id", None) is not None:
        empresas_ids.add(current_user.empresa_id)
    return sorted(empresas_ids)


def _add_months(d: date, months: int) -> date:
    year = d.year + (d.month - 1 + months) // 12
    month = (d.month - 1 + months) % 12 + 1
    day = min(
        d.day,
        [
            31,
            29 if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0) else 28,
            31,
            30,
            31,
            30,
            31,
            31,
            30,
            31,
            30,
            31,
        ][month - 1],
    )
    return date(year, month, day)


def _months_diff(start: date, end: date) -> int:
    return (end.year - start.year) * 12 + (end.month - start.month)


def _vida_original_meses(it: RevisaoItemModel) -> int:
    total = it.vida_util_periodos or 0
    if total == 0 and (it.vida_util_anos or 0) > 0:
        total = (it.vida_util_anos or 0) * 12
    return total


def _vida_revisada_meses(it: RevisaoItemModel) -> int:
    if it.vida_util_revisada is not None:
        return it.vida_util_revisada
    return _vida_original_meses(it)


def _is_revised(it: RevisaoItemModel) -> bool:
    s = (it.status or "").lower()
    if s in {"revisado", "revisada", "aprovado", "aprovada", "concluido", "concluida"}:
        return True
    if getattr(it, "alterado", False):
        return True
    if (it.justificativa or "").strip():
        return True
    if (it.condicao_fisica or "").strip():
        return True
    return False


def _log_simulacao(db: Session, usuario_id: int, empresa_id: int, filtros: dict):
    try:
        detalhes = json.dumps(
            {
                "empresa_id": empresa_id,
                "filtros": filtros,
            },
            default=str,
        )
        log = AuditoriaLogModel(
            usuario_id=usuario_id,
            acao="simulador_depreciacao",
            entidade="simulador_depreciacao",
            entidade_id=None,
            detalhes=detalhes,
        )
        db.add(log)
        db.commit()
    except Exception:
        try:
            db.rollback()
        except Exception:
            pass


class SimuladorFiltroPayload(BaseModel):
    empresa_id: int
    periodo_inicio: date
    periodo_fim: date
    status_revisao: Optional[str] = "Todos"
    classe_id: Optional[str] = None
    ug_id: Optional[int] = None
    centro_custo: Optional[str] = None


class SimuladorAnaliticoItem(BaseModel):
    numero_imobilizado: str
    sub_numero: str
    data_incorporacao: date
    descricao: str
    classe: str
    classe_descricao: Optional[str] = None
    vida_util_original_anos: int
    vida_util_original_meses: int
    data_fim_original: Optional[date]
    depreciacao_original_periodo: float
    vida_util_revisada_anos: int
    vida_util_revisada_meses: int
    data_fim_revisada: Optional[date]
    depreciacao_revisada_periodo: float
    diferenca_valor: float
    diferenca_percentual: float
    status_ajuste: str


class SimuladorSinteticoItem(BaseModel):
    classe: str
    classe_descricao: Optional[str] = None
    quantidade_ativos: int
    depreciacao_original_total: float
    depreciacao_revisada_total: float
    diferenca_absoluta: float
    diferenca_percentual: float


class SimuladorResponse(BaseModel):
    analitico: List[SimuladorAnaliticoItem]
    sintetico: List[SimuladorSinteticoItem]
    aviso: str


def _run_simulacao(
    db: Session,
    current_user: UsuarioModel,
    empresa_id: int,
    periodo_inicio: date,
    periodo_fim: date,
    status_revisao: Optional[str],
    classe_id: Optional[str],
    ug_id: Optional[int],
    centro_custo: Optional[str],
) -> SimuladorResponse:
    if periodo_fim < periodo_inicio:
        raise HTTPException(status_code=400, detail="Período final menor que o inicial")

    allowed = get_allowed_company_ids(db, current_user)
    if allowed and empresa_id not in allowed:
        raise HTTPException(status_code=403, detail="Acesso negado à empresa informada")

    q = (
        db.query(
            RevisaoItemModel,
            RevisaoPeriodoModel,
            ClasseContabilModel.descricao.label("classe_descricao"),
        )
        .join(RevisaoPeriodoModel, RevisaoItemModel.periodo_id == RevisaoPeriodoModel.id)
        .outerjoin(
            ClasseContabilModel,
            sa.and_(
                ClasseContabilModel.codigo == RevisaoItemModel.classe,
                ClasseContabilModel.empresa_id == RevisaoPeriodoModel.empresa_id,
            ),
        )
    )

    if allowed:
        q = q.filter(RevisaoPeriodoModel.empresa_id.in_(allowed))

    q = q.filter(RevisaoPeriodoModel.empresa_id == int(empresa_id))

    if ug_id is not None:
        q = q.filter(RevisaoPeriodoModel.ug_id == int(ug_id))

    if classe_id:
        q = q.filter(RevisaoItemModel.classe == str(classe_id))

    if centro_custo:
        q = q.filter(RevisaoItemModel.centro_custo == centro_custo)

    itens = q.all()

    analitico_rows: List[SimuladorAnaliticoItem] = []
    sintetico_map: dict[str, dict] = {}

    for it, periodo, classe_desc in itens:
        revised_flag = _is_revised(it)
        if status_revisao:
            s = status_revisao.strip().lower()
            if s in {"revisados", "revisado"} and not revised_flag:
                continue
            if s in {"não revisados", "nao revisados", "nao_revisados", "nao-revisados"} and revised_flag:
                continue

        valor_aquisicao = float(getattr(it, "valor_aquisicao", 0) or 0)
        if valor_aquisicao <= 0:
            continue

        original_total = _vida_original_meses(it)
        if original_total <= 0:
            continue

        revised_total = _vida_revisada_meses(it)
        if revised_total <= 0:
            revised_total = original_total

        start_original = it.data_inicio_depreciacao
        if not start_original:
            continue

        end_original = it.data_fim_depreciacao
        if not end_original and original_total > 0:
            end_original = _add_months(start_original, original_total)

        base_start = periodo.data_inicio_nova_vida_util or periodo.data_abertura or start_original

        end_revisada = it.data_fim_revisada
        if not end_revisada and base_start and revised_total > 0:
            end_revisada = _add_months(base_start, revised_total)

        effective_start = periodo_inicio
        if base_start and base_start > effective_start:
            effective_start = base_start

        dep_original_periodo = 0.0
        dep_revisada_periodo = 0.0
        dep_ate_base = 0.0

        if end_original and end_original > effective_start:
            total_meses_original = _months_diff(start_original, end_original)
            if total_meses_original > 0:
                dep_mensal_original = round(valor_aquisicao / total_meses_original, 2)
                saldo = valor_aquisicao
                for i in range(total_meses_original):
                    periodo_data = _add_months(start_original, i)
                    dep_mes = dep_mensal_original
                    if i == total_meses_original - 1:
                        dep_mes = round(saldo, 2)
                    if base_start and periodo_data < base_start:
                        dep_ate_base += dep_mes
                    if periodo_data >= effective_start and periodo_data <= periodo_fim:
                        dep_original_periodo += dep_mes
                    saldo = round(saldo - dep_mes, 2)

        saldo_base = valor_aquisicao
        if dep_ate_base > 0:
            saldo_base = round(max(0.0, valor_aquisicao - dep_ate_base), 2)

        if end_revisada and end_revisada > effective_start:
            total_meses_revisada = _months_diff(base_start, end_revisada)
            if total_meses_revisada > 0:
                dep_mensal_revisada = round(saldo_base / total_meses_revisada, 2)
                saldo_r = saldo_base
                for i in range(total_meses_revisada):
                    periodo_data = _add_months(base_start, i)
                    dep_mes = dep_mensal_revisada
                    if i == total_meses_revisada - 1:
                        dep_mes = round(saldo_r, 2)
                    if periodo_data >= effective_start and periodo_data <= periodo_fim:
                        dep_revisada_periodo += dep_mes
                    saldo_r = round(saldo_r - dep_mes, 2)
        else:
            dep_revisada_periodo = dep_original_periodo

        diff_valor = dep_revisada_periodo - dep_original_periodo
        diff_percentual = 0.0
        if dep_original_periodo != 0:
            diff_percentual = round((diff_valor / dep_original_periodo) * 100, 4)

        original_total_meses = original_total
        original_anos = original_total_meses // 12
        original_meses = original_total_meses % 12

        revised_total_meses = revised_total
        if end_revisada and start_original:
            revised_total_meses = _months_diff(start_original, end_revisada)
        revised_anos = revised_total_meses // 12
        revised_meses = revised_total_meses % 12

        status_ajuste = "Com ajuste" if revised_flag and it.vida_util_revisada is not None else "Sem ajuste"

        analitico_item = SimuladorAnaliticoItem(
            numero_imobilizado=str(getattr(it, "numero_imobilizado", "")),
            sub_numero=str(getattr(it, "sub_numero", "")),
            data_incorporacao=start_original,
            descricao=str(getattr(it, "descricao", "")),
            classe=str(getattr(it, "classe", "")),
            classe_descricao=classe_desc,
            vida_util_original_anos=int(original_anos),
            vida_util_original_meses=int(original_meses),
            data_fim_original=end_original,
            depreciacao_original_periodo=round(dep_original_periodo, 2),
            vida_util_revisada_anos=int(revised_anos),
            vida_util_revisada_meses=int(revised_meses),
            data_fim_revisada=end_revisada,
            depreciacao_revisada_periodo=round(dep_revisada_periodo, 2),
            diferenca_valor=round(diff_valor, 2),
            diferenca_percentual=diff_percentual,
            status_ajuste=status_ajuste,
        )

        analitico_rows.append(analitico_item)

        classe_key = str(getattr(it, "classe", "")) or "Sem Classe"
        key = classe_key
        if key not in sintetico_map:
            sintetico_map[key] = {
                "classe": classe_key,
                "classe_descricao": classe_desc,
                "quantidade_ativos": 0,
                "depreciacao_original_total": 0.0,
                "depreciacao_revisada_total": 0.0,
            }
        agg = sintetico_map[key]
        agg["quantidade_ativos"] += 1
        agg["depreciacao_original_total"] += dep_original_periodo
        agg["depreciacao_revisada_total"] += dep_revisada_periodo

    sintetico_rows: List[SimuladorSinteticoItem] = []
    total_original = 0.0
    total_revisada = 0.0
    total_qtd = 0

    for data in sintetico_map.values():
        diff_abs = data["depreciacao_revisada_total"] - data["depreciacao_original_total"]
        diff_pct = 0.0
        if data["depreciacao_original_total"] != 0:
            diff_pct = round((diff_abs / data["depreciacao_original_total"]) * 100, 4)
        sintetico_rows.append(
            SimuladorSinteticoItem(
                classe=data["classe"],
                classe_descricao=data["classe_descricao"],
                quantidade_ativos=data["quantidade_ativos"],
                depreciacao_original_total=round(data["depreciacao_original_total"], 2),
                depreciacao_revisada_total=round(data["depreciacao_revisada_total"], 2),
                diferenca_absoluta=round(diff_abs, 2),
                diferenca_percentual=diff_pct,
            )
        )
        total_original += data["depreciacao_original_total"]
        total_revisada += data["depreciacao_revisada_total"]
        total_qtd += data["quantidade_ativos"]

    if total_qtd > 0:
        total_diff_abs = total_revisada - total_original
        total_diff_pct = 0.0
        if total_original != 0:
            total_diff_pct = round((total_diff_abs / total_original) * 100, 4)
        sintetico_rows.append(
            SimuladorSinteticoItem(
                classe="TOTAL",
                classe_descricao=None,
                quantidade_ativos=total_qtd,
                depreciacao_original_total=round(total_original, 2),
                depreciacao_revisada_total=round(total_revisada, 2),
                diferenca_absoluta=round(total_diff_abs, 2),
                diferenca_percentual=total_diff_pct,
            )
        )

    aviso = "Simulação baseada nos dados da revisão. Nenhum dado contábil foi alterado."

    return SimuladorResponse(analitico=analitico_rows, sintetico=sintetico_rows, aviso=aviso)


@router.post("", response_model=SimuladorResponse)
def simular(
    payload: SimuladorFiltroPayload,
    current_user: UsuarioModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resp = _run_simulacao(
        db=db,
        current_user=current_user,
        empresa_id=payload.empresa_id,
        periodo_inicio=payload.periodo_inicio,
        periodo_fim=payload.periodo_fim,
        status_revisao=payload.status_revisao,
        classe_id=payload.classe_id,
        ug_id=payload.ug_id,
        centro_custo=payload.centro_custo,
    )
    filtros = {
        "periodo_inicio": payload.periodo_inicio,
        "periodo_fim": payload.periodo_fim,
        "status_revisao": payload.status_revisao,
        "classe_id": payload.classe_id,
        "ug_id": payload.ug_id,
        "centro_custo": payload.centro_custo,
    }
    _log_simulacao(db, usuario_id=current_user.id, empresa_id=payload.empresa_id, filtros=filtros)
    return resp


@router.get("/excel")
def simular_excel(
    empresa_id: int,
    periodo_inicio: date,
    periodo_fim: date,
    status_revisao: Optional[str] = None,
    classe_id: Optional[str] = None,
    ug_id: Optional[int] = None,
    centro_custo: Optional[str] = None,
    current_user: UsuarioModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        import pandas as pd
    except Exception:
        raise HTTPException(status_code=500, detail="Dependências de Excel ausentes (pandas)")

    resp = _run_simulacao(
        db=db,
        current_user=current_user,
        empresa_id=empresa_id,
        periodo_inicio=periodo_inicio,
        periodo_fim=periodo_fim,
        status_revisao=status_revisao,
        classe_id=classe_id,
        ug_id=ug_id,
        centro_custo=centro_custo,
    )

    rows = []
    for item in resp.analitico:
        rows.append(
            {
                "Imobilizado": item.numero_imobilizado,
                "Sub Nº": item.sub_numero,
                "Data de Incorporação": item.data_incorporacao,
                "Descrição": item.descricao,
                "Classe contábil": item.classe,
                "Descrição Classe": item.classe_descricao,
                "Vida Útil (anos)": item.vida_util_original_anos,
                "Vida Útil (meses)": item.vida_util_original_meses,
                "Data Fim Depreciação (original)": item.data_fim_original,
                "Depreciação Original no Período": item.depreciacao_original_periodo,
                "Nova Vida Útil (anos)": item.vida_util_revisada_anos,
                "Nova Vida Útil (meses)": item.vida_util_revisada_meses,
                "Nova Data Fim Depreciação": item.data_fim_revisada,
                "Nova Depreciação no Período": item.depreciacao_revisada_periodo,
                "Diferença de Depreciação (valor)": item.diferenca_valor,
                "Diferença de Depreciação (%)": item.diferenca_percentual,
                "Status Ajuste": item.status_ajuste,
            }
        )

    df = pd.DataFrame(rows)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Simulacao")
    output.seek(0)
    headers = {
        "Content-Disposition": 'attachment; filename="Simulador_Depreciacao.xlsx"',
    }
    filtros = {
        "periodo_inicio": periodo_inicio,
        "periodo_fim": periodo_fim,
        "status_revisao": status_revisao,
        "classe_id": classe_id,
        "ug_id": ug_id,
        "centro_custo": centro_custo,
    }
    _log_simulacao(db, usuario_id=current_user.id, empresa_id=empresa_id, filtros=filtros)
    return Response(
        content=output.read(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers,
    )


@router.get("/pdf")
def simular_pdf(
    empresa_id: int,
    periodo_inicio: date,
    periodo_fim: date,
    status_revisao: Optional[str] = None,
    classe_id: Optional[str] = None,
    ug_id: Optional[int] = None,
    centro_custo: Optional[str] = None,
    current_user: UsuarioModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.pagesizes import A4, landscape
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.lib import colors
    except Exception:
        raise HTTPException(status_code=500, detail="Dependências de PDF ausentes (reportlab)")

    resp = _run_simulacao(
        db=db,
        current_user=current_user,
        empresa_id=empresa_id,
        periodo_inicio=periodo_inicio,
        periodo_fim=periodo_fim,
        status_revisao=status_revisao,
        classe_id=classe_id,
        ug_id=ug_id,
        centro_custo=centro_custo,
    )

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4))
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("Simulador de Depreciação", styles["Title"]))
    story.append(Spacer(1, 12))
    story.append(Paragraph(resp.aviso, styles["Normal"]))
    story.append(Spacer(1, 12))

    data = [
        [
            "Classe",
            "Descrição",
            "Qtd Ativos",
            "Depreciação Original",
            "Depreciação Simulada",
            "Diferença",
            "Diferença (%)",
        ]
    ]

    for item in resp.sintetico:
        data.append(
            [
                item.classe,
                item.classe_descricao or "",
                str(item.quantidade_ativos),
                f"{item.depreciacao_original_total:.2f}",
                f"{item.depreciacao_revisada_total:.2f}",
                f"{item.diferenca_absoluta:.2f}",
                f"{item.diferenca_percentual:.2f}",
            ]
        )

    t = Table(data, colWidths=[70, 200, 60, 90, 110, 90, 90])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(t)

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    filtros = {
        "periodo_inicio": periodo_inicio,
        "periodo_fim": periodo_fim,
        "status_revisao": status_revisao,
        "classe_id": classe_id,
        "ug_id": ug_id,
        "centro_custo": centro_custo,
    }
    _log_simulacao(db, usuario_id=current_user.id, empresa_id=empresa_id, filtros=filtros)
    return Response(content=pdf_bytes, media_type="application/pdf")
