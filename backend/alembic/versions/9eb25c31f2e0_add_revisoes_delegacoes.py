"""add revisoes_delegacoes

Revision ID: 9eb25c31f2e0
Revises: b2d969f7a4d1
Create Date: 2025-10-26

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '9eb25c31f2e0'
down_revision: Union[str, Sequence[str], None] = 'b2d969f7a4d1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'revisoes_delegacoes',
        sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
        sa.Column('periodo_id', sa.Integer(), sa.ForeignKey('revisoes_periodos.id'), nullable=False),
        sa.Column('ativo_id', sa.Integer(), sa.ForeignKey('revisoes_itens.id'), nullable=False),
        sa.Column('revisor_id', sa.Integer(), sa.ForeignKey('usuarios.id'), nullable=False),
        sa.Column('data_atribuicao', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('atribuido_por', sa.Integer(), sa.ForeignKey('usuarios.id'), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='Ativo'),
    )

    # Indexes
    op.create_index(op.f('ix_revisoes_delegacoes_id'), 'revisoes_delegacoes', ['id'], unique=False)
    op.create_index(op.f('ix_revisoes_delegacoes_periodo_id'), 'revisoes_delegacoes', ['periodo_id'], unique=False)
    op.create_index(op.f('ix_revisoes_delegacoes_ativo_id'), 'revisoes_delegacoes', ['ativo_id'], unique=False)
    op.create_index(op.f('ix_revisoes_delegacoes_revisor_id'), 'revisoes_delegacoes', ['revisor_id'], unique=False)
    op.create_index(op.f('ix_revisoes_delegacoes_atribuido_por'), 'revisoes_delegacoes', ['atribuido_por'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_revisoes_delegacoes_atribuido_por'), table_name='revisoes_delegacoes')
    op.drop_index(op.f('ix_revisoes_delegacoes_revisor_id'), table_name='revisoes_delegacoes')
    op.drop_index(op.f('ix_revisoes_delegacoes_ativo_id'), table_name='revisoes_delegacoes')
    op.drop_index(op.f('ix_revisoes_delegacoes_periodo_id'), table_name='revisoes_delegacoes')
    op.drop_index(op.f('ix_revisoes_delegacoes_id'), table_name='revisoes_delegacoes')
    op.drop_table('revisoes_delegacoes')