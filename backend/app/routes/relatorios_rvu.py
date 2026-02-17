from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..models import (
    Company as CompanyModel,
    Employee as EmployeeModel,
    RevisaoItem as RevisaoItemModel,
    RevisaoPeriodo as RevisaoPeriodoModel,
    ManagementUnit as UGModel,
    Usuario as UsuarioModel,
    RevisaoDelegacao as RevisaoDelegacaoModel,
    GrupoUsuario as GrupoUsuarioModel,
    GrupoEmpresa as GrupoEmpresaModel,
)
import sqlalchemy as sa
from datetime import date, datetime
import io
import traceback
from jose import jwt, JWTError
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

router = APIRouter(prefix="/relatorios/rvu", tags=["Relatórios RVU"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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

def _filters_query(db: Session, params: dict, allowed_company_ids: list[int]):
    print(f"DEBUG _filters_query: params={params}, allowed_companies={allowed_company_ids}")
    q = db.query(RevisaoItemModel)
    
    # Debug helper
    def debug_count(label):
        try:
            c = q.count()
            print(f"DEBUG _filters_query [{label}]: {c} items")
        except Exception as e:
            print(f"DEBUG _filters_query [{label}]: error counting - {e}")

    debug_count("Initial")

    # Filtros por empresa/UG via período
    q = q.join(RevisaoPeriodoModel, RevisaoPeriodoModel.id == RevisaoItemModel.periodo_id)
    
    if allowed_company_ids:
        q = q.filter(RevisaoPeriodoModel.empresa_id.in_(allowed_company_ids))
        debug_count("Allowed Companies")
        
    if params.get('empresa_id'):
        q = q.filter(RevisaoPeriodoModel.empresa_id == int(params['empresa_id']))
        debug_count("Empresa ID")
        
    if params.get('ug_id'):
        # Permite período específico da UG OU período global (ug_id IS NULL)
        ug_val = int(params['ug_id'])
        q = q.filter(sa.or_(RevisaoPeriodoModel.ug_id == ug_val, RevisaoPeriodoModel.ug_id == None))
        debug_count("UG ID")
        
    # Classe contábil (string na base importada)
    if params.get('classe_id') and str(params['classe_id']).lower() not in ['todos', '']:
        # Converte para string pois o campo na base é String e o front pode enviar int
        classe_val = str(params['classe_id'])
        q = q.filter(RevisaoItemModel.classe == classe_val)
        debug_count("Classe ID")
        
    # Revisor: filtra por delegações ativas para o item
    if params.get('revisor_id'):
        q = q.join(
            RevisaoDelegacaoModel,
            sa.and_(
                RevisaoDelegacaoModel.ativo_id == RevisaoItemModel.id,
                RevisaoDelegacaoModel.status == 'Ativo',
                RevisaoDelegacaoModel.revisor_id == int(params['revisor_id'])
            )
        )
        debug_count("Revisor ID")
        
    # Filtro explícito por Período de Revisão
    if params.get('periodo_id'):
        q = q.filter(RevisaoItemModel.periodo_id == int(params['periodo_id']))
        debug_count("Periodo ID")

    # Período: usar data de início de depreciação (somente se não filtrar por ID de período ou se quiser filtrar dentro do período)
    if params.get('periodo_inicio'):
        q = q.filter(RevisaoItemModel.data_inicio_depreciacao >= params['periodo_inicio'])
    if params.get('periodo_fim'):
        q = q.filter(RevisaoItemModel.data_inicio_depreciacao <= params['periodo_fim'])
    # Status do item
    if params.get('status') and params['status'] != 'Todos':
        q = q.filter(RevisaoItemModel.status == params['status'])
    
    print(f"DEBUG _filters_query: SQL generated count check...")
    try:
        # Debug SQL
        # print(str(q.statement.compile(compile_kwargs={"literal_binds": True})))
        count = q.count()
        print(f"DEBUG _filters_query: Found {count} items matching filters.")
    except Exception as e:
        print(f"DEBUG _filters_query: Error counting items: {e}")
        
    return q

# Helpers de cronograma
def _add_months(d: date, months: int) -> date:
    year = d.year + (d.month - 1 + months) // 12
    month = (d.month - 1 + months) % 12 + 1
    day = min(d.day, [31,
                      29 if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0) else 28,
                      31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1])
    return date(year, month, day)

def _months_diff(start: date, end: date) -> int:
    return (end.year - start.year) * 12 + (end.month - start.month)

def _vida_total_meses(it) -> int:
    atual_total = (getattr(it, 'vida_util_periodos', None) or 0)
    if atual_total == 0 and (getattr(it, 'vida_util_anos', None) or 0) > 0:
        atual_total = (getattr(it, 'vida_util_anos', 0)) * 12
    revisada_total = getattr(it, 'vida_util_revisada', None) or 0
    return revisada_total or atual_total or 0

def _vida_meses_atual(it) -> int:
    total = getattr(it, 'vida_util_periodos', None) or 0
    if total == 0 and (getattr(it, 'vida_util_anos', None) or 0) > 0:
        total = (getattr(it, 'vida_util_anos', 0) or 0) * 12
    return int(total or 0)

def _vida_meses_revisada(it) -> int:
    total = getattr(it, 'vida_util_revisada', None) or 0
    if not total:
        start = getattr(it, 'data_inicio_depreciacao', None)
        end_rev = getattr(it, 'data_fim_revisada', None)
        if start and end_rev:
            total = _months_diff(start, end_rev)
    return int(total or 0)

def _format_life_ym(total_meses: int) -> str:
    if total_meses is None or total_meses <= 0:
        return "-"
    anos = total_meses // 12
    meses = total_meses % 12
    return f"{anos}a{meses}m"

def _format_money_br(value) -> str:
    try:
        num = float(value or 0)
    except Exception:
        return "0,00"
    s = f"{num:,.2f}"
    s = s.replace(",", "X").replace(".", ",").replace("X", ".")
    return s

def _data_fim(it) -> date | None:
    if getattr(it, 'data_fim_revisada', None):
        return getattr(it, 'data_fim_revisada')
    if getattr(it, 'data_fim_depreciacao', None):
        return getattr(it, 'data_fim_depreciacao')
    start = getattr(it, 'data_inicio_depreciacao', None)
    total = _vida_total_meses(it)
    if start and total:
        return _add_months(start, total)
    return None

@router.get('/resumo')
def resumo(empresa_id: int | None = None, ug_id: int | None = None, classe_id: int | None = None, revisor_id: int | None = None,
           periodo_inicio: date | None = None, periodo_fim: date | None = None, status: str | None = None,
           current_user: UsuarioModel = Depends(get_current_user), db: Session = Depends(get_db)):
    allowed = get_allowed_company_ids(db, current_user)
    if empresa_id is not None and allowed and empresa_id not in allowed:
        raise HTTPException(status_code=403, detail='Acesso negado ao resumo da empresa informada')
    params = {
        'empresa_id': empresa_id,
        'ug_id': ug_id,
        'classe_id': classe_id,
        'revisor_id': revisor_id,
        'periodo_inicio': periodo_inicio,
        'periodo_fim': periodo_fim,
        'status': status,
    }
    q = _filters_query(db, params, allowed)
    items = q.all()
    data = []
    for it in items:
        # Conversões e cálculos de vida útil esperados pelo frontend
        atual_total = (it.vida_util_periodos or 0)
        if atual_total == 0 and (it.vida_util_anos or 0) > 0:
            atual_total = (it.vida_util_anos or 0) * 12
        atual_anos = (atual_total // 12) if atual_total is not None else 0
        atual_meses = (atual_total % 12) if atual_total is not None else 0
        revisada_total = it.vida_util_revisada or 0
        revisada_anos = (revisada_total // 12) if revisada_total else 0
        revisada_meses = (revisada_total % 12) if revisada_total else 0
        # Revisor (best-effort): usa criado_por se existir
        revisor_nome = None
        try:
            if it.criado_por:
                u = db.query(UsuarioModel).filter(UsuarioModel.id == it.criado_por).first()
                revisor_nome = getattr(u, 'nome_completo', None) if u else None
        except Exception:
            revisor_nome = None
        data.append({
            'numero_imobilizado': getattr(it, 'numero_imobilizado', None),
            'sub_numero': getattr(it, 'sub_numero', None),
            'descricao': getattr(it, 'descricao', None),
            'classe': getattr(it, 'classe', None),
            'valor_aquisicao': float(getattr(it, 'valor_aquisicao', 0) or 0),
            'depreciacao_acumulada': float(getattr(it, 'depreciacao_acumulada', 0) or 0),
            'valor_contabil': float(getattr(it, 'valor_contabil', 0) or 0),
            'vida_util_atual_anos': atual_anos,
            'vida_util_atual_meses': atual_meses,
            'vida_util_revisada_anos': revisada_anos,
            'vida_util_revisada_meses': revisada_meses,
            'data_inicio': getattr(it, 'data_inicio_depreciacao', None),
            'data_fim_atual': getattr(it, 'data_fim_depreciacao', None),
            'data_fim_revisada': getattr(it, 'data_fim_revisada', None),
            'revisor': revisor_nome,
            'status': getattr(it, 'status', None),
        })
    return data

@router.get('/cronograma')
def cronograma(
    empresa_id: int | None = None,
    ug_id: int | None = None,
    classe_id: int | None = None,
    revisor_id: int | None = None,
    periodo_inicio: date | None = None,
    periodo_fim: date | None = None,
    status: str | None = None,
    item_id: int | None = None,
    current_user: UsuarioModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    allowed = get_allowed_company_ids(db, current_user)
    if empresa_id is not None and allowed and empresa_id not in allowed:
        raise HTTPException(status_code=403, detail='Acesso negado ao cronograma da empresa informada')
    params = {
        'empresa_id': empresa_id,
        'ug_id': ug_id,
        'classe_id': classe_id,
        'revisor_id': revisor_id,
        'periodo_inicio': periodo_inicio,
        'periodo_fim': periodo_fim,
        'status': status,
    }
    q = _filters_query(db, params, allowed)
    if item_id is not None:
        q = q.filter(RevisaoItemModel.id == int(item_id))
    itens = q.all()
    rows = []
    for it in itens:
        start = getattr(it, 'data_inicio_depreciacao', None)
        end = _data_fim(it)
        if not start or not end:
            # pula itens sem período definido
            continue
        total_meses = _months_diff(start, end)
        # Base de cálculo: valor de aquisição (sem valor residual na base atual)
        valor_aquisicao = float(getattr(it, 'valor_aquisicao', 0) or 0)
        if total_meses <= 0 or valor_aquisicao <= 0:
            continue
        depreciacao_mensal = round(valor_aquisicao / total_meses, 2)
        saldo = valor_aquisicao
        for i in range(total_meses):
            periodo_data = _add_months(start, i)
            dep_mes = depreciacao_mensal
            # Ajuste do último mês para zerar o saldo evitando resíduos de arredondamento
            if i == total_meses - 1:
                dep_mes = round(saldo, 2)
            saldo_final = round(saldo - dep_mes, 2)
            rows.append({
                'numero_imobilizado': getattr(it, 'numero_imobilizado', None),
                'sub_numero': getattr(it, 'sub_numero', None),
                'descricao': getattr(it, 'descricao', None),
                'classe': getattr(it, 'classe', None),
                'periodo': periodo_data,
                'saldo_inicial': round(saldo, 2),
                'depreciacao_mes': dep_mes,
                'saldo_final': saldo_final,
            })
            saldo = saldo_final
    return rows

@router.get('/excel')
def excel(empresa_id: int | None = None, ug_id: int | None = None, classe_id: int | None = None, revisor_id: int | None = None,
          periodo_inicio: date | None = None, periodo_fim: date | None = None, status: str | None = None,
          current_user: UsuarioModel = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        import pandas as pd
    except Exception:
        print("Erro: pandas não instalado.")
        raise HTTPException(status_code=500, detail="Dependências de Excel ausentes (pandas)")

    try:
        allowed = get_allowed_company_ids(db, current_user)
        if empresa_id is not None and allowed and empresa_id not in allowed:
            raise HTTPException(status_code=403, detail='Acesso negado ao relatório da empresa informada')
            
        params = {
            'empresa_id': empresa_id,
            'ug_id': ug_id,
            'classe_id': classe_id,
            'revisor_id': revisor_id,
            'periodo_inicio': periodo_inicio,
            'periodo_fim': periodo_fim,
            'status': status,
        }
        
        # Correção: passar allowed_company_ids
        q = _filters_query(db, params, allowed)
        items = q.all()
        
        rows = []
        for it in items:
            atual_total = (it.vida_util_periodos or 0)
            if atual_total == 0 and (it.vida_util_anos or 0) > 0:
                atual_total = (it.vida_util_anos or 0) * 12
            atual_anos = (atual_total // 12) if atual_total is not None else 0
            atual_meses = (atual_total % 12) if atual_total is not None else 0
            revisada_total = it.vida_util_revisada or 0
            revisada_anos = (revisada_total // 12) if revisada_total else 0
            revisada_meses = (revisada_total % 12) if revisada_total else 0
            revisor_nome = None
            try:
                if it.criado_por:
                    u = db.query(UsuarioModel).filter(UsuarioModel.id == it.criado_por).first()
                    revisor_nome = getattr(u, 'nome_completo', None) if u else None
            except Exception:
                revisor_nome = None
            rows.append({
                'Nº Imobilizado': getattr(it, 'numero_imobilizado', None),
                'Subnº': getattr(it, 'sub_numero', None),
                'Descrição': getattr(it, 'descricao', None),
                'Classe': getattr(it, 'classe', None),
                'Valor Aquisição': float(getattr(it, 'valor_aquisicao', 0) or 0),
                'Depreciação Acumulada': float(getattr(it, 'depreciacao_acumulada', 0) or 0),
                'Valor Contábil': float(getattr(it, 'valor_contabil', 0) or 0),
                'Vida Útil Atual (a)': atual_anos,
                'Vida Útil Atual (m)': atual_meses,
                'Vida Útil Revisada (a)': revisada_anos,
                'Vida Útil Revisada (m)': revisada_meses,
                'Data Início': getattr(it, 'data_inicio_depreciacao', None),
                'Data Fim Atual': getattr(it, 'data_fim_depreciacao', None),
                'Data Fim Revisada': getattr(it, 'data_fim_revisada', None),
                'Revisor': revisor_nome,
                'Status': getattr(it, 'status', None),
            })
        
        if not rows:
             # Retornar planilha vazia com cabeçalhos se não houver itens
             rows = [{'Mensagem': 'Nenhum item encontrado com os filtros aplicados'}]
             
        df = pd.DataFrame(rows)
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            # Aba 2: Detalhamento (implementação base)
            df.to_excel(writer, index=False, sheet_name='Detalhamento dos Ativos')
            # Demais abas como placeholders simples
            pd.DataFrame({'Info': ['Resumo Geral (placeholder)']}).to_excel(writer, index=False, sheet_name='Resumo Geral')
        
        output.seek(0)
        headers = {
            'Content-Disposition': 'attachment; filename="Relatorio_RVU.xlsx"'
        }
        return Response(content=output.getvalue(), media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', headers=headers)
        
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        print(f"Erro ao gerar Excel: {e}")
        raise HTTPException(status_code=500, detail=f"Erro interno ao gerar Excel: {str(e)}")

@router.get('/cronograma/excel')
def cronograma_excel(
    empresa_id: int | None = None,
    ug_id: int | None = None,
    classe_id: int | None = None,
    revisor_id: int | None = None,
    periodo_inicio: date | None = None,
    periodo_fim: date | None = None,
    status: str | None = None,
    item_id: int | None = None,
    current_user: UsuarioModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        import pandas as pd
    except Exception:
        raise HTTPException(status_code=500, detail="Dependências de Excel ausentes (pandas)")
    allowed = get_allowed_company_ids(db, current_user)
    if empresa_id is not None and allowed and empresa_id not in allowed:
        raise HTTPException(status_code=403, detail='Acesso negado ao cronograma da empresa informada')
    params = {
        'empresa_id': empresa_id,
        'ug_id': ug_id,
        'classe_id': classe_id,
        'revisor_id': revisor_id,
        'periodo_inicio': periodo_inicio,
        'periodo_fim': periodo_fim,
        'status': status,
    }
    q = _filters_query(db, params, allowed)
    if item_id is not None:
        q = q.filter(RevisaoItemModel.id == int(item_id))
    itens = q.all()
    rows = []
    for it in itens:
        start = getattr(it, 'data_inicio_depreciacao', None)
        end = _data_fim(it)
        if not start or not end:
            continue
        total_meses = _months_diff(start, end)
        valor_aquisicao = float(getattr(it, 'valor_aquisicao', 0) or 0)
        if total_meses <= 0 or valor_aquisicao <= 0:
            continue
        depreciacao_mensal = round(valor_aquisicao / total_meses, 2)
        saldo = valor_aquisicao
        for i in range(total_meses):
            periodo_data = _add_months(start, i)
            dep_mes = depreciacao_mensal
            if i == total_meses - 1:
                dep_mes = round(saldo, 2)
            saldo_final = round(saldo - dep_mes, 2)
            rows.append({
                'Nº Imobilizado': getattr(it, 'numero_imobilizado', None),
                'Subnº': getattr(it, 'sub_numero', None),
                'Descrição': getattr(it, 'descricao', None),
                'Classe': getattr(it, 'classe', None),
                'Período': periodo_data,
                'Saldo Inicial': round(saldo, 2),
                'Depreciação do Mês': dep_mes,
                'Saldo Final': saldo_final,
            })
            saldo = saldo_final
    df = pd.DataFrame(rows)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Cronograma Mensal')
    output.seek(0)
    headers = {
        'Content-Disposition': 'attachment; filename="Cronograma_RVU.xlsx"'
    }
    return Response(content=output.read(), media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', headers=headers)

@router.get('/pdf')
def pdf(empresa_id: int | None = None, ug_id: int | None = None, classe_id: int | None = None, revisor_id: int | None = None,
        periodo_inicio: date | None = None, periodo_fim: date | None = None, status: str | None = None,
        periodo_id: int | None = None,
        current_user: UsuarioModel = Depends(get_current_user),
        db: Session = Depends(get_db)):
    try:
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.lib import colors
    except Exception:
        raise HTTPException(status_code=500, detail="Dependências de PDF ausentes (reportlab)")
    
    allowed = get_allowed_company_ids(db, current_user)
    if empresa_id is not None and allowed and empresa_id not in allowed:
        raise HTTPException(status_code=403, detail='Acesso negado ao relatório da empresa informada')
    
    params = {
        'empresa_id': empresa_id,
        'ug_id': ug_id,
        'classe_id': classe_id,
        'revisor_id': revisor_id,
        'periodo_inicio': periodo_inicio,
        'periodo_fim': periodo_fim,
        'status': status,
        'periodo_id': periodo_id,
    }
    q = _filters_query(db, params, allowed)
    items = q.all()

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []
    story.append(Paragraph("Laudo de Revisão de Vidas Úteis dos Ativos Imobilizados", styles['Title']))
    story.append(Spacer(1, 12))
    story.append(Paragraph("Base normativa: CPC 27 / IAS 16 / Lei 11.638", styles['Normal']))
    story.append(Spacer(1, 12))

    if not items:
        story.append(Paragraph("Nenhum item encontrado com os filtros aplicados.", styles['Normal']))
    else:
        ajustados_por_classe = {}
        mantidos_por_classe = {}
        for it in items:
            atual_meses = _vida_meses_atual(it)
            revisada_meses = _vida_meses_revisada(it)
            classe = getattr(it, 'classe', '') or ''
            grupo = ajustados_por_classe if revisada_meses and revisada_meses != atual_meses else mantidos_por_classe
            if classe not in grupo:
                grupo[classe] = []
            grupo[classe].append((it, atual_meses, revisada_meses))

        def build_section(titulo, grupos):
            if not grupos:
                return
            story.append(Paragraph(titulo, styles['Heading2']))
            story.append(Spacer(1, 8))
            for classe in sorted(grupos.keys(), key=lambda x: str(x or '')):
                story.append(Paragraph(f"Classe {classe or '-'}", styles['Heading3']))
                story.append(Spacer(1, 4))
                data = [['Nº Imob', 'Sub', 'Descrição', 'V. Contábil', 'V.U. Atual', 'V.U. Ajustada', 'Status']]
                for it, atual_meses, revisada_meses in grupos[classe]:
                    desc = getattr(it, 'descricao', '') or ''
                    if len(desc) > 40:
                        desc = desc[:37] + '...'
                    row = [
                        str(getattr(it, 'numero_imobilizado', '')),
                        str(getattr(it, 'sub_numero', '')),
                        desc,
                        _format_money_br(getattr(it, 'valor_contabil', 0)),
                        _format_life_ym(atual_meses),
                        _format_life_ym(revisada_meses) if revisada_meses else _format_life_ym(atual_meses),
                        getattr(it, 'status', '') or ''
                    ]
                    data.append(row)
                t = Table(data, colWidths=[60, 35, 210, 80, 70, 70, 70], repeatRows=1)
                t.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
                    ('FONTSIZE', (0, 0), (-1, -1), 8),
                ]))
                story.append(t)
                story.append(Spacer(1, 12))

        build_section("Itens com vida útil ajustada", ajustados_por_classe)
        build_section("Itens com vida útil mantida", mantidos_por_classe)

    def add_page_number(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 8)
        width, height = doc.pagesize
        canvas.drawRightString(width - 40, 20, f"Página {doc.page}")
        canvas.restoreState()

    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return Response(content=pdf_bytes, media_type='application/pdf')

@router.get('/log')
def list_log(db: Session = Depends(get_db)):
    # Placeholder: se tabela existir, retornar vazia por enquanto
    return []
