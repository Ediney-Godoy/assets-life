"""
Add descricao_classe to revisoes_itens

Revision ID: 1b3a5c7e9d00
Revises: d1a2b3c4e5f6
Create Date: 2025-12-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '1b3a5c7e9d00'
down_revision: Union[str, Sequence[str], None] = 'd1a2b3c4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add column if not exists (Postgres friendly pattern via conditional)
    conn = op.get_bind()
    exists = conn.execute(sa.text(
        """
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name='revisoes_itens' AND column_name='descricao_classe'
        )
        """
    )).scalar()
    if not exists:
        op.add_column('revisoes_itens', sa.Column('descricao_classe', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('revisoes_itens', 'descricao_classe')

