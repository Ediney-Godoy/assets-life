"""Unique codigo por empresa (classes/contas)

Revision ID: 2c8f5b1d7a90
Revises: c0b1d7de8c3f
Create Date: 2026-02-06

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "2c8f5b1d7a90"
down_revision: Union[str, Sequence[str], None] = "c0b1d7de8c3f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_index(op.f("ix_classes_contabeis_codigo"), table_name="classes_contabeis")
    op.create_unique_constraint("uq_classe_empresa", "classes_contabeis", ["empresa_id", "codigo"])
    op.create_index(op.f("ix_classes_contabeis_codigo"), "classes_contabeis", ["codigo"], unique=False)

    op.drop_index(op.f("ix_contas_contabeis_codigo"), table_name="contas_contabeis")
    op.create_unique_constraint("uq_conta_empresa", "contas_contabeis", ["empresa_id", "codigo"])
    op.create_index(op.f("ix_contas_contabeis_codigo"), "contas_contabeis", ["codigo"], unique=False)


def downgrade() -> None:
    op.drop_constraint("uq_conta_empresa", "contas_contabeis", type_="unique")
    op.drop_index(op.f("ix_contas_contabeis_codigo"), table_name="contas_contabeis")
    op.create_index(op.f("ix_contas_contabeis_codigo"), "contas_contabeis", ["codigo"], unique=True)

    op.drop_constraint("uq_classe_empresa", "classes_contabeis", type_="unique")
    op.drop_index(op.f("ix_classes_contabeis_codigo"), table_name="classes_contabeis")
    op.create_index(op.f("ix_classes_contabeis_codigo"), "classes_contabeis", ["codigo"], unique=True)

