"""add revisoes_itens

Revision ID: b2d969f7a4d1
Revises: 3a2c7d6eb9f2
Create Date: 2025-10-25

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'b2d969f7a4d1'
down_revision: Union[str, Sequence[str], None] = '3a2c7d6eb9f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Verificar se a tabela já existe
    connection = op.get_bind()
    result = connection.execute(sa.text("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'revisoes_itens'
        )
    """))
    table_exists = result.scalar()
    
    if not table_exists:
        # Create revisoes_itens table matching app.models.RevisaoItem
        op.create_table(
            'revisoes_itens',
        sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
        sa.Column('periodo_id', sa.Integer(), sa.ForeignKey('revisoes_periodos.id'), nullable=False),

        sa.Column('numero_imobilizado', sa.String(length=50), nullable=False),
        sa.Column('sub_numero', sa.String(length=10), nullable=False),
        sa.Column('descricao', sa.Text(), nullable=False),

        sa.Column('data_inicio_depreciacao', sa.Date(), nullable=False),
        sa.Column('data_fim_depreciacao', sa.Date(), nullable=True),

        sa.Column('valor_aquisicao', sa.Numeric(18, 2), nullable=False),
        sa.Column('depreciacao_acumulada', sa.Numeric(18, 2), nullable=False),
        sa.Column('valor_contabil', sa.Numeric(18, 2), nullable=False),

        sa.Column('centro_custo', sa.String(length=100), nullable=False),
        sa.Column('classe', sa.String(length=100), nullable=False),
        sa.Column('conta_contabil', sa.String(length=50), nullable=False),
        sa.Column('descricao_conta_contabil', sa.Text(), nullable=False),

        sa.Column('vida_util_anos', sa.Integer(), nullable=False),
        sa.Column('vida_util_periodos', sa.Integer(), nullable=False),

        sa.Column('auxiliar2', sa.Text(), nullable=True),
        sa.Column('auxiliar3', sa.Text(), nullable=True),

        sa.Column('status', sa.String(length=20), nullable=False, server_default='Pendente'),
        sa.Column('criado_em', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        )

        # Indexes for faster lookup
        op.create_index(op.f('ix_revisoes_itens_id'), 'revisoes_itens', ['id'], unique=False)
        op.create_index(op.f('ix_revisoes_itens_periodo_id'), 'revisoes_itens', ['periodo_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_revisoes_itens_periodo_id'), table_name='revisoes_itens')
    op.drop_index(op.f('ix_revisoes_itens_id'), table_name='revisoes_itens')
    op.drop_table('revisoes_itens')