"""add_title

Revision ID: 0181ec2f340b
Revises: 0ec2e90bbbab
Create Date: 2025-06-11 12:19:52.927528

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0181ec2f340b'
down_revision: Union[str, None] = '0ec2e90bbbab'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # 1) add title as nullable for now
    op.add_column(
        "events",
        sa.Column("title", sa.String(), nullable=True),
    )
    # 2) backfill existing rows with a default
    op.execute(
        "UPDATE events SET title = 'Untitled Event' WHERE title IS NULL"
    )
    # 3) now make it non-nullable
    op.alter_column("events", "title", nullable=False)


def downgrade():
    op.drop_column("events", "title")
