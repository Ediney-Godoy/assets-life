import uvicorn
import sys
import os

sys.path.append(os.getcwd())

if __name__ == "__main__":
    try:
        print("Importing app...", flush=True)
        from app.main import app
        print("Starting server...", flush=True)
        uvicorn.run(app, host="127.0.0.1", port=8001)
    except SystemExit as e:
        print(f"SystemExit: {e}")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
