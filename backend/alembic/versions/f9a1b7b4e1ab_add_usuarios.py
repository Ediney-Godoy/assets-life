"""add usuarios

Revision ID: f9a1b7b4e1ab
Revises: a05988ccdc3e
Create Date: 2025-10-25

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'f9a1b7b4e1ab'
down_revision: Union[str, Sequence[str], None] = '7d4d4a15617b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Verificar se a tabela já existe
    connection = op.get_bind()
    result = connection.execute(sa.text("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'usuarios'
        )
    """))
    table_exists = result.scalar()
    
    if not table_exists:
        op.create_table(
            'usuarios',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('codigo', sa.String(length=20), nullable=False),
            sa.Column('nome_completo', sa.String(length=150), nullable=False),
            sa.Column('email', sa.String(length=120), nullable=False),
            sa.Column('senha_hash', sa.Text(), nullable=False),
            sa.Column('cpf', sa.String(length=14), nullable=False),
            sa.Column('nome_usuario', sa.String(length=60), nullable=False),
            sa.Column('data_nascimento', sa.Date(), nullable=True),
            sa.Column('empresa_id', sa.Integer(), nullable=True),
            sa.Column('ug_id', sa.Integer(), nullable=True),
            sa.Column('centro_custo_id', sa.Integer(), nullable=True),
            sa.Column('status', sa.String(length=10), nullable=False, server_default='Ativo'),
            sa.Column('data_criacao', sa.DateTime(), server_default=sa.func.now(), nullable=False),
            sa.Column('data_atualizacao', sa.DateTime(), server_default=sa.func.now(), nullable=False),
            sa.ForeignKeyConstraint(['empresa_id'], ['companies.id']),
            sa.ForeignKeyConstraint(['ug_id'], ['unidades_gerenciais.id']),
        )
        op.create_index(op.f('ix_usuarios_id'), 'usuarios', ['id'])
        op.create_index(op.f('ix_usuarios_codigo'), 'usuarios', ['codigo'], unique=True)
        op.create_index(op.f('ix_usuarios_email'), 'usuarios', ['email'], unique=True)
        op.create_index(op.f('ix_usuarios_cpf'), 'usuarios', ['cpf'], unique=True)
        op.create_index(op.f('ix_usuarios_nome_usuario'), 'usuarios', ['nome_usuario'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_usuarios_nome_usuario'), table_name='usuarios')
    op.drop_index(op.f('ix_usuarios_cpf'), table_name='usuarios')
    op.drop_index(op.f('ix_usuarios_email'), table_name='usuarios')
    op.drop_index(op.f('ix_usuarios_codigo'), table_name='usuarios')
    op.drop_index(op.f('ix_usuarios_id'), table_name='usuarios')
    op.drop_table('usuarios')