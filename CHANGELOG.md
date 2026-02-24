# Changelog

## v0.1.0 (RVU Cronograma Mensal) — 2025-11-08

- Backend: adicionados endpoints para cronograma mensal de depreciação:
  - `GET /relatorios/rvu/cronograma` (JSON)
  - `GET /relatorios/rvu/cronograma/excel` (XLSX)
- Backend: helpers para cálculo de meses e data fim considerando vida útil revisada.
- Backend: ajustes de segurança nos relatórios com validação de empresas permitidas.
- Frontend: melhorias nas páginas de relatórios e supervisão RVU; suporte a downloads binários (PDF/Excel) e resolução automática da base da API via `/health`.
- Infra: arquivo de migração Alembic adicionado para futuras tabelas auxiliares RVU.

### Observações
- Para usar a exportação Excel é necessário `pandas` e `openpyxl` no backend.
- O frontend (Vite) roda por padrão em `http://localhost:5180` e detecta o backend em `http://localhost:8000` ou pelo mesmo `hostname` da rede.
- Endpoints de relatórios exigem autenticação por token Bearer.

### Próximos passos sugeridos
- Adicionar relatório “Mapa Mensal” e “Nota Explicativa”.
- Suporte a valor residual no cronograma (se aplicável).
- Suite de testes (pytest) e rotação de logs.