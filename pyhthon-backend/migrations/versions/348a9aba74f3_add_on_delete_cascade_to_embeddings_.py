"""add ON DELETE CASCADE to embeddings.image_id fk

Revision ID: 348a9aba74f3
Revises: d809914e372a
Create Date: 2025-06-06 12:34:30.420470

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '348a9aba74f3'
down_revision: Union[str, None] = 'd809914e372a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # drop the existing constraint
    op.drop_constraint(
        "embeddings_image_id_fkey",  # ← adjust to your actual constraint name
        "embeddings",
        type_="foreignkey",
    )
    # re-create with ON DELETE CASCADE
    op.create_foreign_key(
        "embeddings_image_id_fkey",
        "embeddings",
        "images",
        ["image_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade():
    op.drop_constraint("embeddings_image_id_fkey",
                       "embeddings", type_="foreignkey")
    op.create_foreign_key(
        "embeddings_image_id_fkey",
        "embeddings",
        "images",
        ["image_id"],
        ["id"],
        # no ondelete here
    )
