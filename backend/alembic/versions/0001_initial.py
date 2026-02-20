"""initial

Revision ID: 0001_initial
Revises: 
Create Date: 2026-02-16 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'labobservation',
        sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
        sa.Column('patient_id', sa.String(), nullable=False),
        sa.Column('test_name', sa.String(), nullable=False),
        sa.Column('loinc', sa.String(), nullable=True),
        sa.Column('value', sa.Float(), nullable=False),
        sa.Column('unit', sa.String(), nullable=True),
        sa.Column('timestamp', sa.TIMESTAMP(), nullable=False),
    )


def downgrade():
    op.drop_table('labobservation')
