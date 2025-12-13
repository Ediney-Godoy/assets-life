"""
Add cronogramas_tarefas_evidencias table

Revision ID: c6d7e8f9a0b1
Revises: b5d6e7f8a9b0
Create Date: 2025-12-13
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'c6d7e8f9a0b1'
down_revision = 'b5d6e7f8a9b0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    connection = op.get_bind()
    exists = connection.execute(sa.text("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
              AND table_name = 'cronogramas_tarefas_evidencias'
        )
    """)).scalar()

    if not exists:
        op.create_table(
            'cronogramas_tarefas_evidencias',
            sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
            sa.Column('tarefa_id', sa.Integer(), sa.ForeignKey('cronogramas_tarefas.id'), nullable=False),
            sa.Column('nome_arquivo', sa.String(length=255), nullable=False),
            sa.Column('content_type', sa.String(length=100), nullable=False),
            sa.Column('tamanho_bytes', sa.Integer(), nullable=False),
            sa.Column('conteudo', sa.LargeBinary(), nullable=False),
            sa.Column('criado_em', sa.DateTime(), server_default=sa.func.now(), nullable=False),
            sa.Column('uploaded_by', sa.Integer(), sa.ForeignKey('usuarios.id'), nullable=True),
        )
        op.create_index(op.f('ix_cronogramas_tarefas_evidencias_id'), 'cronogramas_tarefas_evidencias', ['id'], unique=False)
        op.create_index(op.f('ix_cronogramas_tarefas_evidencias_tarefa_id'), 'cronogramas_tarefas_evidencias', ['tarefa_id'], unique=False)
        op.create_index(op.f('ix_cronogramas_tarefas_evidencias_uploaded_by'), 'cronogramas_tarefas_evidencias', ['uploaded_by'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_cronogramas_tarefas_evidencias_uploaded_by'), table_name='cronogramas_tarefas_evidencias')
    op.drop_index(op.f('ix_cronogramas_tarefas_evidencias_tarefa_id'), table_name='cronogramas_tarefas_evidencias')
    op.drop_index(op.f('ix_cronogramas_tarefas_evidencias_id'), table_name='cronogramas_tarefas_evidencias')
    op.drop_table('cronogramas_tarefas_evidencias')
