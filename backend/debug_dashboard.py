
import sys
import os
from dotenv import load_dotenv

# Manually read .env and set env vars because standard loading is failing for some reason
try:
    with open('.env', 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'): continue
            if '=' in line:
                k, v = line.split('=', 1)
                os.environ[k] = v
                print(f"Set {k}")
except Exception as e:
    print(f"Error reading .env: {e}")

sys.path.append(os.getcwd())

# Now import app modules
from app.config import DATABASE_URL
print(f"DATABASE_URL: {DATABASE_URL}")

from app.database import SessionLocal
from app.models import RevisaoItem as RevisaoItemModel, RevisaoPeriodo as RevisaoPeriodoModel

db = SessionLocal()

# 1. Get latest period for the first company (simulating dashboard)
period = db.query(RevisaoPeriodoModel).order_by(RevisaoPeriodoModel.id.desc()).first()
if not period:
    print("No period found")
    sys.exit()

print(f"Period: {period.id} - {period.descricao}")

# 2. Get all items for this period
items = db.query(RevisaoItemModel).filter(RevisaoItemModel.periodo_id == period.id).all()
print(f"Total Items: {len(items)}")

# 3. Calculate 'Revisado' based on 4 conditions
reviewed_count = 0
for i in items:
    # 1. Status
    s = (i.status or '').lower().replace('á', 'a').replace('í', 'i').replace('ã', 'a')
    status_ok = s in ['revisado', 'revisada', 'aprovado', 'concluido']
    
    # 2. Alterado
    altered = bool(i.alterado)
    
    # 3. Justificativa
    has_just = bool((i.justificativa or '').strip())
    
    # 4. Condicao Fisica
    has_cond = bool((i.condicao_fisica or '').strip())
    
    if status_ok or altered or has_just or has_cond:
        reviewed_count += 1

print(f"Reviewed Items (Python Logic): {reviewed_count}")

# 4. Calculate Fully Depreciated
# Group by numero_imobilizado
groups = {}
for i in items:
    key = str(i.numero_imobilizado or '')
    if key not in groups:
        groups[key] = []
    groups[key].append(i)

fully_depreciated_count = 0
for i in items:
    try:
        sub = int(i.sub_numero)
    except:
        sub = -1
        
    if sub == 0:
        key = str(i.numero_imobilizado or '')
        group = groups.get(key, [])
        total_val = sum([float(x.valor_contabil or 0) for x in group])
        # Debug print for first few candidates
        if abs(total_val) < 0.01 and fully_depreciated_count < 5:
            print(f"Found depreciated candidate: {i.numero_imobilizado}, Total Val: {total_val}")
            
        if abs(total_val) < 0.01:
            fully_depreciated_count += 1

print(f"Fully Depreciated (Python Logic): {fully_depreciated_count}")
