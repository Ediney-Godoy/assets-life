"""
Add cronogramas and cronogramas_tarefas tables

Revision ID: a4c5d6e7f8a9
Revises: d1a2b3c4e5f6
Create Date: 2025-12-06
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'a4c5d6e7f8a9'
down_revision = 'd1a2b3c4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    connection = op.get_bind()

    # cronogramas
    exists = connection.execute(sa.text("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
              AND table_name = 'cronogramas'
        )
    """)).scalar()
    if not exists:
        op.create_table(
            'cronogramas',
            sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
            sa.Column('periodo_id', sa.Integer(), sa.ForeignKey('revisoes_periodos.id'), nullable=False),
            sa.Column('empresa_id', sa.Integer(), sa.ForeignKey('companies.id'), nullable=False),
            sa.Column('responsavel_id', sa.Integer(), sa.ForeignKey('usuarios.id'), nullable=False),
            sa.Column('descricao', sa.Text(), nullable=True),
            sa.Column('status', sa.String(length=20), nullable=False, server_default='Aberto'),
            sa.Column('progresso_percentual', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('criado_em', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        )
        op.create_index(op.f('ix_cronogramas_id'), 'cronogramas', ['id'], unique=False)
        op.create_index(op.f('ix_cronogramas_periodo_id'), 'cronogramas', ['periodo_id'], unique=False)
        op.create_index(op.f('ix_cronogramas_empresa_id'), 'cronogramas', ['empresa_id'], unique=False)
        op.create_index(op.f('ix_cronogramas_responsavel_id'), 'cronogramas', ['responsavel_id'], unique=False)

    # cronogramas_tarefas
    exists_t = connection.execute(sa.text("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
              AND table_name = 'cronogramas_tarefas'
        )
    """)).scalar()
    if not exists_t:
        op.create_table(
            'cronogramas_tarefas',
            sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
            sa.Column('cronograma_id', sa.Integer(), sa.ForeignKey('cronogramas.id'), nullable=False),
            sa.Column('nome', sa.String(length=150), nullable=False),
            sa.Column('descricao', sa.Text(), nullable=True),
            sa.Column('data_inicio', sa.Date(), nullable=True),
            sa.Column('data_fim', sa.Date(), nullable=True),
            sa.Column('responsavel_id', sa.Integer(), sa.ForeignKey('usuarios.id'), nullable=True),
            sa.Column('status', sa.String(length=20), nullable=False, server_default='Pendente'),
            sa.Column('progresso_percentual', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('dependente_tarefa_id', sa.Integer(), sa.ForeignKey('cronogramas_tarefas.id'), nullable=True),
            sa.Column('criado_em', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        )
        op.create_index(op.f('ix_cronogramas_tarefas_id'), 'cronogramas_tarefas', ['id'], unique=False)
        op.create_index(op.f('ix_cronogramas_tarefas_cronograma_id'), 'cronogramas_tarefas', ['cronograma_id'], unique=False)
        op.create_index(op.f('ix_cronogramas_tarefas_responsavel_id'), 'cronogramas_tarefas', ['responsavel_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_cronogramas_tarefas_responsavel_id'), table_name='cronogramas_tarefas')
    op.drop_index(op.f('ix_cronogramas_tarefas_cronograma_id'), table_name='cronogramas_tarefas')
    op.drop_index(op.f('ix_cronogramas_tarefas_id'), table_name='cronogramas_tarefas')
    op.drop_table('cronogramas_tarefas')

    op.drop_index(op.f('ix_cronogramas_responsavel_id'), table_name='cronogramas')
    op.drop_index(op.f('ix_cronogramas_empresa_id'), table_name='cronogramas')
    op.drop_index(op.f('ix_cronogramas_periodo_id'), table_name='cronogramas')
    op.drop_index(op.f('ix_cronogramas_id'), table_name='cronogramas')
    op.drop_table('cronogramas')

