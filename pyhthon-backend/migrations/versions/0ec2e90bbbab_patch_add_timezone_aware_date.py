"""patch: add timezone aware date

Revision ID: 0ec2e90bbbab
Revises: 4f2fa2b06400
Create Date: 2025-06-10 12:34:54.174518

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0ec2e90bbbab'
down_revision: Union[str, None] = '4f2fa2b06400'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column(
        "events",
        "date",
        existing_type=sa.DateTime(),          # without tz
        type_=sa.DateTime(timezone=True),     # with tz
        postgresql_using="date AT TIME ZONE 'UTC'"
    )


def downgrade() -> None:
    """Downgrade schema."""
    pass
