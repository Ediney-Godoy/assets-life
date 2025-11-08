"""
Create RVU auxiliary tables: revisoes_comentarios, revisoes_historico, auditoria_rvu

Revision ID: 8c7d9e2f1a00
Revises: d1a2b3c4e5f6
Create Date: 2025-11-04
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '8c7d9e2f1a00'
down_revision: Union[str, Sequence[str], None] = 'd1a2b3c4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # revisoes_comentarios
    op.create_table(
        'revisoes_comentarios',
        sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
        sa.Column('ativo_id', sa.Integer(), sa.ForeignKey('revisoes_itens.id'), nullable=False),
        sa.Column('supervisor_id', sa.Integer(), sa.ForeignKey('usuarios.id'), nullable=False),
        sa.Column('revisor_id', sa.Integer(), sa.ForeignKey('usuarios.id'), nullable=False),
        sa.Column('comentario', sa.Text(), nullable=False),
        sa.Column('data_comentario', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('status', sa.String(length=20), server_default='Pendente', nullable=False),
        sa.Column('tipo', sa.String(length=20), server_default='normal', nullable=False),
        sa.Column('resposta', sa.Text(), nullable=True),
        sa.Column('data_resposta', sa.DateTime(), nullable=True),
        sa.Column('respondido_por', sa.Integer(), sa.ForeignKey('usuarios.id'), nullable=True),
    )
    op.create_index(op.f('ix_revisoes_comentarios_id'), 'revisoes_comentarios', ['id'], unique=False)
    op.create_index(op.f('ix_revisoes_comentarios_ativo_id'), 'revisoes_comentarios', ['ativo_id'], unique=False)

    # revisoes_historico
    op.create_table(
        'revisoes_historico',
        sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
        sa.Column('ativo_id', sa.Integer(), sa.ForeignKey('revisoes_itens.id'), nullable=False),
        sa.Column('revisor_id', sa.Integer(), sa.ForeignKey('usuarios.id'), nullable=True),
        sa.Column('supervisor_id', sa.Integer(), sa.ForeignKey('usuarios.id'), nullable=True),
        sa.Column('vida_util_anterior', sa.Integer(), nullable=True),
        sa.Column('vida_util_revisada', sa.Integer(), nullable=True),
        sa.Column('motivo_reversao', sa.Text(), nullable=True),
        sa.Column('data_reversao', sa.DateTime(), nullable=True),
        sa.Column('acao', sa.String(length=20), nullable=False),
        sa.Column('data_evento', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=True),
    )
    op.create_index(op.f('ix_revisoes_historico_id'), 'revisoes_historico', ['id'], unique=False)
    op.create_index(op.f('ix_revisoes_historico_ativo_id'), 'revisoes_historico', ['ativo_id'], unique=False)

    # auditoria_rvu
    op.create_table(
        'auditoria_rvu',
        sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
        sa.Column('usuario_id', sa.Integer(), sa.ForeignKey('usuarios.id'), nullable=True),
        sa.Column('acao', sa.String(length=100), nullable=False),
        sa.Column('entidade', sa.String(length=100), nullable=False),
        sa.Column('entidade_id', sa.Integer(), nullable=True),
        sa.Column('detalhes', sa.Text(), nullable=True),
        sa.Column('data_evento', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_auditoria_rvu_id'), 'auditoria_rvu', ['id'], unique=False)
    op.create_index(op.f('ix_auditoria_rvu_usuario_id'), 'auditoria_rvu', ['usuario_id'], unique=False)


def downgrade() -> None:
    # Drop indexes then tables in reverse order
    op.drop_index(op.f('ix_auditoria_rvu_usuario_id'), table_name='auditoria_rvu')
    op.drop_index(op.f('ix_auditoria_rvu_id'), table_name='auditoria_rvu')
    op.drop_table('auditoria_rvu')

    op.drop_index(op.f('ix_revisoes_historico_ativo_id'), table_name='revisoes_historico')
    op.drop_index(op.f('ix_revisoes_historico_id'), table_name='revisoes_historico')
    op.drop_table('revisoes_historico')

    op.drop_index(op.f('ix_revisoes_comentarios_ativo_id'), table_name='revisoes_comentarios')
    op.drop_index(op.f('ix_revisoes_comentarios_id'), table_name='revisoes_comentarios')
    op.drop_table('revisoes_comentarios')