"""Merge heads

Revision ID: bf5edff61642
Revises: 1b3a5c7e9d00, 8c7d9e2f1a00, d1e2f3g4h5i6
Create Date: 2026-02-01 17:21:47.890879

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bf5edff61642'
down_revision: Union[str, Sequence[str], None] = ('1b3a5c7e9d00', '8c7d9e2f1a00', 'd1e2f3g4h5i6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
