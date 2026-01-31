import sys
import os
from sqlalchemy import text

# Add backend directory to sys.path to allow imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from app.database import engine
except ImportError as e:
    print(f"Error importing app.database: {e}")
    sys.exit(1)

def run_sql(connection, sql_command):
    try:
        connection.execute(text(sql_command))
        print(f"SUCCESS: {sql_command}")
    except Exception as e:
        # Check for specific error messages to ignore "already exists" or "not found" if appropriate
        err_msg = str(e).lower()
        if "does not exist" in err_msg and "rename" in sql_command.lower():
            print(f"SKIPPED (Column/Table not found): {sql_command}")
        elif "already exists" in err_msg:
            print(f"SKIPPED (Already exists): {sql_command}")
        else:
            print(f"ERROR: {sql_command}\nDetails: {e}")

def fix_database():
    print("Starting Database Schema Revert...")
    
    with engine.connect() as connection:
        # Enable autocommit for DDL statements
        connection.execution_options(isolation_level="AUTOCOMMIT")
        
        # 1. Tabela usuarios
        print("\n--- Fixing table 'usuarios' ---")
        run_sql(connection, "ALTER TABLE usuarios RENAME COLUMN criado_em TO data_criacao")
        run_sql(connection, "ALTER TABLE usuarios RENAME COLUMN atualizado_em TO data_atualizacao")
        run_sql(connection, "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS empresa_id INTEGER REFERENCES companies(id)")
        run_sql(connection, "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ug_id INTEGER REFERENCES unidades_gerenciais(id)")
        run_sql(connection, "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS centro_custo_id INTEGER")
        # Optional: Drop new columns if desired, or leave them (safer to leave)
        
        # 2. Tabela revisoes_periodos
        print("\n--- Fixing table 'revisoes_periodos' ---")
        run_sql(connection, "ALTER TABLE revisoes_periodos RENAME COLUMN criado_por TO responsavel_id")
        run_sql(connection, "ALTER TABLE revisoes_periodos ADD COLUMN IF NOT EXISTS empresa_id INTEGER REFERENCES companies(id)")
        run_sql(connection, "ALTER TABLE revisoes_periodos ADD COLUMN IF NOT EXISTS ug_id INTEGER REFERENCES unidades_gerenciais(id)")
        run_sql(connection, "ALTER TABLE revisoes_periodos ADD COLUMN IF NOT EXISTS observacoes TEXT")
        run_sql(connection, "ALTER TABLE revisoes_periodos ADD COLUMN IF NOT EXISTS data_inicio_nova_vida_util DATE")

        # 3. Tabela revisoes_itens
        print("\n--- Fixing table 'revisoes_itens' ---")
        run_sql(connection, "ALTER TABLE revisoes_itens ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP DEFAULT NOW()")
        run_sql(connection, "ALTER TABLE revisoes_itens ADD COLUMN IF NOT EXISTS criado_por INTEGER REFERENCES usuarios(id)")
        # Try to convert back to integer if it was changed to numeric
        run_sql(connection, "ALTER TABLE revisoes_itens ALTER COLUMN vida_util_revisada TYPE INTEGER USING vida_util_revisada::integer")

        # 4. Tabela revisoes_delegacoes
        print("\n--- Fixing table 'revisoes_delegacoes' ---")
        run_sql(connection, "ALTER TABLE revisoes_delegacoes RENAME COLUMN usuario_destino_id TO revisor_id")
        run_sql(connection, "ALTER TABLE revisoes_delegacoes RENAME COLUMN usuario_origem_id TO atribuido_por")
        run_sql(connection, "ALTER TABLE revisoes_delegacoes RENAME COLUMN data_delegacao TO data_atribuicao")
        # Revert nullable if possible
        # run_sql(connection, "ALTER TABLE revisoes_delegacoes ALTER COLUMN ativo_id SET NOT NULL") 

        # 5. Tabela cronogramas
        print("\n--- Fixing table 'cronogramas' ---")
        run_sql(connection, "ALTER TABLE cronogramas RENAME COLUMN criado_por TO responsavel_id")
        run_sql(connection, "ALTER TABLE cronogramas RENAME COLUMN periodo_revisao_id TO periodo_id")
        run_sql(connection, "ALTER TABLE cronogramas ADD COLUMN IF NOT EXISTS progresso_percentual INTEGER DEFAULT 0")

        # 6. Tabela cronogramas_tarefas
        print("\n--- Fixing table 'cronogramas_tarefas' ---")
        run_sql(connection, "ALTER TABLE cronogramas_tarefas RENAME COLUMN titulo TO nome")
        run_sql(connection, "ALTER TABLE cronogramas_tarefas ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'Tarefa'")
        run_sql(connection, "ALTER TABLE cronogramas_tarefas ADD COLUMN IF NOT EXISTS progresso_percentual INTEGER DEFAULT 0")
        run_sql(connection, "ALTER TABLE cronogramas_tarefas ADD COLUMN IF NOT EXISTS dependente_tarefa_id INTEGER REFERENCES cronogramas_tarefas(id)")

        # 7. Tabela ativos (New table? If it exists, drop it? No, keep data just in case)
        # 8. Tabela notifications (New table? Keep it)
        # 9. Tabela contas_contabeis (New table? Keep it)
        # 10. Tabela classes_contabeis (New table? Keep it)
        
    print("\nDatabase Schema Revert operations completed.")

if __name__ == "__main__":
    fix_database()
