"""add revisoes_periodos

Revision ID: 695574aa1802
Revises: f9a1b7b4e1ab
Create Date: 2025-10-25 15:20:07.455565

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '695574aa1802'
down_revision: Union[str, Sequence[str], None] = 'f9a1b7b4e1ab'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Verificar se a tabela já existe
    connection = op.get_bind()
    result = connection.execute(sa.text("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'revisoes_periodos'
        )
    """))
    table_exists = result.scalar()
    
    if not table_exists:
        op.create_table(
            'revisoes_periodos',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('codigo', sa.String(length=20), nullable=False, unique=True, index=True),
            sa.Column('descricao', sa.Text(), nullable=False),
            sa.Column('data_abertura', sa.Date(), nullable=False),
            sa.Column('data_fechamento_prevista', sa.Date(), nullable=False),
            sa.Column('data_fechamento', sa.Date(), nullable=True),
            sa.Column('responsavel_id', sa.Integer(), sa.ForeignKey('usuarios.id'), nullable=False, index=True),
            sa.Column('status', sa.String(length=20), nullable=False),
            sa.Column('observacoes', sa.Text(), nullable=True),
            sa.Column('criado_em', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        )


def downgrade() -> None:
    op.drop_table('revisoes_periodos')
