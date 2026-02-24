import os
import sys
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Ajusta sys.path para importar pacotes do backend
ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = ROOT / "backend" / "app"
for p in [str(ROOT), str(BACKEND_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from app.database import SessionLocal
from app.models import Usuario as UsuarioModel
import bcrypt

def ensure_admin():
    db = SessionLocal()
    try:
        existing = db.query(UsuarioModel).filter(UsuarioModel.nome_usuario == "admin").first()
        if existing:
            print("Admin user already exists: admin")
            return
        senha_hash = bcrypt.hashpw("admin123".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        # gerar próximo código simples
        last = db.query(UsuarioModel.id).order_by(UsuarioModel.id.desc()).first()
        next_num = (last[0] if last else 0) + 1
        codigo = f"{next_num:06d}"
        u = UsuarioModel(
            codigo=codigo,
            nome_completo="Administrador",
            email="admin@local",
            senha_hash=senha_hash,
            cpf="00000000000",
            nome_usuario="admin",
            status="Ativo",
        )
        db.add(u)
        db.commit()
        print("Admin user created: admin / admin123")
    finally:
        db.close()

if __name__ == "__main__":
    ensure_admin()