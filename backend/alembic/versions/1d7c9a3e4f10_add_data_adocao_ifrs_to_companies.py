"""
Add data_adocao_ifrs to companies

Revision ID: 1d7c9a3e4f10
Revises: f3a2b1c4d5e6
Create Date: 2026-03-24
"""

from alembic import op
import sqlalchemy as sa


revision = "1d7c9a3e4f10"
down_revision = "f3a2b1c4d5e6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    connection = op.get_bind()
    columns = sa.inspect(connection).get_columns("companies")
    col_names = [c["name"] for c in columns]
    if "data_adocao_ifrs" not in col_names:
        op.add_column("companies", sa.Column("data_adocao_ifrs", sa.Date(), nullable=True))


def downgrade() -> None:
    connection = op.get_bind()
    columns = sa.inspect(connection).get_columns("companies")
    col_names = [c["name"] for c in columns]
    if "data_adocao_ifrs" in col_names:
        op.drop_column("companies", "data_adocao_ifrs")

