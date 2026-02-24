"""
Add fields for Revisão de Vidas Úteis

Revision ID: d1a2b3c4e5f6
Revises: 9eb25c31f2e0
Create Date: 2025-10-28
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'd1a2b3c4e5f6'
down_revision = 'ee1122334455'
branch_labels = None
depends_on = None


def upgrade():
    # Add data_inicio_nova_vida_util to revisoes_periodos
    op.add_column('revisoes_periodos', sa.Column('data_inicio_nova_vida_util', sa.Date(), nullable=True))

    # Add review fields to revisoes_itens
    op.add_column('revisoes_itens', sa.Column('vida_util_revisada', sa.Integer(), nullable=True))
    op.add_column('revisoes_itens', sa.Column('data_fim_revisada', sa.Date(), nullable=True))
    op.add_column('revisoes_itens', sa.Column('condicao_fisica', sa.String(length=20), nullable=True))
    op.add_column('revisoes_itens', sa.Column('justificativa', sa.Text(), nullable=True))
    op.add_column('revisoes_itens', sa.Column('alterado', sa.Boolean(), nullable=False, server_default=sa.text('false')))
    op.add_column('revisoes_itens', sa.Column('criado_por', sa.Integer(), nullable=True))
    # Optional: index for criado_por
    op.create_index('ix_revisoes_itens_criado_por', 'revisoes_itens', ['criado_por'], unique=False)


def downgrade():
    # Drop index and columns from revisoes_itens
    op.drop_index('ix_revisoes_itens_criado_por', table_name='revisoes_itens')
    op.drop_column('revisoes_itens', 'criado_por')
    op.drop_column('revisoes_itens', 'alterado')
    op.drop_column('revisoes_itens', 'justificativa')
    op.drop_column('revisoes_itens', 'condicao_fisica')
    op.drop_column('revisoes_itens', 'data_fim_revisada')
    op.drop_column('revisoes_itens', 'vida_util_revisada')

    # Drop data_inicio_nova_vida_util from revisoes_periodos
    op.drop_column('revisoes_periodos', 'data_inicio_nova_vida_util')