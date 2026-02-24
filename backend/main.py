"""
Wrapper module para compatibilidade com uvicorn.
Este arquivo permite que o uvicorn encontre o app FastAPI usando 'main:app'
"""
from app.main import app

__all__ = ['app']

