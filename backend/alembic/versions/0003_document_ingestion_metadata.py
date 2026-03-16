"""add document ingestion metadata

Revision ID: 0003_document_ingestion_metadata
Revises: 0002_medical_documents
Create Date: 2026-03-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = "0003_document_ingestion_metadata"
down_revision = "0002_medical_documents"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("medicaldocument", sa.Column("source_system", sa.String(), nullable=False, server_default="unknown"))
    op.add_column("medicaldocument", sa.Column("facility", sa.String(), nullable=True))
    op.add_column("medicaldocument", sa.Column("extraction_profile", sa.String(), nullable=False, server_default="generic_general_record"))
    op.add_column("medicaldocument", sa.Column("ocr_status", sa.String(), nullable=False, server_default="pending"))
    op.add_column("medicaldocument", sa.Column("extraction_status", sa.String(), nullable=False, server_default="pending"))


def downgrade():
    op.drop_column("medicaldocument", "extraction_status")
    op.drop_column("medicaldocument", "ocr_status")
    op.drop_column("medicaldocument", "extraction_profile")
    op.drop_column("medicaldocument", "facility")
    op.drop_column("medicaldocument", "source_system")
