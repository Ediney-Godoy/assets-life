"""add centros_custos

Revision ID: 0b7e8f21c3ab
Revises: c3fbd2a1e9a7
Create Date: 2025-10-26

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0b7e8f21c3ab'
down_revision: Union[str, Sequence[str], None] = 'c3fbd2a1e9a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'centros_custos',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('codigo', sa.String(length=50), nullable=False, unique=True),
        sa.Column('nome', sa.String(length=150), nullable=False),
        sa.Column('empresa_id', sa.Integer(), sa.ForeignKey('companies.id'), nullable=False),
        sa.Column('ug_id', sa.Integer(), sa.ForeignKey('unidades_gerenciais.id'), nullable=False),
        sa.Column('responsavel_id', sa.Integer(), sa.ForeignKey('employees.id'), nullable=True),
        sa.Column('observacoes', sa.Text(), nullable=True),
        sa.Column('data_criacao', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('criado_por', sa.Integer(), sa.ForeignKey('usuarios.id'), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='Ativo'),
    )
    op.create_index(op.f('ix_centros_custos_id'), 'centros_custos', ['id'], unique=False)
    op.create_index(op.f('ix_centros_custos_codigo'), 'centros_custos', ['codigo'], unique=True)
    op.create_index(op.f('ix_centros_custos_empresa_id'), 'centros_custos', ['empresa_id'], unique=False)
    op.create_index(op.f('ix_centros_custos_ug_id'), 'centros_custos', ['ug_id'], unique=False)
    op.create_index(op.f('ix_centros_custos_responsavel_id'), 'centros_custos', ['responsavel_id'], unique=False)
    op.create_index(op.f('ix_centros_custos_criado_por'), 'centros_custos', ['criado_por'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_centros_custos_criado_por'), table_name='centros_custos')
    op.drop_index(op.f('ix_centros_custos_responsavel_id'), table_name='centros_custos')
    op.drop_index(op.f('ix_centros_custos_ug_id'), table_name='centros_custos')
    op.drop_index(op.f('ix_centros_custos_empresa_id'), table_name='centros_custos')
    op.drop_index(op.f('ix_centros_custos_codigo'), table_name='centros_custos')
    op.drop_index(op.f('ix_centros_custos_id'), table_name='centros_custos')
    op.drop_table('centros_custos')