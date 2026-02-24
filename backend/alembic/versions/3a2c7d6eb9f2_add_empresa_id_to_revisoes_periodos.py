"""add empresa_id to revisoes_periodos

Revision ID: 3a2c7d6eb9f2
Revises: 695574aa1802
Create Date: 2025-10-25

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '3a2c7d6eb9f2'
down_revision: Union[str, Sequence[str], None] = '695574aa1802'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Verificar se a coluna já existe
    connection = op.get_bind()
    result = connection.execute(sa.text("""
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'revisoes_periodos'
            AND column_name = 'empresa_id'
        )
    """))
    column_exists = result.scalar()
    
    if not column_exists:
        # add empresa_id column (non-nullable) with FK to companies.id
        op.add_column('revisoes_periodos', sa.Column('empresa_id', sa.Integer(), nullable=False))
        op.create_foreign_key('fk_revisoes_periodos_empresa', 'revisoes_periodos', 'companies', ['empresa_id'], ['id'])
        op.create_index(op.f('ix_revisoes_periodos_empresa_id'), 'revisoes_periodos', ['empresa_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_revisoes_periodos_empresa_id'), table_name='revisoes_periodos')
    op.drop_constraint('fk_revisoes_periodos_empresa', 'revisoes_periodos', type_='foreignkey')
    op.drop_column('revisoes_periodos', 'empresa_id')