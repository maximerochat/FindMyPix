"""add events table, default event, and image.event_id

Revision ID: 425490029b1e
Revises: 348a9aba74f3
Create Date: 2025-06-10 11:34:30.281333
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers, used by Alembic.
revision: str = '425490029b1e'
down_revision: Union[str, None] = '348a9aba74f3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # 1) create events table
    op.create_table(
        "events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("date", sa.DateTime(), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
    )

    # 2) insert the default “zero” event
    insert_sql = sa.text(
        """
        INSERT INTO events(id, user_id, date, description)
        VALUES(:id, :user_id, :date, :description)
        """
    ).bindparams(
        id=0,
        user_id="00000000-0000-0000-0000-000000000000",
        date=datetime.utcnow(),
        description="Default event",
    )
    op.execute(insert_sql)

    # 3) add event_id column on images, defaulting existing rows to 0
    op.add_column(
        "images",
        sa.Column(
            "event_id",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
    )

    # 4) create FK constraint
    op.create_foreign_key(
        "fk_images_event_id_events",
        "images", "events",
        local_cols=["event_id"],
        remote_cols=["id"],
        ondelete="CASCADE",
    )

    # 5) drop the server_default so future INSERTs must pass event_id
    op.alter_column("images", "event_id", server_default=None)


def downgrade():
    # reverse in exact opposite order
    # 1) drop FK
    op.drop_constraint("fk_images_event_id_events",
                       "images", type_="foreignkey")
    # 2) drop column
    op.drop_column("images", "event_id")
    # 3) delete default event row
    op.execute("DELETE FROM events WHERE id = 0")
    # 4) drop table
    op.drop_table("events")
