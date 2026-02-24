"""Add conta_contabil_id to classes_contabeis

Revision ID: c0b1d7de8c3f
Revises: f05090aaded8
Create Date: 2026-02-01 18:39:31.500032

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'c0b1d7de8c3f'
down_revision: Union[str, Sequence[str], None] = 'f05090aaded8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('classes_contabeis', sa.Column('conta_contabil_id', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_classes_contabeis_conta_contabil_id'), 'classes_contabeis', ['conta_contabil_id'], unique=False)
    op.create_foreign_key(None, 'classes_contabeis', 'contas_contabeis', ['conta_contabil_id'], ['id'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(None, 'classes_contabeis', type_='foreignkey')
    op.drop_index(op.f('ix_classes_contabeis_conta_contabil_id'), table_name='classes_contabeis')
    op.drop_column('classes_contabeis', 'conta_contabil_id')
