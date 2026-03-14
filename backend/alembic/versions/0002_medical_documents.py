"""add medical documents

Revision ID: 0002_medical_documents
Revises: 0001_initial
Create Date: 2026-03-14 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = "0002_medical_documents"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "medicaldocument",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("patient_id", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("record_type", sa.String(), nullable=False),
        sa.Column("source", sa.String(), nullable=False),
        sa.Column("provider", sa.String(), nullable=False),
        sa.Column("document_date", sa.String(), nullable=False),
        sa.Column("file_name", sa.String(), nullable=False),
        sa.Column("content_type", sa.String(), nullable=False),
        sa.Column("encrypted_blob", sa.Text(), nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(), nullable=False),
    )
    op.create_index(op.f("ix_medicaldocument_patient_id"), "medicaldocument", ["patient_id"], unique=False)


def downgrade():
    op.drop_index(op.f("ix_medicaldocument_patient_id"), table_name="medicaldocument")
    op.drop_table("medicaldocument")
