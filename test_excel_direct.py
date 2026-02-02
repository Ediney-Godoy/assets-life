import sys
import os
from datetime import date

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from app.database import SessionLocal
from app.models import Usuario as UsuarioModel
from app.routes.relatorios_rvu import excel
from fastapi import Response

def test_excel():
    db = SessionLocal()
    try:
        # Mock user
        user = db.query(UsuarioModel).first()
        if not user:
            print("No user found, cannot test")
            return

        print(f"Testing with user: {user.email}")
        
        # Call excel function
        # params: empresa_id=None, ug_id=None, classe_id=None, revisor_id=None, ...
        # Use default params (None) to fetch all
        try:
            response = excel(
                empresa_id=None, 
                ug_id=None, 
                classe_id=None, 
                revisor_id=None,
                periodo_inicio=None, 
                periodo_fim=None, 
                status=None,
                current_user=user, 
                db=db
            )
            
            print("Response received.")
            if isinstance(response, Response):
                content_len = len(response.body)
                print(f"Response body length: {content_len} bytes")
                if content_len > 0:
                    print("Excel generation successful (content present).")
                    with open("test_output.xlsx", "wb") as f:
                        f.write(response.body)
                    print("Saved to test_output.xlsx")
                else:
                    print("Excel generation failed (empty body).")
            else:
                print(f"Unexpected response type: {type(response)}")
        except Exception as e:
             print(f"Function call raised exception: {e}")
             import traceback
             traceback.print_exc()

    except Exception as e:
        print(f"Error testing excel setup: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_excel()
