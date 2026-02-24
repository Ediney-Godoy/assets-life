#!/usr/bin/env python3
"""Gera uma SECRET_KEY segura para uso em produção."""
import secrets

if __name__ == "__main__":
    key = secrets.token_urlsafe(32)
    print(f"\n🔑 SECRET_KEY gerada:")
    print(f"{key}\n")
    print("⚠️  IMPORTANTE: Guarde esta chave em local seguro!")
    print("   Use-a na variável de ambiente SECRET_KEY do seu backend.\n")

