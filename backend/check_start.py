import sys
import os

print("Starting check...", flush=True)
sys.path.append(os.getcwd())

try:
    print("Importing app.main...", flush=True)
    from app.main import app
    print("Import Success", flush=True)
except Exception as e:
    print(f"Import Failed: {e}", flush=True)
    import traceback
    traceback.print_exc()
