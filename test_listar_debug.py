import sys
import os
import requests
from datetime import datetime, timedelta
from jose import jwt

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from app.database import SessionLocal
from app.models import Usuario as UsuarioModel

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-prod")
ALGORITHM = "HS256"

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=30)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def test_listar():
    db = SessionLocal()
    user = db.query(UsuarioModel).first()
    if not user:
        print("No user found")
        return
    
    token = create_access_token({"sub": str(user.id)})
    db.close()
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Assuming backend is running on port 8000
    url = "http://localhost:8000/supervisao/rvu/listar"
    # Filter for Period 1 as seen in debug_assets.py
    params = {"periodo_id": 1}
    
    try:
        print(f"Requesting {url} with params {params}")
        resp = requests.get(url, headers=headers, params=params)
        if resp.status_code == 200:
            data = resp.json()
            print(f"Success! Received {len(data)} items.")
            
            import json
            with open('debug_data.json', 'w') as f:
                json.dump(data, f)
            print("Dumped data to debug_data.json")
            
            # Client-side calc check
            main_items = [x for x in data if float(str(x.get('sub_numero') or 0)) == 0]
            print(f"Main items in response: {len(main_items)}")
            
            # Note: Grouping logic is needed for accurate count, but simple count gives a hint
            # Let's count how many main items have 0 value
            zero_val_main = [x for x in main_items if abs(float(x.get('valor_contabil') or 0)) < 0.01]
            print(f"Main items with 0 value (naive check): {len(zero_val_main)}")
            
        else:
            print(f"Failed: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_listar()
