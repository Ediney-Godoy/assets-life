"""Add unique constraint to cronogramas period_id

Revision ID: b5d6e7f8a9b0
Revises: a4c5d6e7f8a9
Create Date: 2025-12-12
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'b5d6e7f8a9b0'
down_revision = 'a4c5d6e7f8a9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop the existing non-unique index
    op.drop_index('ix_cronogramas_periodo_id', table_name='cronogramas')
    
    # Create the unique constraint
    op.create_unique_constraint('uq_cronogramas_periodo_id', 'cronogramas', ['periodo_id'])


def downgrade() -> None:
    # Drop the unique constraint
    op.drop_constraint('uq_cronogramas_periodo_id', 'cronogramas', type_='unique')
    
    # Recreate the non-unique index
    op.create_index('ix_cronogramas_periodo_id', 'cronogramas', ['periodo_id'], unique=False)
