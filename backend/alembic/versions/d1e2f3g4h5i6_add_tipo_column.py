"""
Add tipo column to cronogramas_tarefas

Revision ID: d1e2f3g4h5i6
Revises: c6d7e8f9a0b1
Create Date: 2025-12-13
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd1e2f3g4h5i6'
down_revision = 'c6d7e8f9a0b1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    connection = op.get_bind()
    # Check if column exists
    columns = sa.inspect(connection).get_columns('cronogramas_tarefas')
    col_names = [c['name'] for c in columns]
    
    if 'tipo' not in col_names:
        op.add_column('cronogramas_tarefas', sa.Column('tipo', sa.String(length=20), nullable=False, server_default='Tarefa'))


def downgrade() -> None:
    op.drop_column('cronogramas_tarefas', 'tipo')
