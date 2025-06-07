from typing import Any, Dict, List
import numpy as np
from sqlalchemy import select, func
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession
from .models import Image, Embedding
from .schemas import EmbeddingIn
from deepface import DeepFace


async def get_or_create_image(
    db: AsyncSession, path: str
) -> Image:
    stmt = pg_insert(Image).values(path=path)
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
    db: AsyncSession, limit=100
):
    q = await db.execute(
        select(Image).limit(limit)
    )
    return q.scalars().all()


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
    vector: np.ndarray,
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
        .where(dist <= threshold)     # only candidates under threshold
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
