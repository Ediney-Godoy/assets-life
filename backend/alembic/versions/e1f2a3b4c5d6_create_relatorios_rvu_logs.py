"""Create relatorios_rvu_logs table for RVU reports logging

Revision ID: e1f2a3b4c5d6
Revises: 2c8f5b1d7a90
Create Date: 2026-02-21

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e1f2a3b4c5d6"
down_revision: Union[str, Sequence[str], None] = "2c8f5b1d7a90"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    connection = op.get_bind()
    result = connection.execute(
        sa.text(
            """
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'relatorios_rvu_logs'
            )
            """
        )
    )
    table_exists = result.scalar()

    if not table_exists:
        op.create_table(
            "relatorios_rvu_logs",
            sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
            sa.Column("data_emissao", sa.DateTime(), server_default=sa.func.now(), nullable=False),
            sa.Column("usuario_id", sa.Integer(), sa.ForeignKey("usuarios.id"), nullable=True),
            sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("companies.id"), nullable=True),
            sa.Column("tipo_arquivo", sa.String(length=50), nullable=False),
            sa.Column("parametros_usados", sa.Text(), nullable=True),
            sa.Column("caminho_arquivo", sa.Text(), nullable=True),
        )
        op.create_index(
            op.f("ix_relatorios_rvu_logs_data_emissao"),
            "relatorios_rvu_logs",
            ["data_emissao"],
            unique=False,
        )
        op.create_index(
            op.f("ix_relatorios_rvu_logs_empresa_id"),
            "relatorios_rvu_logs",
            ["empresa_id"],
            unique=False,
        )
        op.create_index(
            op.f("ix_relatorios_rvu_logs_usuario_id"),
            "relatorios_rvu_logs",
            ["usuario_id"],
            unique=False,
        )


def downgrade() -> None:
    op.drop_index(op.f("ix_relatorios_rvu_logs_usuario_id"), table_name="relatorios_rvu_logs")
    op.drop_index(op.f("ix_relatorios_rvu_logs_empresa_id"), table_name="relatorios_rvu_logs")
    op.drop_index(op.f("ix_relatorios_rvu_logs_data_emissao"), table_name="relatorios_rvu_logs")
    op.drop_table("relatorios_rvu_logs")

