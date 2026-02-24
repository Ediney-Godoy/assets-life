"""
Merge heads to unify migration branches

Revision ID: ee1122334455
Revises: 0b7e8f21c3ab, 9eb25c31f2e0
Create Date: 2025-10-28
"""

from alembic import op
import sqlalchemy as sa

revision = 'ee1122334455'
down_revision = ('0b7e8f21c3ab', '9eb25c31f2e0')
branch_labels = None
depends_on = None


def upgrade():
    # No-op merge migration: unify branches
    pass


def downgrade():
    # No-op downgrade for merge revision
    pass