"""
Add ordem column to cronogramas_tarefas

Revision ID: f3a2b1c4d5e6
Revises: e1f2a3b4c5d6
Create Date: 2026-03-13
"""

from alembic import op
import sqlalchemy as sa


revision = "f3a2b1c4d5e6"
down_revision = "e1f2a3b4c5d6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    connection = op.get_bind()
    columns = sa.inspect(connection).get_columns("cronogramas_tarefas")
    col_names = [c["name"] for c in columns]

    if "ordem" not in col_names:
        op.add_column(
            "cronogramas_tarefas",
            sa.Column("ordem", sa.Integer(), nullable=False, server_default="0"),
        )
        op.execute(sa.text("UPDATE cronogramas_tarefas SET ordem = id WHERE ordem = 0"))


def downgrade() -> None:
    op.drop_column("cronogramas_tarefas", "ordem")

