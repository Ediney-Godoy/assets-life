"""add ug_id to revisoes_periodos

Revision ID: c3fbd2a1e9a7
Revises: 9eb25c31f2e0
Create Date: 2025-10-26

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3fbd2a1e9a7'
down_revision: Union[str, Sequence[str], None] = '9eb25c31f2e0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # add ug_id column (nullable) with FK to unidades_gerenciais.id
    op.add_column('revisoes_periodos', sa.Column('ug_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_revisoes_periodos_ug',
        'revisoes_periodos',
        'unidades_gerenciais',
        ['ug_id'],
        ['id']
    )
    op.create_index(op.f('ix_revisoes_periodos_ug_id'), 'revisoes_periodos', ['ug_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_revisoes_periodos_ug_id'), table_name='revisoes_periodos')
    op.drop_constraint('fk_revisoes_periodos_ug', 'revisoes_periodos', type_='foreignkey')
    op.drop_column('revisoes_periodos', 'ug_id')