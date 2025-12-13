import requests
import os

BASE_URL = "http://localhost:8000"

def login():
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", json={
            "identificador": "admin",
            "senha": "admin"  # Default password in seed might be 'admin' or 'admin123'
        })
        if resp.status_code != 200:
            # Try admin123
            resp = requests.post(f"{BASE_URL}/auth/login", json={
                "identificador": "admin",
                "senha": "admin123"
            })
        
        if resp.status_code == 200:
            return resp.json()["access_token"]
        print(f"Login failed: {resp.status_code} {resp.text}")
        return None
    except Exception as e:
        print(f"Connection error: {e}")
        return None

def debug():
    token = login()
    if not token:
        return

    headers = {"Authorization": f"Bearer {token}"}

    # List cronogramas
    print("\n--- Cronogramas ---")
    r = requests.get(f"{BASE_URL}/cronogramas", headers=headers)
    cronogramas = r.json()
    print(f"Count: {len(cronogramas)}")
    
    if not cronogramas:
        print("No cronogramas found.")
        return

    cid = cronogramas[0]["id"]
    print(f"Testing Cronograma ID: {cid}")

    # Resumo
    print("\n--- Resumo ---")
    r = requests.get(f"{BASE_URL}/cronogramas/{cid}/resumo", headers=headers)
    print(f"Status: {r.status_code}")
    print(f"Body: {r.text}")

    # Tarefas
    print("\n--- Tarefas ---")
    r = requests.get(f"{BASE_URL}/cronogramas/{cid}/tarefas", headers=headers)
    print(f"Status: {r.status_code}")
    print(f"Body: {r.text}")

    # Schema
    print("\n--- Schema: cronogramas_tarefas ---")
    r = requests.get(f"{BASE_URL}/debug/schema/cronogramas_tarefas", headers=headers)
    print(f"Body: {r.text}")

if __name__ == "__main__":
    debug()
