from operator import and_
from typing import Any, Dict, List, Optional
from uuid import UUID
import numpy as np
from sqlalchemy import select, func
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.functions import user
from .models import Image, Embedding, Event
from .schemas import EmbeddingIn, EventIn
from deepface import DeepFace


async def create_event(
    db: AsyncSession,
    user_id: str,
    *,
    payload: EventIn
) -> Event:
    """
    Create a new Event from an EventIn schema.
    """
    ev = Event(
        user_id=user_id,
        date=payload.date,
        description=payload.description,
    )
    db.add(ev)
    await db.commit()
    await db.refresh(ev)
    return ev


async def get_event(
    db: AsyncSession,
    event_id: int
) -> Optional[Event]:
    """
    Fetch one Event by its primary key.
    """
    q = await db.execute(
        select(Event).where(Event.id == event_id)
    )
    return q.scalars().first()


async def get_all_events(
    db: AsyncSession,
    limit: int = 100,
    offset: int = 0
) -> List[Event]:
    """
    Fetch a page of Events.
    """
    q = await db.execute(
        select(Event).order_by(Event.date.desc())
        .offset(offset)
        .limit(limit)
    )
    return q.scalars().all()


async def update_event(
    db: AsyncSession,
    event_id: int,
    *,
    payload: EventIn,
    user_id: str
) -> Optional[Event]:
    """
    Update an existing Event. Returns the updated object, or None if not found.
    """
    q = await db.execute(
        select(Event).where(Event.id == event_id)
    )
    ev = q.scalars().first()
    if not ev:
        return None

    if ev.user_id != user_id:
        return None

    ev.user_id = payload.user_id
    ev.date = payload.date
    ev.description = payload.description

    db.add(ev)
    await db.commit()
    await db.refresh(ev)
    return ev


async def delete_event(
    db: AsyncSession,
    event_id: int,
    user_id: str,
) -> bool:
    """
    Delete one Event by its ID. Returns True if deleted, False if not found.
    """
    q = await db.execute(
        select(Event).where(Event.id == event_id and Event.user_id == user_id)
    )
    ev = q.scalars().first()
    if not ev:
        return False

    if ev.user_id != user_id:
        return False

    await db.delete(ev)
    await db.commit()
    return True


async def get_or_create_image(
    db: AsyncSession, path: str, event_id: int
) -> Image:
    stmt = pg_insert(Image).values(path=path, event_id=event_id)
    stmt = stmt.on_conflict_do_nothing(
        index_elements=[Image.path]
    ).returning(Image.id)
    res = await db.execute(stmt)
    row = res.first()
    if row:
        image_id = row[0]
    else:
        # already existed: fetch it
        q = await db.execute(select(Image).where(Image.path == path))
        image = q.scalar_one()
        return image
    await db.commit()
    return await db.get(Image, image_id)


async def get_image(
    db: AsyncSession, image_id: int
) -> Image:
    q = await db.execute(
        select(Image).where(Image.id == image_id)
    )
    return q.scalars().first()


async def get_all_images(
    db: AsyncSession, event_id, limit=100
):
    q = await get_event(db, event_id)

    if q:
        return q.images

    return []


async def add_embedding(
    db: AsyncSession, image_id: int, bbox: dict, vector: np.ndarray
) -> Embedding:
    emb = Embedding(
        image_id=image_id,
        x=bbox["x"],
        y=bbox["y"],
        w=bbox["w"],
        h=bbox["h"],
        vector=vector,
    )
    db.add(emb)
    await db.commit()
    await db.refresh(emb)
    return emb


async def get_embedding_by_id(
    db: AsyncSession, emb_id: int
) -> Embedding:

    q = await db.execute(
        select(Embedding).where(Embedding.id == emb_id)
    )
    return q.scalars().first()


async def delete_image_from_db(
    db: AsyncSession, image: Image
):
    await db.delete(image)
    await db.commit()


async def list_embeddings(
    db: AsyncSession, image_id: int
):
    q = await db.execute(
        select(Embedding).where(Embedding.image_id == image_id)
    )
    return q.scalars().all()


async def find_similar(
    db: AsyncSession,
    vector: List[float],
    event_id: int,
    limit: int = 5,
    metric: str = "cosine",
) -> List[Dict[str, Any]]:
    # 1) threshold and convenience alias
    threshold = DeepFace.verification.find_threshold("ArcFace", metric)
    vec = vector

    # 2) build a select that computes distance + row_number per image
    dist = Embedding.vector.cosine_distance(vec).label("distance")
    row_num = func.row_number().over(
        partition_by=Embedding.image_id,
        order_by=dist
    ).label("row_num")

    base_q = (
        select(
            Embedding.id.label("embedding_id"),
            Embedding.image_id,
            Image.path.label("image_path"),
            Embedding.x, Embedding.y, Embedding.w, Embedding.h,
            dist,
            row_num,
        )
        .join(Image, Embedding.image_id == Image.id)
        # only candidates under threshold
        .where(and_(dist <= threshold, Image.event_id == event_id))
    )

    # 3) wrap it in a subquery, filter row_num == 1, sort by distance, limit
    subq = base_q.subquery()
    final_q = (
        select(subq)
        .where(subq.c.row_num == 1)    # best per image
        .order_by(subq.c.distance)     # now global order
        .limit(limit)
    )

    res = await db.execute(final_q)
    rows = res.mappings().all()  # each row is a dict

    # 4) return the plain dicts under your MatchResult schema
    out = []
    for r in rows:
        out.append({
            "embedding_id": r["embedding_id"],
            "image_id":     r["image_id"],
            "image_path":   r["image_path"],
            "distance":     r["distance"],
            "threshold":    threshold,
            "bbox": {
                "x": r["x"], "y": r["y"],
                "w": r["w"], "h": r["h"],
            },
        })
    return out
