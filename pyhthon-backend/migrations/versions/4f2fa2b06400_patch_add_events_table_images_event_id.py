"""patch: add events table + images.event_id

Revision ID: 4f2fa2b06400
Revises: 425490029b1e
Create Date: 2025-06-10 12:19:07.183634

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4f2fa2b06400'
down_revision: Union[str, None] = '425490029b1e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # 1) events table
    op.execute("""
        CREATE TABLE IF NOT EXISTS events (
          id          integer      PRIMARY KEY,
          user_id     uuid         NOT NULL,
          date        timestamp    NOT NULL,
          description varchar
        );
    """)

    # 2) default event
    op.execute("""
        INSERT INTO events(id, user_id, date, description)
        SELECT 0,
               '00000000-0000-0000-0000-000000000000'::uuid,
               now(),
               'Default event'
        WHERE NOT EXISTS(SELECT 1 FROM events WHERE id = 0);
    """)

    # 3) add event_id to images
    op.execute("""
        ALTER TABLE images
        ADD COLUMN IF NOT EXISTS event_id integer NOT NULL DEFAULT 0;
    """)

    # 4) create FK
    op.execute("""
        ALTER TABLE images
        ADD CONSTRAINT fk_images_event_id_events
          FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE
        ;
    """)

    # 5) remove default
    op.execute("""
        ALTER TABLE images
        ALTER COLUMN event_id DROP DEFAULT;
    """)


def downgrade():
    # undo in reverse
    op.execute(
        "ALTER TABLE images DROP CONSTRAINT IF EXISTS fk_images_event_id_events;")
    op.execute("ALTER TABLE images DROP COLUMN IF EXISTS event_id;")
    op.execute("DELETE FROM events WHERE id = 0;")
    op.execute("DROP TABLE IF EXISTS events;")
