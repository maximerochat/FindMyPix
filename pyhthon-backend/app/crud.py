import numpy as np
from sqlalchemy import select
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
):
    threshold = DeepFace.verification.find_threshold("ArcFace", metric)
    vec = vector
    stmt = (
        select(Embedding, Embedding.vector.cosine_distance(vec).label("distance"))
        .where(Embedding.vector.cosine_distance(vec) <= threshold)
        .order_by(Embedding.vector.cosine_distance(vec))
        .limit(limit)
    )
    res = await db.execute(stmt)
    pairs = res.all()
    return [
        {"embedding_id": e.id, "image_id": e.image_id,
         "distance": d, "threshold": threshold,
         "bbox": {"x": e.x, "y": e.y, "w": e.w, "h": e.h}}
        for e, d in pairs
    ]
